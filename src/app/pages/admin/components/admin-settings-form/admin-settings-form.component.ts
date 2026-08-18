import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminUploadComponent } from '../../../../shared/components/admin-upload/admin-upload.component';
import { SettingsService } from '../../../../core/services/settings.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SiteSettingsModel } from '../../../../core/models/settings.model';
import { logger } from '../../../../core/logger';

/** One editable page-banner image field (all except the Home hero, which has its own dedicated video/image controls). */
interface PageBannerField {
  key: 'heroImageAbout' | 'heroImageServices' | 'heroImageProjects' | 'heroImageGallery' | 'heroImageTestimonials' | 'heroImageContact';
  label: string;
}

/**
 * AdminSettingsFormComponent
 * Edits the single "settings/site" Firestore document: company name, the
 * home page stat strip, all contact info (phone, WhatsApp, email, address
 * - used on Navbar, Footer, floating buttons, and the Contact page), the
 * owner bio/photo, the home page hero banner (image or an uploaded video),
 * every other page's header banner image, and the social share image.
 * Every image/video field supports uploading a file OR pasting a URL.
 */
@Component({
  selector: 'app-admin-settings-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminUploadComponent],
  templateUrl: './admin-settings-form.component.html',
  styleUrl: './admin-settings-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly heroImageUrl = signal<string | null>(null);
  readonly heroVideoUrl = signal<string | null>(null);
  readonly ownerPhotoUrl = signal<string | null>(null);
  readonly ogImageUrl = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly faviconUrl = signal<string | null>(null);

  readonly pageBanners: PageBannerField[] = [
    { key: 'heroImageAbout', label: 'About Page Banner' },
    { key: 'heroImageServices', label: 'Services Page Banner' },
    { key: 'heroImageProjects', label: 'Projects Page Banner' },
    { key: 'heroImageGallery', label: 'Gallery Page Banner' },
    { key: 'heroImageTestimonials', label: 'Testimonials Page Banner' },
    { key: 'heroImageContact', label: 'Contact Page Banner' },
  ];
  readonly pageBannerUrls = signal<Record<string, string | null>>({});

  readonly settingsForm = this.fb.nonNullable.group({
    companyName: ['', Validators.required],
    ownerName: ['', Validators.required],
    ownerTitle: ['', Validators.required],
    bio: ['', Validators.required],
    projectsCompleted: [0, [Validators.required, Validators.min(0)]],
    clientSatisfactionPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    yearsExperience: [0, [Validators.required, Validators.min(0)]],
    citiesServed: [0, [Validators.required, Validators.min(0)]],
    phone: ['', Validators.required],
    whatsapp: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
  });

  ngOnInit(): void {
    logger.log('[AdminSettingsFormComponent] Loading current site settings');
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        // FirebaseService.getDocById() emits `undefined` (not an error)
        // when the "settings/site" document doesn't exist yet - e.g. first-time
        // setup before Admin has ever saved anything. Fall back to the
        // form's defaults in that case so the form still renders cleanly.
        if (settings) {
          this.applySettings(settings);
        } else {
          logger.warn('[AdminSettingsFormComponent] No existing settings document, starting fresh');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminSettingsFormComponent] Failed to load site settings', error);
        this.isLoading.set(false);
      },
    });
  }

  private applySettings(settings: SiteSettingsModel): void {
    this.settingsForm.patchValue({
      companyName: settings.companyName,
      ownerName: settings.ownerName,
      ownerTitle: settings.ownerTitle,
      bio: settings.bio,
      projectsCompleted: settings.projectsCompleted,
      clientSatisfactionPercent: settings.clientSatisfactionPercent,
      yearsExperience: settings.yearsExperience,
      citiesServed: settings.citiesServed,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      address: settings.address,
    });
    this.heroImageUrl.set(settings.heroImage ?? null);
    this.heroVideoUrl.set(settings.heroVideo ?? null);
    this.ownerPhotoUrl.set(settings.ownerPhoto ?? null);
    this.ogImageUrl.set(settings.ogImage ?? null);
    this.logoUrl.set(settings.logoUrl ?? null);
    this.faviconUrl.set(settings.faviconUrl ?? null);

    const banners: Record<string, string | null> = {};
    for (const field of this.pageBanners) {
      banners[field.key] = settings[field.key] ?? null;
    }
    this.pageBannerUrls.set(banners);
  }

  get f() {
    return this.settingsForm.controls;
  }

  onHeroImageUploaded(url: string): void {
    this.heroImageUrl.set(url);
  }
  onHeroImageRemoved(): void {
    this.heroImageUrl.set(null);
  }
  onHeroVideoUploaded(url: string): void {
    this.heroVideoUrl.set(url);
  }
  onHeroVideoRemoved(): void {
    this.heroVideoUrl.set(null);
  }
  onOwnerPhotoUploaded(url: string): void {
    this.ownerPhotoUrl.set(url);
  }
  onOwnerPhotoRemoved(): void {
    this.ownerPhotoUrl.set(null);
  }
  onOgImageUploaded(url: string): void {
    this.ogImageUrl.set(url);
  }
  onOgImageRemoved(): void {
    this.ogImageUrl.set(null);
  }
  onLogoUploaded(url: string): void {
    this.logoUrl.set(url);
  }
  onLogoRemoved(): void {
    this.logoUrl.set(null);
  }
  onFaviconUploaded(url: string): void {
    this.faviconUrl.set(url);
  }
  onFaviconRemoved(): void {
    this.faviconUrl.set(null);
  }

  onPageBannerUploaded(key: string, url: string): void {
    this.pageBannerUrls.update((map) => ({ ...map, [key]: url }));
  }
  onPageBannerRemoved(key: string): void {
    this.pageBannerUrls.update((map) => ({ ...map, [key]: null }));
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) {
      logger.log('[AdminSettingsFormComponent] Form invalid, marking all as touched');
      this.settingsForm.markAllAsTouched();
      this.toastService.error('Please fix the highlighted fields.');
      return;
    }

    const bannerPayload: Record<string, string> = {};
    const currentBanners = this.pageBannerUrls();
    for (const field of this.pageBanners) {
      bannerPayload[field.key] = currentBanners[field.key] ?? '';
    }

    const payload: Partial<SiteSettingsModel> = {
      ...this.settingsForm.getRawValue(),
      heroImage: this.heroImageUrl() ?? '',
      heroVideo: this.heroVideoUrl() ?? '',
      ownerPhoto: this.ownerPhotoUrl() ?? '',
      ogImage: this.ogImageUrl() ?? '',
      logoUrl: this.logoUrl() ?? '',
      faviconUrl: this.faviconUrl() ?? '',
      ...bannerPayload,
    };

    logger.log('[AdminSettingsFormComponent] Saving site settings', payload);
    this.isSaving.set(true);

    this.settingsService.updateSiteSettings(payload).subscribe({
      next: () => {
        logger.log('[AdminSettingsFormComponent] Site settings saved');
        this.toastService.success('Site settings updated successfully.');
        this.isSaving.set(false);
      },
      error: (error) => {
        logger.error('[AdminSettingsFormComponent] Failed to save site settings', error);
        this.toastService.error('Failed to save settings. Please try again.');
        this.isSaving.set(false);
      },
    });
  }
}
