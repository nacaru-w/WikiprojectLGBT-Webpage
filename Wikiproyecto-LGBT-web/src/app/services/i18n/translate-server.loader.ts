import { inject, Injectable, TransferState } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { i18nStateKey } from './i18n.config';

// Translation dictionaries are bundled into the server build (this file is only
// referenced from app.config.server.ts, so the JSON never reaches the browser
// bundle). During SSR, HttpClient can't resolve the relative asset URL the
// browser fetches, so the server serves them inline instead.
import en from '../../../assets/i18n/en.json';
import es from '../../../assets/i18n/es.json';
import fr from '../../../assets/i18n/fr.json';

const TRANSLATIONS: Record<string, TranslationObject> = { en, es, fr };

/**
 * Server-side translation loader. Returns the requested language's bundled
 * dictionary and writes it to TransferState so the browser can pick it up on
 * hydration without issuing its own request — see TranslateBrowserLoader.
 */
@Injectable()
export class TranslateServerLoader implements TranslateLoader {
  private transferState = inject(TransferState);

  getTranslation(lang: string): Observable<TranslationObject> {
    const translations = TRANSLATIONS[lang] ?? {};
    this.transferState.set(i18nStateKey(lang), translations);
    return of(translations);
  }
}
