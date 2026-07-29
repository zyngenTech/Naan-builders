import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { SettingsService } from '../../core/services/settings.service';
import { SiteSettingsModel } from '../../core/models/settings.model';

/** About page: owner bio, experience, vision/mission, timeline, certificates. */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HeroComponent, SectionTitleComponent, LoaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  private settingsService = inject(SettingsService);

  readonly settings = signal<SiteSettingsModel | null>(null);
  readonly isLoading = signal(true);

  // Fallback copy shown until the "settings/site" Firestore document is
  // seeded. Kept here (not inline in the template) so template string
  // parsing never has to deal with escaped apostrophes.
  readonly fallbackName = 'Nasaar';
  readonly fallbackTitle = 'Civil Engineer & Building Contractor';
  readonly fallbackBio =
    "With over a decade of hands-on experience, I specialize in turning a family's vision into a safe, beautifully built home - managing everything from structural design to the final coat of paint.";
  readonly fallbackYears = 10;
  readonly fallbackProjects = 35;
  readonly fallbackSatisfaction = 100;

  readonly timeline = [
    { year: '2014', title: 'Started Independent Practice', desc: 'Began offering structural design & site supervision after 4 years at a leading construction firm.' },
    { year: '2017', title: 'First 10 Homes Delivered', desc: 'Built a reputation for on-time, on-budget delivery across the district.' },
    { year: '2020', title: 'Expanded to Full Contracting', desc: 'Took on end-to-end construction, from planning approvals to final handover.' },
    { year: '2026', title: '35+ Homes & Counting', desc: 'A growing portfolio built on referrals and repeat clients.' },
  ];

  ngOnInit(): void {
    console.log('[AboutComponent] Loading site settings');
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[AboutComponent] Failed to load site settings', error);
        this.isLoading.set(false);
      },
    });
  }
}
