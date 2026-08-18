import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { ServiceOfferingService } from '../../core/services/service.service';
import { SettingsService } from '../../core/services/settings.service';
import { ServiceModel } from '../../core/models/service.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { logger } from '../../core/logger';

/**
 * Full services listing page with animated cards. Data comes entirely
 * from Firestore ("services" collection, managed from Admin) - if none
 * have been added yet, the page shows a clear empty state pointing to
 * Admin rather than placeholder content. The header banner image is also
 * admin-editable, falling back to a default asset if unset.
 */
@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroComponent, SectionTitleComponent, LoaderComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent implements OnInit {
  private serviceOfferingService = inject(ServiceOfferingService);
  private settingsService = inject(SettingsService);

  readonly services = signal<ServiceModel[]>([]);
  readonly isLoading = signal(true);
  readonly settings = signal<SiteSettingsModel | null>(null);

  ngOnInit(): void {
    logger.log('[ServicesComponent] Loading services');
    this.serviceOfferingService.getAllServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[ServicesComponent] Failed to load services', error);
        this.isLoading.set(false);
      },
    });

    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings ?? null),
      error: (error) => logger.error('[ServicesComponent] Failed to load site settings', error),
    });
  }
}
