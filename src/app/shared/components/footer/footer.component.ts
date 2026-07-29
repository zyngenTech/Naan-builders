import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private settingsService = inject(SettingsService);

  readonly year = new Date().getFullYear();
  /** Admin-editable contact info, live-updated via the shared settings signal. */
  readonly contact = this.settingsService.settings;

  constructor() {
    this.settingsService.ensureLoaded();
  }
}
