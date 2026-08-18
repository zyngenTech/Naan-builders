import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SettingsService } from '../../../core/services/settings.service';
import { SiteSettingsModel } from '../../../core/models/settings.model';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../pipes/cloudinary-optimize.pipe';
import { logger } from '../../../core/logger';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit {
  private settingsService = inject(SettingsService);

  readonly year = new Date().getFullYear();
  private readonly settings = signal<SiteSettingsModel | null>(null);
  readonly isBrandLoading = signal(true);
  readonly companyName = computed(() => this.settings()?.companyName ?? null);
  readonly logoUrl = computed(() => this.settings()?.logoUrl ?? null);

  // Falls back to the environment defaults until "settings/site" loads (or
  // if it has never been edited from Admin), so contact info always shows.
  readonly contact = computed(() => {
    const s = this.settings();
    return {
      phone: s?.phone || environment.contact.phone,
      whatsapp: s?.whatsapp || environment.contact.whatsapp,
      email: s?.email || environment.contact.email,
      address: s?.address || environment.contact.address,
    };
  });

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings ?? null);
        this.isBrandLoading.set(false);
      },
      error: (error) => {
        logger.error('[FooterComponent] Failed to load contact settings', error);
        this.isBrandLoading.set(false);
      },
    });
  }
}
