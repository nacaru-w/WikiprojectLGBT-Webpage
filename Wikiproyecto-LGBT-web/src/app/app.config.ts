import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { withCredentialsInterceptor } from './interceptors/with-credentials.interceptor';

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
  ]
};
