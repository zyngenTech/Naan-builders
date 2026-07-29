import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

/**
 * AuthService
 * -----------
 * Thin wrapper around Firebase Authentication used only to gate the
 * `/admin` area. Admin users are created ahead of time in the Firebase
 * console (Authentication -> Users -> Add user with email/password) -
 * there's no public sign-up flow.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Current signed-in user, or null. Updated live by Firebase's auth listener. */
  readonly currentUser = signal<User | null>(null);
  /** True once the initial auth-state check has resolved (avoids a login-page flash). */
  readonly authReady = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      console.log('[AuthService] Auth state changed ->', user ? user.email : 'signed out');
      this.currentUser.set(user);
      this.authReady.set(true);
    });
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  login(email: string, password: string): Observable<User> {
    console.log('[AuthService] Attempting login for', email);
    return from(
      signInWithEmailAndPassword(this.auth, email, password).then((cred) => cred.user)
    );
  }

  logout(): Observable<void> {
    console.log('[AuthService] Logging out');
    return from(signOut(this.auth));
  }
}
