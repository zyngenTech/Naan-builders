import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { initializeFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getAuth, provideAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

/**
 * Root application configuration (standalone bootstrap - no NgModules).
 * Wires up: Router (with lazy routes + scroll restoration + view transitions),
 * Angular Animations, and Firebase (App, Firestore, Storage).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions()
    ),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() =>
      initializeFirestore(getApp(), { experimentalAutoDetectLongPolling: true })
    ),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),
  ],
};
