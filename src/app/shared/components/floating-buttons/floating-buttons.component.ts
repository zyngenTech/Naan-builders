import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { SettingsService } from '../../../core/services/settings.service';
import { SiteSettingsModel } from '../../../core/models/settings.model';
import { toWhatsAppDigits } from '../../utils/phone.util';
import { logger } from '../../../core/logger';

/** Floating WhatsApp + Call buttons, fixed to the bottom-left on every page. */
@Component({
  selector: 'app-floating-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-buttons.component.html',
  styleUrl: './floating-buttons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingButtonsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private settings = signal<SiteSettingsModel | null>(null);

  readonly whatsappUrl = computed(() => {
    const rawNumber = this.settings()?.whatsapp || environment.contact.whatsapp;
    const digitsOnly = toWhatsAppDigits(rawNumber);
    return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(
      'Hi, I would like to enquire about a construction project.'
    )}`;
  });

  readonly callUrl = computed(() => `tel:${this.settings()?.phone || environment.contact.phone}`);

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: (error) => logger.error('[FloatingButtonsComponent] Failed to load contact settings', error),
    });
  }
}
