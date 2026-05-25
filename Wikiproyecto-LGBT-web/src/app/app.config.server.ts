import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { provideTranslateLoader } from '@ngx-translate/core';
import { TranslateServerLoader } from './services/i18n/translate-server.loader';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Overrides the browser HTTP loader: during SSR, relative URLs can't be
    // fetched, so translations are read from disk instead. Declared after the
    // merged appConfig so it wins the TranslateLoader token.
    provideTranslateLoader(TranslateServerLoader),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
