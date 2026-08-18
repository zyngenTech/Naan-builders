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

  getAllItems(): Observable<GalleryItemModel[]> {
    logger.log('[GalleryService] Loading gallery items');
    return this.cacheService.get(CACHE_KEY, () =>
      this.firebaseService
        .getData<GalleryItemModel>(COLLECTION, [orderBy('createdDate', 'desc')])
        .pipe(
          tap((items) => logger.log(`[GalleryService] Images loaded (${items.length})`)),
          catchError((error) => {
            logger.error('[GalleryService] Failed to load gallery items', error);
            throw error;
          })
        )
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
