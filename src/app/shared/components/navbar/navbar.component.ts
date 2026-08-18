import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../pipes/cloudinary-optimize.pipe';
import { logger } from '../../../core/logger';

/**
 * NavbarComponent
 * Sticky, transparent-to-solid-on-scroll navbar with a responsive
 * slide-in mobile menu. The brand name/logo are loaded from Firestore
 * ("settings/site" -> companyName/logoUrl) with a loading placeholder
 * shown until it resolves - never a hardcoded/dummy company name. If no
 * logo is set, a Font Awesome icon is shown instead.
 * There is intentionally no visible link to /admin here - the admin
 * dashboard is reached only by typing its URL directly.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  private settingsService = inject(SettingsService);

  readonly isScrolled = signal(false);
  readonly isMenuOpen = signal(false);
  readonly companyName = signal<string | null>(null);
  readonly logoUrl = signal<string | null>(null);
  readonly isBrandLoading = signal(true);

  readonly links = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/projects', label: 'Projects' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/testimonials', label: 'Testimonials' },
  ];

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.companyName.set(settings?.companyName ?? null);
        this.logoUrl.set(settings?.logoUrl ?? null);
        this.isBrandLoading.set(false);
      },
      error: (error) => {
        logger.error('[NavbarComponent] Failed to load company name', error);
        this.isBrandLoading.set(false);
      },
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 40);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
    logger.log('[NavbarComponent] Mobile menu toggled ->', this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
