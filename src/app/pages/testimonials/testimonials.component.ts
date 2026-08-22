import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../shared/pipes/cloudinary-optimize.pipe';

import { TestimonialService } from '../../core/services/testimonial.service';
import { SettingsService } from '../../core/services/settings.service';
import { TestimonialModel } from '../../core/models/testimonial.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { logger } from '../../core/logger';

/** Testimonials page with an auto-advancing slider plus a full grid below. */
@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, HeroComponent, LoaderComponent, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  private testimonialService = inject(TestimonialService);
  private settingsService = inject(SettingsService);
  private platformId = inject(PLATFORM_ID);

  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeSlide = signal(0);
  readonly settings = signal<SiteSettingsModel | null>(null);
  private autoSlideTimer?: ReturnType<typeof setInterval>;

  readonly stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    logger.log('[TestimonialsComponent] Loading testimonials');
    this.testimonialService.getAllTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials);
        this.isLoading.set(false);
        // A recurring setInterval must never start during a build-time
        // prerender: it keeps Angular's zone permanently "unstable", which
        // hangs/fails the prerender step (there is no browser tab to ever
        // navigate away and clear it). Real users only get the slider once
        // this actually runs in a browser.
        if (isPlatformBrowser(this.platformId)) {
          this.startAutoSlide();
        }
      },
      error: (error) => {
        logger.error('[TestimonialsComponent] Failed to load testimonials', error);
        this.isLoading.set(false);
      },
    });

    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings ?? null),
      error: (error) => logger.error('[TestimonialsComponent] Failed to load site settings', error),
    });
  }

  ngOnDestroy(): void {
    if (this.autoSlideTimer) clearInterval(this.autoSlideTimer);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  private startAutoSlide(): void {
    if (this.testimonials().length <= 1) return;
    this.autoSlideTimer = setInterval(() => {
      this.activeSlide.update((i) => (i + 1) % this.testimonials().length);
    }, 5000);
  }
}
