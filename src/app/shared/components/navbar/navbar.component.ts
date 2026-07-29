import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';

/**
 * NavbarComponent
 * Sticky, transparent-to-solid-on-scroll navbar with a responsive
 * slide-in mobile menu. There is intentionally no visible Admin link -
 * the admin area is reached only by navigating directly to /admin
 * (which shows the login screen, or the dashboard if already signed in).
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private settingsService = inject(SettingsService);

  readonly isScrolled = signal(false);
  readonly isMenuOpen = signal(false);
  /** Site name/logo, editable by the admin - falls back to defaults until settings load. */
  readonly settings = this.settingsService.settings;

  constructor() {
    this.settingsService.ensureLoaded();
  }

  readonly links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/projects', label: 'Projects' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/testimonials', label: 'Testimonials' },
  ];

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 40);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
    console.log('[NavbarComponent] Mobile menu toggled ->', this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
