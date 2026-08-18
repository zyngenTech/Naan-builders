import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ImgFallbackDirective } from '../../../shared/directives/img-fallback.directive';
import { logger } from '../../../core/logger';

/**
 * AdminLoginComponent
 * Public route (/admin/login). Simple email/password sign-in gate for the
 * Admin dashboard - there is no public sign-up, the account is created
 * once from the Firebase Console. There is no link to this page anywhere
 * in the public site - it's reached only by typing the URL directly.
 */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImgFallbackDirective],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly companyName = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly isBrandLoading = signal(true);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.companyName.set(settings?.companyName ?? null);
        this.logoUrl.set(settings?.logoUrl ?? null);
        this.isBrandLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminLoginComponent] Failed to load company name', error);
        this.isBrandLoading.set(false);
      },
    });
  }

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
    logger.log(`[AdminLoginComponent] Submitting login for "${email}"`);
    this.isSubmitting.set(true);

    this.authService.login(email, password).subscribe({
      next: () => {
        logger.log('[AdminLoginComponent] Login successful, navigating to /admin');
        this.toastService.success('Welcome back!');
        this.isSubmitting.set(false);
        this.router.navigateByUrl('/admin');
      },
      error: (error) => {
        logger.error('[AdminLoginComponent] Login failed', error);
        this.toastService.error('Invalid email or password. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }
}
