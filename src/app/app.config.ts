import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

/**
 * Root application configuration (standalone bootstrap - no NgModules).
 * Wires up the Router (with lazy routes + scroll restoration + view
 * transitions).
 *
 * No Angular Animations provider here - the app has zero usage of the
 * `@angular/animations` trigger()/animate()/transition() DSL anywhere
 * (every motion effect in this app - hovers, reveals, the slider - is
 * plain CSS). `provideAnimations()` pulls Angular's full animation
 * rendering engine into the initial bundle unconditionally; since
 * nothing uses it, it was pure dead weight on every page load. Page
 * transitions instead use `withViewTransitions()` above, which is the
 * native browser View Transitions API - unrelated to `@angular/animations`
 * and effectively free.
 *
 * Firebase is NOT configured here - there's no AngularFire dependency in
 * this app at all. Every Firestore/Storage/Auth call goes through the
 * plain Firebase SDK on a single shared instance (see core/firebase-app.ts),
 * which is simpler, avoids AngularFire's injection-context requirements,
 * and trims an entire dependency out of the bundle.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      withViewTransitions()
    ), provideClientHydration(withEventReplay()),
  ],
};
