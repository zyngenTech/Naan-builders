import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { SiteSettingsModel } from '../models/settings.model';

const COLLECTION = 'settings';
const DOC_ID = 'site';

/**
 * Wraps the single "settings/site" document (site name, logo, owner bio,
 * homepage stats, contact info, hero banner media) - fully admin-controlled,
 * no hardcoded fallback content. Also keeps an app-wide signal cache so the
 * navbar, footer, floating buttons, home hero, and contact page all reflect
 * admin edits immediately without re-fetching.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private firebaseService = inject(FirebaseService);

  /** Latest known settings, readable synchronously anywhere in the app. Null until loaded / if nothing has been saved yet. */
  readonly settings = signal<SiteSettingsModel | null>(null);
  private loaded = false;

  getSiteSettings(): Observable<SiteSettingsModel> {
    console.log('[SettingsService] Loading site settings');
    return this.firebaseService.getDocById<SiteSettingsModel>(COLLECTION, DOC_ID).pipe(
      tap((data) => {
        console.log('[SettingsService] Site settings loaded');
        this.settings.set(data);
        this.loaded = true;
      }),
      catchError((error) => {
        console.error('[SettingsService] Failed to load site settings', error);
        throw error;
      })
    );
  }

  /** Triggers a load into the shared signal cache only if it hasn't happened yet this session. */
  ensureLoaded(): void {
    if (this.loaded) return;
    this.getSiteSettings().subscribe({
      error: () => {
        // No "settings/site" doc yet (first run before an admin has saved anything).
        this.loaded = true;
      },
    });
  }

  /** Creates/updates the "settings/site" document (admin only) and refreshes the cache. */
  updateSiteSettings(data: Partial<SiteSettingsModel>): Observable<void> {
    console.log('[SettingsService] Updating site settings', data);
    return this.firebaseService.setData(COLLECTION, DOC_ID, data).pipe(
      tap(() => {
        this.settings.update((current) => ({ ...(current ?? {}), ...data } as SiteSettingsModel));
        this.loaded = true;
      })
    );
  }
}
