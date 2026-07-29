import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { TestimonialService } from '../../core/services/testimonial.service';
import { TestimonialModel } from '../../core/models/testimonial.model';

/** Testimonials page with an auto-advancing slider plus a full grid below. */
@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, HeroComponent, LoaderComponent],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  private testimonialService = inject(TestimonialService);

  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeSlide = signal(0);
  private autoSlideTimer?: ReturnType<typeof setInterval>;

  readonly stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    console.log('[TestimonialsComponent] Loading testimonials');
    this.testimonialService.getAllTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials);
        this.isLoading.set(false);
        this.startAutoSlide();
      },
      error: (error) => {
        console.error('[TestimonialsComponent] Failed to load testimonials', error);
        this.isLoading.set(false);
      },
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
