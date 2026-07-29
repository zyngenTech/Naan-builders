import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';

/** Floating WhatsApp + Call buttons, fixed to the bottom-left on every page. */
@Component({
  selector: 'app-floating-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-buttons.component.html',
  styleUrl: './floating-buttons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingButtonsComponent {
  private settingsService = inject(SettingsService);

  readonly whatsappUrl = computed(
    () =>
      `https://wa.me/${this.settingsService.settings()?.whatsapp ?? ''}?text=${encodeURIComponent(
        'Hi, I would like to enquire about a construction project.'
      )}`
  );
  readonly callUrl = computed(() => `tel:${this.settingsService.settings()?.phone ?? ''}`);

  constructor() {
    this.settingsService.ensureLoaded();
  }
}
