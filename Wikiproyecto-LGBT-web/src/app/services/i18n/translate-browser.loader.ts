import { HttpClient } from '@angular/common/http';
import { inject, Injectable, TransferState } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { I18N_HTTP_PREFIX, I18N_HTTP_SUFFIX, i18nStateKey } from './i18n.config';

/**
 * Browser-side translation loader. For the language the server already rendered,
 * the dictionary arrives via TransferState, so hydration needs no HTTP request
 * (and there's no flash of untranslated keys). Any other language — e.g. the
 * user switching language at runtime — is fetched over HTTP from the static
 * assets and served from the browser/CDN cache thereafter.
 */
@Injectable()
export class TranslateBrowserLoader implements TranslateLoader {
  private http = inject(HttpClient);
  private transferState = inject(TransferState);

  getTranslation(lang: string): Observable<TranslationObject> {
    const key = i18nStateKey(lang);
    if (this.transferState.hasKey(key)) {
      const translations = this.transferState.get(key, {});
      // Consume once: a later in-app reloadLang() should hit the network.
      this.transferState.remove(key);
      return of(translations);
    }
    return this.http.get<TranslationObject>(`${I18N_HTTP_PREFIX}${lang}${I18N_HTTP_SUFFIX}`);
  }
}
