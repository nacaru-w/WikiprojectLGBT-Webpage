import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { withCredentialsInterceptor } from './interceptors/with-credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withHttpTransferCacheOptions({
      // https://angular.dev/guide/ssr#caching-data-when-using-httpclient
      filter: (_) => false,
    })),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([withCredentialsInterceptor])),
    provideCharts(withDefaultRegisterables()),
  ]
};
