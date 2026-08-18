import { Injectable, signal } from '@angular/core';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { firebaseApp } from '../firebase-app';
import { logger } from '../logger';

/**
 * AuthService
 * -----------
 * Thin wrapper around Firebase Authentication (email/password), used only
 * to gate the Admin dashboard. Public pages never touch this service.
 * Uses the plain Firebase SDK directly on the shared `firebaseApp`
 * instance (see firebase-app.ts) rather than AngularFire.
 *
 * There is no public sign-up flow - create the single admin account from
 * the Firebase Console (Authentication -> Users -> Add user).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(firebaseApp);

  /** Live-updating signal of the current Firebase user, or null when signed out. */
  readonly currentUser = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      logger.log('[AuthService] Auth state changed ->', user ? user.email : 'signed out');
    });
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  login(email: string, password: string): Observable<User> {
    logger.log(`[AuthService] Attempting login for "${email}"`);
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((credential) => credential.user),
      tap(() => logger.log('[AuthService] Login successful')),
      catchError((error) => {
        logger.error('[AuthService] Login failed', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<void> {
    logger.log('[AuthService] Logging out');
    return from(signOut(this.auth)).pipe(
      tap(() => logger.log('[AuthService] Logout successful')),
      catchError((error) => {
        logger.error('[AuthService] Logout failed', error);
        return throwError(() => error);
      })
    );
  }
}
