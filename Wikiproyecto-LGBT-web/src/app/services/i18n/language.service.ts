import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from '../storage/local-storage.service';
import { DEFAULT_LANG, SUPPORTED_LANGS, SupportedLang } from './i18n.config';

/** Key (within the app's storage namespace) the chosen language persists under. */
const LANG_STORAGE_KEY = 'preferred-lang';

/**
 * Native display names for the switcher. Language names are conventionally
 * shown in their own language (not translated), so these stay constant.
 */
export const LANG_LABELS: Record<SupportedLang, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
};

/**
 * Centralizes runtime language switching. SSR always renders DEFAULT_LANG
 * (a per-request locale can't reach the app — see the i18n notes), so the
 * user's saved choice is restored on the browser after hydration. Switching
 * via setLang() triggers the browser loader to fetch the new dictionary and
 * persists the choice (via LocalStorageService) for the next visit.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);
  private storage = inject(LocalStorageService);

  /** The language currently displayed; drives the switcher's active state. */
  readonly currentLang = signal<SupportedLang>(DEFAULT_LANG);
  readonly supportedLangs = SUPPORTED_LANGS;

  constructor() {
    // On the server the stored value is always null (no localStorage), so this
    // is effectively a browser-only restore of the user's previous choice.
    const saved = this.readStoredLang();
    if (saved && saved !== this.currentLang()) {
      this.apply(saved);
    } else if (isPlatformBrowser(this.platformId)) {
      // Keep <html lang> in sync with the rendered language even on the default
      // load (index.html ships a static lang attribute that may not match).
      document.documentElement.lang = this.currentLang();
    }
  }

  /** Switch the active language and remember it for next time. */
  setLang(lang: SupportedLang): void {
    if (lang === this.currentLang()) {
      return;
    }
    this.apply(lang);
    this.storage.set(LANG_STORAGE_KEY, lang);
  }

  private apply(lang: SupportedLang): void {
    // use() loads the dictionary (subscribing internally) and emits the change.
    this.translate.use(lang);
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.lang = lang;
    }
  }

  private readStoredLang(): SupportedLang | null {
    const saved = this.storage.get(LANG_STORAGE_KEY);
    return this.isSupported(saved) ? saved : null;
  }

  private isSupported(lang: string | null): lang is SupportedLang {
    return !!lang && (SUPPORTED_LANGS as readonly string[]).includes(lang);
  }
}
