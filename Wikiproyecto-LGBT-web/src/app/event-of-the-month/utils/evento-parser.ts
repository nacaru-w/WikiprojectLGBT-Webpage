import { CountryEvent, EventEdition, EventoData, NonCountryEvent } from '../models/event-data';
import { normalizeName, TOKEN_TO_ISO2 } from '../data/country-codes';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Header keyword → canonical field. The tables changed columns across years
// (e.g. "N. participantes" vs "Participantes", a "Total artículos" column added
// in 2024), so we resolve columns by header text rather than fixed positions.
const FIELD_MATCHERS: [keyof FieldIndex, RegExp][] = [
  ['month', /^mes$/],
  ['event', /evento|pais invitado/],
  ['challenge', /desaf/],
  ['participants', /participant/],
  ['created', /cread/],
  ['translated', /traducid/],
  ['expanded', /ampliad/],
  ['total', /^total/],
  // "Premio/Reconocimiento a la creación de artículos" vs "...biografías lésbicas".
  ['articlesPrize', /(premio|reconocimiento).*articulos/],
  ['lesbianPrize', /lesbic/],
];

interface FieldIndex {
  month?: number; event?: number; challenge?: number;
  participants?: number; created?: number; translated?: number; expanded?: number; total?: number;
  articlesPrize?: number; lesbianPrize?: number;
}

const WIKI_BASE = 'https://es.wikipedia.org/wiki/';
const wikiUrl = (target: string) => WIKI_BASE + encodeURI(target.trim().replace(/ /g, '_'));

function toNumber(cell: string | undefined): number | null {
  if (cell == null) return null;
  const m = cell.replace(/<[^>]+>/g, '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

/** Editor/winner usernames in a cell: {{u|X}}/{{u2|X}}/{{usuario|X}} and
 * [[Usuario:X]] links. Struck-out (revoked) entries and "-"/"Desierto" yield none. */
function parseUsers(cell: string | undefined): string[] {
  if (!cell) return [];
  const text = cell.replace(/<s\b[^>]*>[\s\S]*?<\/s>/gi, ''); // drop revoked winners
  const users = new Set<string>();
  const add = (raw: string) => {
    const name = raw.trim().replace(/_/g, ' ');
    if (name) users.add(name.charAt(0).toUpperCase() + name.slice(1));
  };
  for (const m of text.matchAll(/\{\{\s*(?:usuario|u2?)\s*\|\s*([^}|]+)/gi)) add(m[1]);
  for (const m of text.matchAll(/\[\[(?:usuario|usuaria|user):([^\]|]+)/gi)) add(m[1]);
  return [...users];
}

/** First wiki/external link target in a cell, as a URL. */
function firstLink(cell: string | undefined): string | null {
  if (!cell) return null;
  const wiki = cell.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  if (wiki) return wikiUrl(wiki[1]);
  const ext = cell.match(/\[(https?:\/\/[^\s\]]+)/);
  return ext ? ext[1] : null;
}

/** First wikilink target (page title) in a cell, e.g. for the challenge page. */
function firstWikiTarget(cell: string | undefined): string | null {
  const m = cell?.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  return m ? m[1].trim() : null;
}

type Classified =
  | { kind: 'country'; iso2: string }
  | { kind: 'event'; label: string; url: string | null }
  | null;

/** Classify the "Evento" cell as a single country, a non-country event, or empty. */
function classifyEvent(cell: string): Classified {
  const c = cell.replace(/<!--[\s\S]*?-->/g, '').trim(); // drop HTML comments (commented-out future picks)
  if (!c) return null;

  // Country via {{Bandera3|Name}}
  let m = c.match(/\{\{\s*[Bb]andera3?\s*\|\s*([^}|]+?)\s*\}\}/);
  if (m) {
    const iso2 = TOKEN_TO_ISO2[normalizeName(m[1])];
    if (iso2) return { kind: 'country', iso2 };
  }
  // Country via {{CODE}}
  m = c.match(/\{\{\s*([A-Za-z]{2,3})\s*\}\}/);
  if (m) {
    const iso2 = TOKEN_TO_ISO2[m[1].toUpperCase()];
    if (iso2) return { kind: 'country', iso2 };
  }
  // Otherwise a non-country event: clean to a readable label.
  const label = c
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2') // [[target|label]] → label
    .replace(/\[\[([^\]]+)\]\]/g, '$1')            // [[label]] → label
    .replace(/\{\{[^}]*\}\}/g, '')                 // drop templates
    .replace(/'''?/g, '')
    .trim();
  if (!label) return null; // scheduled-but-unnamed / empty month
  return { kind: 'event', label, url: firstLink(c) };
}

/** Parse the raw wikitext of Wikiproyecto:LGBT/Evento del mes into structured data. */
export function parseEventoDelMes(content: string): EventoData {
  // Isolate the "Ediciones" section (the per-year tables), stopping at the next heading.
  let body = content.slice(content.indexOf('==Ediciones=='));
  const nextHeading = body.search(/\n==[^=]/);
  if (nextHeading !== -1) body = body.slice(0, nextHeading);

  // Split into year blocks.
  const yearRe = /===\s*(\d{4})\s*===/g;
  const marks: { year: number; start: number }[] = [];
  let ym: RegExpExecArray | null;
  while ((ym = yearRe.exec(body))) marks.push({ year: +ym[1], start: ym.index });

  const countries = new Map<string, CountryEvent>();
  const events: NonCountryEvent[] = [];

  marks.forEach((mark, i) => {
    const blockText = body.slice(mark.start, marks[i + 1] ? marks[i + 1].start : body.length);
    const tableMatch = blockText.match(/\{\|[\s\S]*?\n\|\}/);
    if (!tableMatch) return;

    const segments = tableMatch[0].split(/\n\|-/);
    const headerSeg = segments.find(s => s.trim().startsWith('!'));
    if (!headerSeg) return;

    const cols = headerSeg.replace(/^\s*!/, '').split('!!').map(s => s.replace(/^\s*!/, '').trim());
    const idx: FieldIndex = {};
    cols.forEach((col, ci) => {
      const key = normalizeName(col);
      for (const [field, re] of FIELD_MATCHERS) {
        if (idx[field] === undefined && re.test(key)) idx[field] = ci;
      }
    });
    if (idx.month === undefined || idx.event === undefined) return;

    for (const seg of segments) {
      if (!seg.trim().startsWith('|')) continue; // skip table opener + header row
      const cells = seg.split(/\n\|/);
      cells.shift(); // drop the part before the first cell delimiter
      const trimmed = cells.map(c => c.trim());

      const monthIdx = MONTHS.indexOf(normalizeName(trimmed[idx.month] ?? ''));
      if (monthIdx === -1) continue; // skips the "Total" and any non-month rows

      const cls = classifyEvent(trimmed[idx.event] ?? '');
      if (!cls) continue; // empty / future-unnamed month

      const created = toNumber(trimmed[idx.created!]);
      const translated = toNumber(trimmed[idx.translated!]);
      const expanded = toNumber(trimmed[idx.expanded!]);
      const participants = toNumber(trimmed[idx.participants!]);
      let total = idx.total !== undefined ? toNumber(trimmed[idx.total]) : null;
      if (total == null && (created != null || translated != null || expanded != null)) {
        total = (created ?? 0) + (translated ?? 0) + (expanded ?? 0);
      }

      const edition: EventEdition = {
        year: mark.year, monthIdx, participants, created, translated, expanded, total,
        challengeUrl: firstLink(trimmed[idx.challenge!]),
        challengePage: firstWikiTarget(trimmed[idx.challenge!]),
        articlesPrize: parseUsers(idx.articlesPrize !== undefined ? trimmed[idx.articlesPrize] : undefined),
        lesbianPrize: parseUsers(idx.lesbianPrize !== undefined ? trimmed[idx.lesbianPrize] : undefined),
        upcoming: participants == null && total == null,
      };

      if (cls.kind === 'country') {
        let entry = countries.get(cls.iso2);
        if (!entry) { entry = { iso2: cls.iso2, editions: [] }; countries.set(cls.iso2, entry); }
        entry.editions.push(edition);
      } else {
        events.push({ ...edition, label: cls.label, url: cls.url });
      }
    }
  });

  return { countries: [...countries.values()], events };
}
