#!/usr/bin/env node
/**
 * sync-lgbt-articles.mjs
 * ----------------------
 * Builds a fresh snapshot of the Wikiproyecto LGBT tracked-article list and
 * emits the SQL needed to refresh the `lgbt_tracked_articles` table in ToolsDB.
 *
 * It fetches the wikitext of [[Wikiproyecto:LGBT/Seguimiento]] (a PetScan-
 * generated table of ~11k tracked pages), parses the rows, normalises the
 * article titles into a join key, and writes a self-contained SQL script to
 * STDOUT. Progress/diagnostics go to STDERR so they don't pollute the SQL.
 *
 * It does NOT connect to any database and contains NO credentials. The
 * generated SQL is meant to be piped into Toolforge's `sql tools` wrapper,
 * which authenticates as the tool on its own:
 *
 *     node scripts/sync-lgbt-articles.mjs \
 *       | ssh ...toolforge "become wmlgbt-es-web -- sql tools"
 *
 * (The `update-lgbt-articles` helper command wraps exactly that.)
 *
 * The join key matters: Seguimiento's "Page ID" column is the *talk* page id
 * (the category tracks article talk pages), and XTools doesn't expose page ids
 * at all — so member lookups join on the normalised article title instead.
 * `normaliseTitle()` MUST stay in sync with the identical helper in server.ts.
 */

const WIKI_API = 'https://es.wikipedia.org/w/api.php';
const PAGE = 'Wikiproyecto:LGBT/Seguimiento';
const DB = 's55888__wmlgbt_es';
const TABLE = 'lgbt_tracked_articles';
const META_TABLE = 'lgbt_sync_meta';
// Wikimedia's User-Agent policy wants a contact. This is a standalone `node`
// script, so it can't import the gitignored credentials file: pass the address
// via WIKI_CONTACT_EMAIL (the deploy wrapper sets it). The tool URL alone is a
// valid contact, so a missing env var still yields a compliant User-Agent.
const CONTACT_EMAIL = process.env.WIKI_CONTACT_EMAIL;
const USER_AGENT =
  'WikiproyectoLGBT-web sync-lgbt-articles (https://wmlgbt-es-web.toolforge.org' +
  (CONTACT_EMAIL ? `; ${CONTACT_EMAIL}` : '') +
  ')';
const INSERT_BATCH = 500;

const log = (...args) => console.error('[sync-lgbt]', ...args);

/**
 * Normalise a MediaWiki title into the canonical match key. Keep this byte-for-
 * byte identical to the copy in server.ts so the IN (...) lookup matches.
 */
function normaliseTitle(title) {
  let t = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length === 0) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** MySQL string-literal escaping for the small set of chars titles may contain. */
function sqlString(value) {
  return (
    "'" +
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/[\r\n]+/g, ' ') +
    "'"
  );
}

/** "20241130153532" -> "2024-11-30 15:35:32"; anything malformed -> null. */
function toDatetime(raw) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec((raw || '').trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

async function fetchWikitext() {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(
    PAGE,
  )}&prop=wikitext&format=json&formatversion=2`;
  log('Fetching wikitext from', PAGE);
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`MediaWiki API returned HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.parse?.wikitext;
  if (typeof text !== 'string') throw new Error('Unexpected MediaWiki API response shape');
  log(`Fetched ${text.length} bytes of wikitext`);
  return text;
}

/** Extract the "Last updated on ..." marker PetScan writes above the table. */
function extractSourceTimestamp(wikitext) {
  const m = /Last updated on ([^.\n]+)\./.exec(wikitext);
  return m ? m[1].trim() : null;
}

/**
 * Parse the PetScan wikitable rows. Each data row looks like:
 *   | [[&PROUD]] || 11055841 || 1 || 11 || 20241130153532
 * Cells are separated by "||"; titles never contain "|", so the split is safe.
 */
function parseRows(wikitext) {
  const rows = new Map(); // normTitle -> row (dedupe on the primary key)
  let skipped = 0;
  for (const rawLine of wikitext.split('\n')) {
    const line = rawLine.trimStart();
    if (!line.startsWith('|') || !line.includes('[[')) continue;
    // Drop the leading "| " and split into cells.
    const cells = line.replace(/^\|\s*/, '').split('||').map((c) => c.trim());
    const linkMatch = /\[\[\s*([^\]|]+?)\s*(?:\|[^\]]*)?\]\]/.exec(cells[0]);
    if (!linkMatch) {
      skipped++;
      continue;
    }
    const displayTitle = linkMatch[1].trim();
    const normTitle = normaliseTitle(displayTitle);
    if (!normTitle || normTitle.length > 255) {
      skipped++;
      continue;
    }
    const talkPageId = Number.parseInt(cells[1], 10);
    const namespace = Number.parseInt(cells[2], 10);
    const sizeBytes = Number.parseInt(cells[3], 10);
    rows.set(normTitle, {
      normTitle,
      displayTitle: displayTitle.slice(0, 255),
      talkPageId: Number.isFinite(talkPageId) ? talkPageId : null,
      namespace: Number.isFinite(namespace) ? namespace : null,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
      lastChange: toDatetime(cells[4]),
    });
  }
  return { rows: [...rows.values()], skipped };
}

function valueTuple(r) {
  const num = (n) => (n === null ? 'NULL' : String(n));
  const dt = r.lastChange ? `'${r.lastChange}'` : 'NULL';
  return `(${sqlString(r.normTitle)},${sqlString(r.displayTitle)},${num(r.talkPageId)},${num(
    r.namespace,
  )},${num(r.sizeBytes)},${dt})`;
}

function emitSql(rows, sourceTimestamp) {
  const out = [];
  out.push('-- Generated by scripts/sync-lgbt-articles.mjs. Do not edit by hand.');
  out.push(`-- ${rows.length} tracked articles; source "Last updated": ${sourceTimestamp ?? 'unknown'}`);
  out.push('SET NAMES utf8mb4;');
  out.push(`USE \`${DB}\`;`);
  // Schema creation lives outside the transaction (DDL would implicitly commit).
  out.push(`CREATE TABLE IF NOT EXISTS \`${TABLE}\` (
  \`norm_title\`     VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  \`display_title\`  VARCHAR(255) NOT NULL,
  \`talk_page_id\`   INT UNSIGNED DEFAULT NULL,
  \`list_namespace\` SMALLINT DEFAULT NULL,
  \`size_bytes\`     INT UNSIGNED DEFAULT NULL,
  \`last_change\`    DATETIME DEFAULT NULL,
  PRIMARY KEY (\`norm_title\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  out.push(`CREATE TABLE IF NOT EXISTS \`${META_TABLE}\` (
  \`id\`                  TINYINT NOT NULL DEFAULT 1,
  \`last_synced\`         DATETIME NOT NULL,
  \`article_count\`       INT NOT NULL,
  \`source_last_updated\` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  // Atomic refresh: clear + reload + record metadata, all-or-nothing.
  out.push('START TRANSACTION;');
  out.push(`DELETE FROM \`${TABLE}\`;`);
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const batch = rows.slice(i, i + INSERT_BATCH);
    out.push(
      `INSERT INTO \`${TABLE}\` (\`norm_title\`,\`display_title\`,\`talk_page_id\`,\`list_namespace\`,\`size_bytes\`,\`last_change\`) VALUES\n` +
        batch.map(valueTuple).join(',\n') +
        ';',
    );
  }
  out.push(
    `INSERT INTO \`${META_TABLE}\` (\`id\`,\`last_synced\`,\`article_count\`,\`source_last_updated\`) VALUES (1, NOW(), ${rows.length}, ${
      sourceTimestamp ? sqlString(sourceTimestamp) : 'NULL'
    }) ON DUPLICATE KEY UPDATE \`last_synced\`=VALUES(\`last_synced\`), \`article_count\`=VALUES(\`article_count\`), \`source_last_updated\`=VALUES(\`source_last_updated\`);`,
  );
  out.push('COMMIT;');
  return out.join('\n') + '\n';
}

async function main() {
  const wikitext = await fetchWikitext();
  const sourceTimestamp = extractSourceTimestamp(wikitext);
  const { rows, skipped } = parseRows(wikitext);
  log(`Parsed ${rows.length} unique articles (${skipped} lines skipped)`);
  log(`Source "Last updated": ${sourceTimestamp ?? 'unknown'}`);
  if (rows.length < 1000) {
    throw new Error(`Refusing to emit SQL: only ${rows.length} rows parsed (expected ~11k). Aborting to avoid wiping the table.`);
  }
  // Namespace distribution is useful to confirm we're tracking article talk pages.
  const nsCounts = {};
  for (const r of rows) nsCounts[r.namespace] = (nsCounts[r.namespace] || 0) + 1;
  log('Namespace distribution:', JSON.stringify(nsCounts));
  process.stdout.write(emitSql(rows, sourceTimestamp));
  log('SQL written to STDOUT.');
}

main().catch((err) => {
  log('FAILED:', err.message);
  process.exit(1);
});
