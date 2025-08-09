import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Importez les données de locale pour 'fr'
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Enregistrez la locale 'fr'
registerLocaleData(localeFr);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));