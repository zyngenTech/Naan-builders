import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface SeoTags {
  /** Page description. Aim for 120-160 characters. */
  description: string;
  /** Path only, starting with "/" (e.g. "/projects"). Combined with environment.siteUrl. */
  path: string;
  /** Absolute image URL for social cards. Falls back to the site default. */
  image?: string;
  /** og:type - "website" for normal pages, "article" for a single project. */
  type?: string;
}

/**
 * SeoService
 * ----------
 * Keeps the per-page SEO tags in sync as the user navigates.
 *
 * Before this existed, index.html carried ONE hardcoded description,
 * og:url and canonical, and every route reused them - so Google saw
 * eight pages all claiming to be the homepage, and every WhatsApp or
 * Facebook share of /projects or /contact showed the homepage blurb.
 * Route titles were already handled by the router's `title` property;
 * this fills in everything else.
 *
 * Important limitation, stated plainly: this app is client-rendered, so
 * these tags are written by JavaScript AFTER the page loads. Google
 * executes JS and will see them. Most social scrapers (WhatsApp,
 * Facebook, Twitter, LinkedIn) do NOT - they read the raw HTML. So the
 * static tags in index.html remain the ones those previews use, which is
 * why they should stay set to sensible sitewide defaults. Making
 * per-page social previews work properly requires prerendering.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  private readonly defaultImage = `${environment.siteUrl}/assets/images/og-cover.jpg`;

  update(tags: SeoTags): void {
    const url = `${environment.siteUrl}${tags.path === '/' ? '/' : tags.path}`;
    const image = tags.image || this.defaultImage;

    this.meta.updateTag({ name: 'description', content: tags.description });
    this.meta.updateTag({ property: 'og:description', content: tags.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: tags.type || 'website' });

    // Twitter reads its own namespace; without these it falls back to a
    // plain link with no card.
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:description', content: tags.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);
  }

  /** Points <link rel="canonical"> at the current route, creating it if absent. */
  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  /**
   * Admin pages must never be indexed. robots.txt already disallows
   * /admin, but a stray link could still get the URL crawled - this makes
   * the exclusion explicit on the page itself.
   */
  setNoIndex(noIndex: boolean): void {
    if (noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }
}
