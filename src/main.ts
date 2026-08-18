import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { logger } from './app/core/logger';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  logger.error('[Bootstrap] Failed to start application', err)
);
