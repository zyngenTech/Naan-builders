import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../shared/pipes/cloudinary-optimize.pipe';

import { SettingsService } from '../../core/services/settings.service';
import { MilestoneService } from '../../core/services/milestone.service';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { MilestoneModel } from '../../core/models/milestone.model';
import { logger } from '../../core/logger';

/**
 * About page: owner bio, experience, vision/mission, journey timeline,
 * certificates. Owner profile fields come entirely from Firestore
 * ("settings/site") and the Journey timeline from the "milestones"
 * collection - both managed from Admin. No placeholder/dummy content is
 * shown if either hasn't been filled in yet, just a clear prompt to add
 * it from Admin.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HeroComponent, SectionTitleComponent, LoaderComponent, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private milestoneService = inject(MilestoneService);

  readonly settings = signal<SiteSettingsModel | null>(null);
  readonly isLoading = signal(true);

  readonly milestones = signal<MilestoneModel[]>([]);
  readonly isLoadingMilestones = signal(true);

  ngOnInit(): void {
    logger.log('[AboutComponent] Loading site settings');
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings ?? null);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AboutComponent] Failed to load site settings', error);
        this.isLoading.set(false);
      },
    });

    logger.log('[AboutComponent] Loading milestones');
    this.milestoneService.getAllMilestones().subscribe({
      next: (milestones) => {
        this.milestones.set(milestones);
        this.isLoadingMilestones.set(false);
      },
      error: (error) => {
        logger.error('[AboutComponent] Failed to load milestones', error);
        this.isLoadingMilestones.set(false);
      },
    });
  }
}
