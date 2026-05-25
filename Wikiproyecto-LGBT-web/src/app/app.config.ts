import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideQuillConfig } from 'ngx-quill';
import { withCredentialsInterceptor } from './interceptors/with-credentials.interceptor';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { TranslateBrowserLoader } from './services/i18n/translate-browser.loader';
import { DEFAULT_LANG } from './services/i18n/i18n.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withHttpTransferCacheOptions({
      // https://angular.dev/guide/ssr#caching-data-when-using-httpclient
      filter: (_) => false,
    })),
    provideAnimationsAsync(),
    provideHttpClient(withFetch(), withInterceptors([withCredentialsInterceptor])),
    provideCharts(withDefaultRegisterables()),
    // Sanitize HTML bound into/out of the editor so stored post content can't inject scripts.
    provideQuillConfig({ sanitize: true }),
    // i18n. The browser loader reads server-rendered translations from
    // TransferState first (see TranslateBrowserLoader); the server overrides
    // this loader to read from disk (see app.config.server.ts).
    // i18n. The default language is loaded eagerly from AppComponent (see its
    // constructor) so it runs during the SSR render phase, where the disk-path
    // token is available. The browser loader reads server-rendered translations
    // from TransferState first (see TranslateBrowserLoader); the server config
    // overrides this loader to read from disk (see app.config.server.ts).
    provideTranslateService({
      lang: DEFAULT_LANG,
      fallbackLang: DEFAULT_LANG,
      loader: provideTranslateLoader(TranslateBrowserLoader),
    }),
  ]
};
