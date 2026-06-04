import { ChallengeArticle, ChallengeData, ChallengeParticipant } from '../models/event-data';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

// Header keyword → which column holds the article, its size/comment, and the contributor.
const COL_MATCHERS: [keyof ColIndex, RegExp][] = [
  ['article', /articulo/],
  ['size', /tama|comentario|bytes/],
  ['contributor', /usuari/],
];
interface ColIndex { article?: number; size?: number; contributor?: number; }

const WIKI = 'https://es.wikipedia.org/wiki/';

/**
 * Newer editions live in the "Evento:" namespace, where the challenge page is
 * just an intro/rules landing page and the worked-articles table sits on a
 * "…/Artículos trabajados" subpage linked from the body (e.g. "Evento:Carnavales
 * de la Diversidad en Perú/Artículos trabajados"). When the landing page itself
 * has no parseable table, return that subpage title so it can be fetched and
 * parsed instead. Returns null for the older inline-table layout.
 */
export function findWorkedArticlesSubpage(content: string): string | null {
  // Match the link TARGET (before any "|label") ending in "/Artículos trabajados",
  // tolerant of the accent on the í.
  const m = content.match(/\[\[([^\]|]*?\/Art[ií]culos\s+trabajados)\s*(?:\|[^\]]*)?\]\]/i);
  return m ? m[1].trim() : null;
}

function usersIn(cell: string | undefined): string[] {
  const users = new Set<string>();
  const add = (raw: string) => {
    const name = raw.trim().replace(/_/g, ' ');
    if (name) users.add(name.charAt(0).toUpperCase() + name.slice(1));
  };
  for (const m of (cell ?? '').matchAll(/\{\{\s*(?:usuario|u2?)\s*\|\s*([^}|]+)/gi)) add(m[1]);
  for (const m of (cell ?? '').matchAll(/\[\[(?:usuario|usuaria|user):([^\]|]+)/gi)) add(m[1]);
  return [...users];
}

function articleTitle(cell: string | undefined): string {
  const m = cell?.match(/\[\[([^\]|]+)/);
  return m ? m[1].trim() : '';
}

function sizeBytes(cell: string | undefined): number | null {
  // {{esd}} (es.wiki's hard-space template) and literal non-breaking spaces are
  // sometimes used to group thousands in the byte count, e.g. "12{{esd}}345 bytes";
  // strip them so the digits parse as a single number.
  const cleaned = (cell ?? '')
    .replace(/\{\{\s*esd\s*\}\}/gi, '')
    .replace(/&nbsp;/gi, '')
    .replace(/[\u00A0\u202F]/g, '');
  const m = cleaned.match(/([\d.,]+)\s*bytes/i);
  return m ? parseInt(m[1].replace(/[.,]/g, ''), 10) : null;
}

/**
 * Parses a month's challenge page: finds the "Artículos trabajados" table and
 * returns the worked articles (sorted by size, biggest first) plus per-contributor
 * tallies (sorted by article count, then total bytes, both descending).
 */
export function parseChallengeArticles(content: string): ChallengeData {
  const empty: ChallengeData = { articles: [], participants: [] };

  // The worked-articles table sits under varying section names ("Artículos
  // trabajados", "Artículos creados", …), so locate it by its columns instead:
  // the one whose header has both an article and a contributor column.
  let segments: string[] | null = null;
  const idx: ColIndex = {};
  for (const table of content.match(/\{\|[\s\S]*?\n\|\}/g) ?? []) {
    const segs = table.split(/\n\|-/);
    const header = segs.find(s => s.includes('!'));
    if (!header) continue;
    const cols = header.split('!!').map(c => c.replace(/^\s*!/, '').trim());
    const cand: ColIndex = {};
    cols.forEach((col, i) => {
      const key = norm(col);
      for (const [field, re] of COL_MATCHERS) if (cand[field] === undefined && re.test(key)) cand[field] = i;
    });
    if (cand.article !== undefined && cand.contributor !== undefined) {
      segments = segs;
      Object.assign(idx, cand);
      break;
    }
  }
  if (!segments) return empty;

  const articles: ChallengeArticle[] = [];

  for (const seg of segments) {
    if (!seg.trim().startsWith('|')) continue; // skip table opener + header
    // Cells may be inline (`||`) or per-line (`\n|`); normalize both to `||`.
    const cells = seg.trim().replace(/\n\s*\|/g, '||').replace(/^\|/, '').split('||').map(c => c.trim());

    const title = articleTitle(cells[idx.article!]);
    if (!title) continue;
    const size = idx.size !== undefined ? sizeBytes(cells[idx.size]) : null;
    const contributors = idx.contributor !== undefined ? usersIn(cells[idx.contributor]) : [];

    articles.push({ title, url: WIKI + encodeURI(title.replace(/ /g, '_')), size, contributors });
  }

  return aggregate(articles);
}

/**
 * Build the per-contributor tallies from the article rows and sort everything:
 * articles by size (biggest first), participants by article count then bytes.
 * Kept separate so size enrichment ([[applyArticleSizes]]) can re-run it after
 * filling in byte sizes the wikitext didn't carry.
 */
function aggregate(articles: ChallengeArticle[]): ChallengeData {
  const byUser = new Map<string, ChallengeParticipant>();
  for (const article of articles) {
    for (const user of article.contributors) {
      const entry = byUser.get(user) ?? { user, articleCount: 0, bytes: 0, articles: [] };
      entry.articleCount += 1;
      entry.bytes += article.size ?? 0;
      entry.articles.push(article);
      byUser.set(user, entry);
    }
  }

  const sortedArticles = [...articles].sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const participants = [...byUser.values()].sort((a, b) => b.articleCount - a.articleCount || b.bytes - a.bytes);
  for (const p of participants) p.articles.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  return { articles: sortedArticles, participants };
}

/** Normalized title key for matching wiki article titles against API results:
 * underscores→spaces, collapsed whitespace, first letter upper-cased (MediaWiki
 * upper-cases the first letter but is case-sensitive after it). */
export function challengeTitleKey(title: string): string {
  const s = title.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The newer "Evento:" namespace subpages put edit-type words (Creado/Traducido/
 * Ampliado) in the size column instead of byte counts, so every article parses
 * with `size: null`. Given a map of title→current byte length (fetched in one
 * batched API call), fill those gaps and re-aggregate so the article and
 * participant orderings reflect real sizes. Articles already carrying a size are
 * left untouched.
 */
export function applyArticleSizes(data: ChallengeData, sizes: Map<string, number>): ChallengeData {
  // Re-key the fetched sizes through challengeTitleKey too, so both sides are
  // normalized the same way regardless of how the caller keyed the map.
  const byKey = new Map<string, number>();
  for (const [title, size] of sizes) byKey.set(challengeTitleKey(title), size);

  let changed = false;
  for (const article of data.articles) {
    if (article.size == null) {
      const size = byKey.get(challengeTitleKey(article.title));
      if (size != null) { article.size = size; changed = true; }
    }
  }
  return changed ? aggregate(data.articles) : data;
}
