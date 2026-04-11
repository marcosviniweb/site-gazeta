import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { environment } from './core/env/env';
import { newsIdsInterceptor } from './core/interceptor/news-ids.interceptor';
import { excludeNewsInterceptor } from './core/interceptor/exclude-news.interceptor';
import { provideLibraryConfig, debugApiInterceptor } from '@site-gazeta/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(
      withInterceptors([
        excludeNewsInterceptor,
        newsIdsInterceptor,
        debugApiInterceptor
      ]),
      withFetch()
    ),
    provideLibraryConfig({
      apiUrl: environment.apiUrl
    }),
  ],
};
