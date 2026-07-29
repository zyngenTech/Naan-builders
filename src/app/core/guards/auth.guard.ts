import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guards every `/admin` route (except the login page itself). Waits for
 * Firebase's initial auth-state check to resolve (authReady) before
 * deciding, so a signed-in admin never gets bounced to /login on refresh.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (authService.isLoggedIn) {
        return true;
      }
      console.log('[authGuard] Not authenticated, redirecting to /admin/login');
      return router.parseUrl('/admin/login');
    })
  );
};
