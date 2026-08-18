import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FloatingButtonsComponent } from './shared/components/floating-buttons/floating-buttons.component';
import { ScrollTopComponent } from './shared/components/scroll-top/scroll-top.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AppLoaderComponent } from './shared/components/app-loader/app-loader.component';
import { SettingsService } from './core/services/settings.service';
import { SeoService } from './core/services/seo.service';
import { logger } from './core/logger';

// Minimum time the loading modal stays visible on the very first app
// boot, so it never flickers on/off for an instant chunk load. Kept
// short and applied ONLY to the initial bootstrap below - not to every
// in-app navigation, since forcing a full-screen block on every route
// change actively fights "render immediately" for no benefit (each page
// already shows its own scoped section loader via <app-loader>).
const MIN_LOADER_VISIBLE_MS = 200;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    FloatingButtonsComponent,
    ScrollTopComponent,
    ToastComponent,
    AppLoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private router = inject(Router);
  private meta = inject(Meta);
  private settingsService = inject(SettingsService);
  private seo = inject(SeoService);
  private document = inject(DOCUMENT);

  // Starts true so a hard reload always shows the branded loading modal
  // until the first route (and its lazy-loaded chunk) has resolved.
  readonly isLoading = signal(true);
  private loaderShownAt = 0;

  // True once the app's very first navigation has completed. The
  // full-screen loader is only ever shown before this point (hard
  // reload / first paint) - subsequent SPA navigations swap the
  // <router-outlet> content directly without an overlay, so the page
  // renders immediately instead of waiting behind a full-viewport cover.
  private hasCompletedFirstNavigation = false;

  // False until the router has rendered a route into <router-outlet>.
  // Drives the `app-main--booting` class, which reserves a viewport's
  // worth of height for <main> so <app-footer> cannot paint on-screen
  // while the first lazy chunk is still in flight and then get shoved
  // down when it arrives. See app.component.css for the measurement.
  //
  // Deliberately NOT reusing `isLoading` here: that signal lingers for
  // MIN_LOADER_VISIBLE_MS after the route renders, and holding the
  // reserved height past render would itself shift any page shorter
  // than one viewport (e.g. the "Project Not Found" state) once it
  // finally dropped. This flips in the same change-detection pass that
  // renders the route, so the layout settles exactly once.
  readonly hasRenderedRoute = signal(false);

  // /admin and /admin/login render their own self-contained shell (see
  // AdminDashboardComponent's own topbar and AdminLoginComponent) - the
  // public Navbar/Footer/floating buttons/scroll-top must never appear
  // there, so the admin area stays fully separate from the public site.
  readonly isAdminRoute = signal(this.computeIsAdminRoute(this.router.url));

  // Shown on the loading modal once known - null (icon fallback) until
  // the first settings fetch resolves; SettingsService caches after that,
  // so it's available instantly for every subsequent navigation.
  readonly logoUrl = signal<string | null>(null);

  constructor() {
    logger.log('[AppComponent] Application shell initialized');
    this.loaderShownAt = Date.now();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!this.hasCompletedFirstNavigation) {
          this.loaderShownAt = Date.now();
          this.isLoading.set(true);
        }
        this.isAdminRoute.set(this.computeIsAdminRoute(event.url));
      } else if (event instanceof NavigationEnd) {
        this.isAdminRoute.set(this.computeIsAdminRoute(event.urlAfterRedirects));
        this.hasRenderedRoute.set(true);
        this.applySeoForRoute(event.urlAfterRedirects);
        this.resolveLoader();
        this.hasCompletedFirstNavigation = true;
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.hasRenderedRoute.set(true);
        this.resolveLoader();
        this.hasCompletedFirstNavigation = true;
      }
    });

    // Updates the og:image meta tag and the browser tab favicon from
    // Admin-uploaded settings (settings/site -> ogImage / faviconUrl)
    // once loaded, and captures the logo for the loading modal above.
    // Note on og:image: since this is a client-rendered app, this only
    // affects tags read by JS-capable tools - most social crawlers read
    // the static tag in index.html, so that stays as a sensible default
    // too. The favicon swap works for any browser tab though, since it's
    // applied as soon as the page loads.
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        if (settings?.ogImage) {
          this.meta.updateTag({ property: 'og:image', content: settings.ogImage });
        }
        if (settings?.faviconUrl) {
          this.updateFavicon(settings.faviconUrl);
        }
        this.logoUrl.set(settings?.logoUrl ?? null);
      },
      error: (error) => logger.error('[AppComponent] Failed to load og:image/favicon settings', error),
    });
  }

  private updateFavicon(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private computeIsAdminRoute(url: string): boolean {
    return url.startsWith('/admin');
  }

  /**
   * Applies the description/canonical/og tags declared in app.routes.ts
   * `data` for whichever route just rendered.
   *
   * ProjectDetailsComponent overrides these with per-project values once
   * its Firestore read resolves - this runs first and gives that page a
   * sensible generic description in the meantime, so it is never left
   * showing the previous page's tags.
   */
  private applySeoForRoute(url: string): void {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    // Bracket access: tsconfig sets noPropertyAccessFromIndexSignature,
    // and Angular's route `data` is an index-signature type.
    const description = snapshot.data['description'] as string | undefined;
    const noIndex = snapshot.data['noIndex'] === true;

    this.seo.setNoIndex(noIndex);
    if (!description) {
      return;
    }

    // Strip the query string / fragment so the canonical URL is stable.
    const path = url.split('?')[0].split('#')[0] || '/';
    this.seo.update({ description, path });
  }

  private resolveLoader(): void {
    const elapsed = Date.now() - this.loaderShownAt;
    const remaining = Math.max(MIN_LOADER_VISIBLE_MS - elapsed, 0);
    setTimeout(() => this.isLoading.set(false), remaining);
  }
}
