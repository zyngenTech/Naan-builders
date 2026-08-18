import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ImgFallbackDirective } from '../../../shared/directives/img-fallback.directive';

import { AdminSettingsFormComponent } from '../components/admin-settings-form/admin-settings-form.component';
import { AdminProjectsManagerComponent } from '../components/admin-projects-manager/admin-projects-manager.component';
import { AdminGalleryManagerComponent } from '../components/admin-gallery-manager/admin-gallery-manager.component';
import { AdminServicesManagerComponent } from '../components/admin-services-manager/admin-services-manager.component';
import { AdminTestimonialsManagerComponent } from '../components/admin-testimonials-manager/admin-testimonials-manager.component';
import { AdminMilestonesManagerComponent } from '../components/admin-milestones-manager/admin-milestones-manager.component';
import { AdminInquiriesManagerComponent } from '../components/admin-inquiries-manager/admin-inquiries-manager.component';
import { InquiryService } from '../../../core/services/inquiry.service';
import { logger } from '../../../core/logger';

type AdminTab = 'settings' | 'projects' | 'gallery' | 'services' | 'testimonials' | 'milestones' | 'inquiries';

/**
 * AdminDashboardComponent
 * Protected route (/admin, guarded by adminAuthGuard). A single-page,
 * tab-based control panel - full CRUD for every collection lives here so
 * the owner never has to touch the Firebase Console directly. Rendered
 * standalone (AppComponent hides the public navbar/footer on /admin
 * routes) so this topbar is the only chrome around it.
 * Layout is mobile-first: the tab bar and every manager's grids are built
 * around a 2-column (col-6 style) layout that holds even on small phones.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ImgFallbackDirective,
    AdminSettingsFormComponent,
    AdminProjectsManagerComponent,
    AdminGalleryManagerComponent,
    AdminServicesManagerComponent,
    AdminTestimonialsManagerComponent,
    AdminMilestonesManagerComponent,
    AdminInquiriesManagerComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);
  private inquiryService = inject(InquiryService);
  private router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly activeTab = signal<AdminTab>('settings');

  // Loads the real company name/logo from Firestore for the topbar - shows
  // a subtle loading placeholder rather than any hardcoded brand name
  // while it fetches, and never falls back to fake/dummy text.
  readonly companyName = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly isBrandLoading = signal(true);

  // Badge count of new (unread) inquiries, shown on the tab itself so the
  // owner immediately notices new customer leads on login.
  readonly newInquiryCount = signal(0);

  readonly tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'settings', label: 'Home Banner & Stats', icon: 'fa-solid fa-gauge-high' },
    { id: 'inquiries', label: 'Inquiries', icon: 'fa-solid fa-envelope-open-text' },
    { id: 'projects', label: 'Projects', icon: 'fa-solid fa-house-chimney' },
    { id: 'gallery', label: 'Gallery', icon: 'fa-solid fa-images' },
    { id: 'services', label: 'Services', icon: 'fa-solid fa-list-check' },
    { id: 'testimonials', label: 'Testimonials', icon: 'fa-solid fa-star' },
    { id: 'milestones', label: 'Journey', icon: 'fa-solid fa-timeline' },
  ];

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.companyName.set(settings?.companyName ?? null);
        this.logoUrl.set(settings?.logoUrl ?? null);
        this.isBrandLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminDashboardComponent] Failed to load company name', error);
        this.isBrandLoading.set(false);
      },
    });

    this.inquiryService.getAllInquiries().subscribe({
      next: (inquiries) => this.newInquiryCount.set(inquiries.filter((i) => i.status === 'new').length),
      error: (error) => logger.error('[AdminDashboardComponent] Failed to load inquiry count', error),
    });
  }

  setTab(tab: AdminTab): void {
    logger.log('[AdminDashboardComponent] Switching tab ->', tab);
    this.activeTab.set(tab);
  }

  logout(): void {
    logger.log('[AdminDashboardComponent] Logging out');
    this.authService.logout().subscribe({
      next: () => {
        this.toastService.success('Signed out successfully.');
        this.router.navigateByUrl('/admin/login');
      },
      error: (error) => {
        logger.error('[AdminDashboardComponent] Logout failed', error);
        this.toastService.error('Something went wrong while signing out.');
      },
    });
  }
}
