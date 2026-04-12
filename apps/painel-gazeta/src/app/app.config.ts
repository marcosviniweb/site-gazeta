import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { registerLocaleData, DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MatIconRegistry } from '@angular/material/icon';

// Registrar os dados de localização para pt-br
registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options:{
          darkModeSelector: false,
          cssLayer: false
        }
      },
    }),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: 'America/Sao_Paulo' } },
    {
      provide: 'APP_INITIALIZER',
      useFactory: (iconRegistry: MatIconRegistry) => {
        return () => {
          iconRegistry.setDefaultFontSetClass('material-symbols-outlined');
        };
      },
      deps: [MatIconRegistry],
      multi: true,
    },
  ],
};