import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { CounterComponent } from '../../shared/components/counter/counter.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { ProjectService } from '../../core/services/project.service';
import { ServiceOfferingService } from '../../core/services/service.service';
import { TestimonialService } from '../../core/services/testimonial.service';
import { SettingsService } from '../../core/services/settings.service';

import { ProjectModel } from '../../core/models/project.model';
import { ServiceModel } from '../../core/models/service.model';
import { TestimonialModel } from '../../core/models/testimonial.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { logger } from '../../core/logger';

/**
 * HomeComponent
 * Landing page: hero (image or admin-uploaded video banner), animated
 * stats (all editable from Admin), featured services, latest projects,
 * process timeline, and a testimonials preview.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroComponent,
    CounterComponent,
    ProjectCardComponent,
    SectionTitleComponent,
    LoaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private projectService = inject(ProjectService);
  private serviceOfferingService = inject(ServiceOfferingService);
  private testimonialService = inject(TestimonialService);
  private settingsService = inject(SettingsService);

  readonly featuredProjects = signal<ProjectModel[]>([]);
  readonly services = signal<ServiceModel[]>([]);
  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly settings = signal<SiteSettingsModel | null>(null);
  readonly isLoadingProjects = signal(true);
  readonly isLoadingServices = signal(true);
  readonly isLoadingTestimonials = signal(true);

  // Neutral fallbacks (not fabricated numbers) shown only until the
  // "settings/site" Firestore document is edited from Admin.
  readonly fallbackProjectsCompleted = 0;
  readonly fallbackSatisfaction = 0;
  readonly fallbackYears = 0;
  readonly fallbackCities = 0;

  readonly processSteps = [
    { icon: 'fa-solid fa-compass-drafting', title: 'Consultation & Design', desc: 'We understand your vision, site, and budget to craft the right plan.' },
    { icon: 'fa-solid fa-file-signature', title: 'Approvals & Planning', desc: 'Structural drawings, estimates, and necessary approvals handled end-to-end.' },
    { icon: 'fa-solid fa-helmet-safety', title: 'Construction', desc: 'Foundation to finishing, supervised daily for quality and safety.' },
    { icon: 'fa-solid fa-key', title: 'Handover', desc: 'A move-in ready home, delivered on time with complete documentation.' },
  ];

  // Computed here (rather than inline in the template) so the hero/stat
  // bindings stay simple, type-safe expressions and all the admin-vs-
  // fallback logic lives in one place.
  readonly heroImage = computed(() => this.settings()?.heroImage);
  readonly heroVideo = computed(() => this.settings()?.heroVideo || undefined);
  readonly statProjects = computed(() => this.settings()?.projectsCompleted || this.fallbackProjectsCompleted);
  readonly statSatisfaction = computed(() => this.settings()?.clientSatisfactionPercent || this.fallbackSatisfaction);
  readonly statYears = computed(() => this.settings()?.yearsExperience || this.fallbackYears);
  readonly statCities = computed(() => this.settings()?.citiesServed || this.fallbackCities);

  // Ties the hero subtitle copy to the real project count from Firestore
  // instead of a hardcoded number, so it never drifts out of sync with
  // what's actually in the "projects" collection.
  readonly heroSubtitle = computed(() => {
    const count = this.statProjects();
    const countText = count > 0 ? `${count}+ Successfully Completed Homes` : 'Building Homes You Can Trust';
    return `${countText} - crafted with precision engineering, honest craftsmanship, and a personal commitment to every family we build for.`;
  });

  ngOnInit(): void {
    logger.log('[HomeComponent] Loading Featured Projects');
    this.loadFeaturedProjects();

    logger.log('[HomeComponent] Loading Services');
    this.loadServices();

    logger.log('[HomeComponent] Loading Testimonials');
    this.loadTestimonials();

    logger.log('[HomeComponent] Loading site settings for hero/stats');
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: (error) => logger.error('[HomeComponent] Failed to load site settings', error),
    });
  }

  private loadFeaturedProjects(): void {
    this.isLoadingProjects.set(true);
    this.projectService.getFeaturedProjects().subscribe({
      next: (projects) => {
        this.featuredProjects.set(projects.slice(0, 3));
        this.isLoadingProjects.set(false);
      },
      error: (error) => {
        logger.error('[HomeComponent] Failed to load featured projects', error);
        this.isLoadingProjects.set(false);
      },
    });
  }

  private loadServices(): void {
    this.isLoadingServices.set(true);
    this.serviceOfferingService.getAllServices().subscribe({
      next: (services) => {
        this.services.set(services.slice(0, 6));
        this.isLoadingServices.set(false);
      },
      error: (error) => {
        logger.error('[HomeComponent] Failed to load services', error);
        this.isLoadingServices.set(false);
      },
    });
  }

  private loadTestimonials(): void {
    this.testimonialService.getAllTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials.slice(0, 3));
        this.isLoadingTestimonials.set(false);
      },
      error: (error) => {
        logger.error('[HomeComponent] Failed to load testimonials', error);
        this.isLoadingTestimonials.set(false);
      },
    });
  }
}
