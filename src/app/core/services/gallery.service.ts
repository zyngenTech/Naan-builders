import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { CacheService } from './cache.service';
import { GalleryItemModel } from '../models/gallery-item.model';
import { logger } from '../logger';

const COLLECTION = 'gallery';
const CACHE_KEY = 'gallery-items';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /**
   * `useTransferState: false` (5th arg) - always does a live Firestore read
   * on first client load rather than trusting the prerendered build-time
   * snapshot, so a photo added in Admin shows on the public site the next
   * time anyone loads the page - no redeploy needed. See the long comment
   * on CacheService.get() and SettingsService.getSiteSettings() for the
   * full reasoning (this is the same fix, applied here at the client's
   * request: every content type must "save and show live", not just
   * settings). The prerendered snapshot is still generated at build time
   * and still what Google's first crawl sees - this only changes what the
   * browser trusts once it boots.
   */
  getAllItems(): Observable<GalleryItemModel[]> {
    logger.log('[GalleryService] Loading gallery items');
    return this.cacheService.get(
      CACHE_KEY,
      () =>
        this.firebaseService
          .getData<GalleryItemModel>(COLLECTION, [orderBy('createdDate', 'desc')])
          .pipe(
            tap((items) => logger.log(`[GalleryService] Images loaded (${items.length})`)),
            catchError((error) => {
              logger.error('[GalleryService] Failed to load gallery items', error);
              throw error;
            })
          ),
      undefined,
      false
    );
  }

  saveItem(item: Partial<GalleryItemModel>): Observable<string> {
    logger.log('[GalleryService] Saving new gallery item', item);
    return this.firebaseService.saveData(COLLECTION, item).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error('[GalleryService] Failed to save gallery item', error);
        throw error;
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    logger.log(`[GalleryService] Deleting gallery item "${id}"`);
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[GalleryService] Failed to delete gallery item "${id}"`, error);
        throw error;
      })
    );
  }
}
