import { makeStateKey, StateKey } from '@angular/core';
import type { TranslationObject } from '@ngx-translate/core';

/** Language rendered on first load and used as fallback for missing keys. */
export const DEFAULT_LANG = 'es';

/** Languages the app ships translation files for (src/assets/i18n/<lang>.json). */
export const SUPPORTED_LANGS = ['es', 'en', 'fr'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Public URL the browser fetches translation files from. */
export const I18N_HTTP_PREFIX = '/assets/i18n/';
export const I18N_HTTP_SUFFIX = '.json';

/**
 * TransferState key under which the server stashes a language's dictionary so
 * the browser can hydrate without re-fetching it. One key per language.
 */
export const i18nStateKey = (lang: string): StateKey<TranslationObject> =>
  makeStateKey<TranslationObject>(`i18n-${lang}`);
