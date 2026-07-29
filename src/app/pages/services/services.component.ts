import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { ServiceOfferingService } from '../../core/services/service.service';
import { ServiceModel } from '../../core/models/service.model';

/** Full services listing page with animated cards. */
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

  readonly services = signal<ServiceModel[]>([]);
  readonly isLoading = signal(true);

  // Sensible fallback list shown if Firestore has no "services" documents yet,
  // so the page never looks broken during initial setup.
  private readonly fallbackServices: ServiceModel[] = [
    { title: 'House Construction', description: 'End-to-end residential construction from foundation to finishing.', icon: 'fa-solid fa-house-chimney', order: 1 },
    { title: 'Building Planning', description: 'Vaastu-compliant layouts, permits, and approval-ready drawings.', icon: 'fa-solid fa-ruler-combined', order: 2 },
    { title: 'Structural Design', description: 'Earthquake-resistant RCC design engineered for safety and longevity.', icon: 'fa-solid fa-drafting-compass', order: 3 },
    { title: 'Renovation', description: 'Extensions, remodeling, and structural strengthening of existing homes.', icon: 'fa-solid fa-house-crack', order: 4 },
    { title: 'Interior Coordination', description: 'Coordinated finishing - flooring, painting, electrical, and carpentry.', icon: 'fa-solid fa-couch', order: 5 },
    { title: 'Construction Supervision', description: 'Daily on-site quality checks and progress reporting until handover.', icon: 'fa-solid fa-helmet-safety', order: 6 },
  ];

  ngOnInit(): void {
    console.log('[ServicesComponent] Loading services');
    this.serviceOfferingService.getAllServices().subscribe({
      next: (services) => {
        this.services.set(services.length ? services : this.fallbackServices);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[ServicesComponent] Failed to load services, using fallback list', error);
        this.services.set(this.fallbackServices);
        this.isLoading.set(false);
      },
    });
  }
}
