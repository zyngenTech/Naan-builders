import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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

/**
 * HomeComponent
 * Landing page: hero, animated stats, featured services, latest projects,
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

  /** Site-wide stats/hero-media, kept live so admin edits reflect immediately. */
  readonly settings = this.settingsService.settings;

  readonly featuredProjects = signal<ProjectModel[]>([]);
  readonly services = signal<ServiceModel[]>([]);
  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly isLoadingProjects = signal(true);
  readonly isLoadingServices = signal(true);

  readonly processSteps = [
    { icon: 'fa-solid fa-compass-drafting', title: 'Consultation & Design', desc: 'We understand your vision, site, and budget to craft the right plan.' },
    { icon: 'fa-solid fa-file-signature', title: 'Approvals & Planning', desc: 'Structural drawings, estimates, and necessary approvals handled end-to-end.' },
    { icon: 'fa-solid fa-helmet-safety', title: 'Construction', desc: 'Foundation to finishing, supervised daily for quality and safety.' },
    { icon: 'fa-solid fa-key', title: 'Handover', desc: 'A move-in ready home, delivered on time with complete documentation.' },
  ];

  ngOnInit(): void {
    console.log('[HomeComponent] Loading site settings');
    this.settingsService.ensureLoaded();

    console.log('[HomeComponent] Loading Featured Projects');
    this.loadFeaturedProjects();

    console.log('[HomeComponent] Loading Services');
    this.loadServices();

    console.log('[HomeComponent] Loading Testimonials');
    this.loadTestimonials();
  }

  private loadFeaturedProjects(): void {
    this.isLoadingProjects.set(true);
    this.projectService.getFeaturedProjects().subscribe({
      next: (projects) => {
        this.featuredProjects.set(projects.slice(0, 3));
        this.isLoadingProjects.set(false);
      },
      error: (error) => {
        console.error('[HomeComponent] Failed to load featured projects', error);
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
        console.error('[HomeComponent] Failed to load services', error);
        this.isLoadingServices.set(false);
      },
    });
  }

  private loadTestimonials(): void {
    this.testimonialService.getAllTestimonials().subscribe({
      next: (testimonials) => this.testimonials.set(testimonials.slice(0, 3)),
      error: (error) => console.error('[HomeComponent] Failed to load testimonials', error),
    });
  }
}
