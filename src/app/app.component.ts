import { Component, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FloatingButtonsComponent } from './shared/components/floating-buttons/floating-buttons.component';
import { ScrollTopComponent } from './shared/components/scroll-top/scroll-top.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, FloatingButtonsComponent, ScrollTopComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  /** The admin area (login + dashboard) uses its own layout, so the public
   *  navbar/footer/floating buttons are hidden while on any /admin route. */
  readonly isAdminRoute = signal(false);

  private document = inject(DOCUMENT);
  private titleService = inject(Title);
  private settingsService = inject(SettingsService);

  constructor(private router: Router) {
    console.log('[AppComponent] Application shell initialized');
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.isAdminRoute.set((event as NavigationEnd).urlAfterRedirects.startsWith('/admin'));
    });

    this.settingsService.ensureLoaded();

    // Keep the browser tab title and favicon in sync with whatever the
    // admin has saved for site name / favicon.
    effect(() => {
      const settings = this.settingsService.settings();
      if (!settings) return;

      if (settings.siteName) {
        this.titleService.setTitle(settings.siteName);
      }
      if (settings.faviconUrl) {
        let link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = this.document.createElement('link');
          link.rel = 'icon';
          this.document.head.appendChild(link);
        }
        link.href = settings.faviconUrl;
      }
    });
  }
}
