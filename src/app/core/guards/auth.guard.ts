import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { firebaseApp } from '../firebase-app';
import { logger } from '../logger';

/**
 * adminAuthGuard
 * Protects /admin (the dashboard). Reads Firebase's own auth-ready state
 * directly (not AngularFire) so it works correctly even on a hard
 * refresh, before any Angular service has had a chance to initialize.
 * Unauthenticated visitors are redirected to /admin/login.
 *
 * `firebase/auth` is loaded with a DYNAMIC import rather than a static
 * one, and this is load-bearing for performance. app.routes.ts imports
 * this guard statically (route tables have to be built eagerly), so a
 * static `import ... from 'firebase/auth'` here put the entire Firebase
 * Auth SDK in the INITIAL bundle - downloaded and parsed by every
 * visitor to the home page, purely so that a route none of them will
 * visit could be protected. Deferring it means the SDK is fetched only
 * when someone actually navigates to /admin, where it is then shared
 * with AuthService in the same lazy chunk.
 *
 * The guard's behaviour is unchanged: it still resolves once Firebase
 * reports its restored auth state, just after a short module fetch.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const router = inject(Router);

  return from(import('firebase/auth')).pipe(
    switchMap(
      ({ getAuth, onAuthStateChanged }) =>
        new Observable<boolean | ReturnType<Router['parseUrl']>>((observer) => {
          const auth = getAuth(firebaseApp);
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
              observer.next(true);
            } else {
              logger.warn('[adminAuthGuard] No authenticated user, redirecting to /admin/login');
              observer.next(router.parseUrl('/admin/login'));
            }
            observer.complete();
          });
        })
    )
  );
};
