// Month index (0–11) → the existing `stats.chart.months.*` i18n key, so the
// event page reuses the already-translated month names.
const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function monthTranslateKey(monthIdx: number): string {
  return 'stats.chart.months.' + MONTH_KEYS[monthIdx];
}
