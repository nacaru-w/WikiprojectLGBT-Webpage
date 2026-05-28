import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideTranslateLoader } from '@ngx-translate/core';
import { TranslateServerLoader } from './services/i18n/translate-server.loader';
import { WIKIMEDIA_USER_AGENT } from './interceptors/wikimedia-user-agent.interceptor';
import { buildUserAgent } from '../../credentials';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Overrides the browser HTTP loader: during SSR, relative URLs can't be
    // fetched, so translations are read from disk instead. Declared after the
    // merged appConfig so it wins the TranslateLoader token.
    provideTranslateLoader(TranslateServerLoader),
    // Server-only: stamp a policy-compliant User-Agent on SSR-time Wikimedia
    // API calls (see wikimediaUserAgentInterceptor). The contact address comes
    // from the gitignored credentials file, so it never ships to the browser.
    { provide: WIKIMEDIA_USER_AGENT, useValue: buildUserAgent() },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
