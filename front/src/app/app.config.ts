import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // Importez withInterceptorsFromDi
import { HTTP_INTERCEPTORS } from '@angular/common/http'; // Importez HTTP_INTERCEPTORS
import { routes } from './app.routes';

import { AuthInterceptor } from './interceptors/auth.interceptor'; // Importez votre intercepteur

// Importez les providers de locale si vous ne le faites pas dans main.ts
// import { LOCALE_ID } from '@angular/core';
// import { registerLocaleData } from '@angular/common';
// import localeFr from '@angular/common/locales/fr';
// registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Fournissez HttpClient et ajoutez votre intercepteur
    provideHttpClient(withInterceptorsFromDi()), // Utilisez withInterceptorsFromDi pour les intercepteurs DI
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }, // Enregistrez votre intercepteur
    // Si vous configurez la locale ici plutôt que dans main.ts
    // { provide: LOCALE_ID, useValue: 'fr' }
  ]
};
