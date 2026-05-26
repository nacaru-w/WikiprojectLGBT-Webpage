/** One month's "Evento del mes" edition (the numeric results for that month). */
export interface EventEdition {
  year: number;
  /** 0 (January) – 11 (December). */
  monthIdx: number;
  participants: number | null;
  created: number | null;
  translated: number | null;
  expanded: number | null;
  /** Total articles. Taken from the table when present, else created+translated+expanded. */
  total: number | null;
  /** Link to that month's challenge page on es.wikipedia, when available. */
  challengeUrl: string | null;
  /** Wiki page title of that month's challenge (for fetching its details). */
  challengePage: string | null;
  /** Winner(s) of the "most articles created" award. */
  articlesPrize: string[];
  /** Winner(s) of the "most lesbian biographies created" award. */
  lesbianPrize: string[];
  /** True when the month is scheduled but has no results yet. */
  upcoming: boolean;
}

/** A country featured by one or more editions (shown on the map). */
export interface CountryEvent {
  /** ISO 3166-1 alpha-2, lowercase — matches the @svg-maps/world region ids. */
  iso2: string;
  editions: EventEdition[];
}

/** A non-country edition (Pride, Africa/Asia/Oceania, themes…) shown in the list. */
export interface NonCountryEvent extends EventEdition {
  /** Event name as written on the wiki (e.g. "Mes de África"). */
  label: string;
  /** Link to the event's own page, when available. */
  url: string | null;
}

/** Recurring themed event: all its instances grouped, with their totals summed. */
export interface ThemedEventGroup {
  label: string;
  /** Total articles summed across every instance of this event. */
  total: number;
  instances: NonCountryEvent[];
}

export interface EventoData {
  countries: CountryEvent[];
  events: NonCountryEvent[];
}

/** One worked article from a month's challenge page ("Artículos trabajados"). */
export interface ChallengeArticle {
  title: string;
  url: string;
  /** Size in bytes, parsed from the "Comentario y tamaño" column. */
  size: number | null;
  contributors: string[];
}

/** A contributor's aggregated tally for a month (derived from the article rows). */
export interface ChallengeParticipant {
  user: string;
  articleCount: number;
  bytes: number;
  /** Articles this contributor worked on, biggest first. */
  articles: ChallengeArticle[];
}

export interface ChallengeData {
  articles: ChallengeArticle[];
  participants: ChallengeParticipant[];
}
