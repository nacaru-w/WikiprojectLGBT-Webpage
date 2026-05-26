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
  const byUser = new Map<string, ChallengeParticipant>();

  for (const seg of segments) {
    if (!seg.trim().startsWith('|')) continue; // skip table opener + header
    // Cells may be inline (`||`) or per-line (`\n|`); normalize both to `||`.
    const cells = seg.trim().replace(/\n\s*\|/g, '||').replace(/^\|/, '').split('||').map(c => c.trim());

    const title = articleTitle(cells[idx.article!]);
    if (!title) continue;
    const size = idx.size !== undefined ? sizeBytes(cells[idx.size]) : null;
    const contributors = idx.contributor !== undefined ? usersIn(cells[idx.contributor]) : [];

    const article: ChallengeArticle = { title, url: WIKI + encodeURI(title.replace(/ /g, '_')), size, contributors };
    articles.push(article);
    for (const user of contributors) {
      const entry = byUser.get(user) ?? { user, articleCount: 0, bytes: 0, articles: [] };
      entry.articleCount += 1;
      entry.bytes += size ?? 0;
      entry.articles.push(article);
      byUser.set(user, entry);
    }
  }

  articles.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const participants = [...byUser.values()].sort((a, b) => b.articleCount - a.articleCount || b.bytes - a.bytes);
  for (const p of participants) p.articles.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  return { articles, participants };
}
