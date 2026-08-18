import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { CacheService } from './cache.service';
import { SiteSettingsModel } from '../models/settings.model';
import { logger } from '../logger';

const COLLECTION = 'settings';
const DOC_ID = 'site';
const CACHE_KEY = 'settings-site';

/** Wraps the single "settings/site" document (company name, owner bio, stats, contact info, hero media). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /** Fetches the site settings - cached so repeated calls in the same session share one request. */
  getSiteSettings(): Observable<SiteSettingsModel> {
    return this.cacheService.get(CACHE_KEY, () =>
      this.firebaseService.getDocById<SiteSettingsModel>(COLLECTION, DOC_ID).pipe(
        tap((settings) => logger.log('[SettingsService] Site settings loaded', settings)),
        catchError((error) => {
          logger.error('[SettingsService] Failed to load site settings', error);
          throw error;
        })
      )
    );
  }

  /**
   * Creates or merges the "settings/site" document - used by the Admin
   * dashboard to edit stats, contact info, and hero banner media. Uses
   * setData (setDoc + merge) rather than updateData so this works even
   * before the document has ever been created. Every field is written
   * with a defined value (never `undefined`) so a saved image/URL is
   * never silently dropped by Firestore. Invalidates cache so the
   * next read anywhere in the app picks up the freshly-saved values.
   */
  updateSiteSettings(settings: Partial<SiteSettingsModel>): Observable<void> {
    logger.log('[SettingsService] Updating site settings', settings);
    return this.firebaseService.setData(COLLECTION, DOC_ID, settings, true).pipe(
      tap(() => {
        logger.log('[SettingsService] Site settings updated', settings);
        this.cacheService.invalidate(CACHE_KEY);
      }),
      catchError((error) => {
        logger.error('[SettingsService] Failed to update site settings', error);
        throw error;
      })
    );
  }
}
