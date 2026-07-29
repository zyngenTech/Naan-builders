import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * AdminLoginComponent
 * Standalone, no public navbar/footer (see AppComponent) - a focused
 * sign-in screen for the site owner. Accounts are created ahead of time
 * in the Firebase console; there is no self sign-up here.
 */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get f() {
    return this.loginForm.controls;
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.isSubmitting.set(true);

    this.authService.login(email, password).subscribe({
      next: () => {
        console.log('[AdminLoginComponent] Login successful');
        this.isSubmitting.set(false);
        this.toastService.success('Welcome back!');
        this.router.navigateByUrl('/admin');
      },
      error: (error) => {
        console.error('[AdminLoginComponent] Login failed', error);
        this.isSubmitting.set(false);
        this.toastService.error('Invalid email or password.');
      },
    });
  }
}
