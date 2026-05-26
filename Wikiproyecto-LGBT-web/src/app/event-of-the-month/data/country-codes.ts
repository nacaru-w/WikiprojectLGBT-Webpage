/**
 * Maps the country tokens used in the "Evento del mes" tables to ISO 3166-1
 * alpha-2 codes (the region ids used by @svg-maps/world).
 *
 * Two token styles appear on the wiki:
 *  - `{{Bandera3|España}}`  → a Spanish country name (keyed normalized: lower-case, accent-stripped)
 *  - `{{CRI}}` / `{{CHI}}`  → es.wiki flag-template codes (ISO or IOC, keyed UPPER-case)
 *
 * The set of featured countries is small and Hispanophone-heavy, so a curated
 * table is more reliable than guessing from generic ISO/IOC lists (several codes
 * here are IOC, not ISO: CHI=Chile, GUA=Guatemala, HON=Honduras).
 */
export const TOKEN_TO_ISO2: Record<string, string> = {
  // {{Bandera3|Name}} — normalized Spanish names
  argentina: 'ar', bolivia: 'bo', brasil: 'br', chile: 'cl', colombia: 'co', 'costa rica': 'cr',
  cuba: 'cu', ecuador: 'ec', 'el salvador': 'sv', espana: 'es', guatemala: 'gt', honduras: 'hn',
  mexico: 'mx', nicaragua: 'ni', panama: 'pa', paraguay: 'py', peru: 'pe', 'puerto rico': 'pr',
  'republica dominicana': 'do', uruguay: 'uy', venezuela: 've',
  // {{CODE}} — es.wiki flag-template codes (uppercase)
  ARG: 'ar', BOL: 'bo', BRA: 'br', CHI: 'cl', CHL: 'cl', COL: 'co', CRI: 'cr', CUB: 'cu', ECU: 'ec',
  SLV: 'sv', ESP: 'es', GUA: 'gt', GTM: 'gt', HON: 'hn', HND: 'hn', MEX: 'mx', NIC: 'ni', PAN: 'pa',
  PAR: 'py', PRY: 'py', PER: 'pe', PRI: 'pr', DOM: 'do', URU: 'uy', URY: 'uy', VEN: 've',
};

/** Lower-cases and strips accents, for matching Spanish country names. */
export function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Localized country name from an ISO alpha-2 code, e.g. ('es','en') → "Spain". */
export function localizedCountryName(iso2: string, lang: string): string {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(iso2.toUpperCase()) ?? iso2.toUpperCase();
  } catch {
    return iso2.toUpperCase();
  }
}
