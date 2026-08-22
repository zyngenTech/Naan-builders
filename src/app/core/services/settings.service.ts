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

  /**
   * Fetches the site settings - cached so repeated calls in the same session
   * share one request.
   *
   * `useTransferState: false` (the 4th argument) - this is the one piece of
   * content that opts out of reusing the prerendered build-time snapshot on
   * the client. Settings carries the site's phone/email/address, which an
   * Admin can change at any time; every other page (projects, gallery,
   * testimonials...) is fine staying "as of the last deploy" until the next
   * `npm run deploy`, but a stale contact email showing a real customer the
   * wrong address to reach the business is a lost-lead bug, not an
   * acceptable trade-off. This makes the browser always fetch current
   * settings on first load instead of trusting whatever was baked in at
   * build time - see the long comment on CacheService.get() for the full
   * story and the incident that prompted it.
   */
  getSiteSettings(): Observable<SiteSettingsModel> {
    return this.cacheService.get(
      CACHE_KEY,
      () =>
        this.firebaseService.getDocById<SiteSettingsModel>(COLLECTION, DOC_ID).pipe(
          tap((settings) => logger.log('[SettingsService] Site settings loaded', settings)),
          catchError((error) => {
            logger.error('[SettingsService] Failed to load site settings', error);
            throw error;
          })
        ),
      undefined,
      false
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
