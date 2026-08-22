import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { CacheService } from './cache.service';
import { MilestoneModel } from '../models/milestone.model';
import { logger } from '../logger';

const COLLECTION = 'milestones';
const CACHE_KEY = 'milestones-all';

/** Full CRUD for the "milestones" collection (About page Journey timeline). */
@Injectable({ providedIn: 'root' })
export class MilestoneService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /** `useTransferState: false` - see the note on GalleryService.getAllItems(). */
  getAllMilestones(): Observable<MilestoneModel[]> {
    logger.log('[MilestoneService] Loading milestones');
    return this.cacheService.get(
      CACHE_KEY,
      () =>
        this.firebaseService
          .getData<MilestoneModel>(COLLECTION, [orderBy('order', 'asc')])
          .pipe(
            tap((list) => logger.log(`[MilestoneService] ${list.length} milestones loaded`)),
            catchError((error) => {
              logger.error('[MilestoneService] Failed to load milestones', error);
              throw error;
            })
          ),
      undefined,
      false
    );
  }

  saveMilestone(milestone: Partial<MilestoneModel>): Observable<string> {
    logger.log('[MilestoneService] Saving new milestone', milestone);
    return this.firebaseService.saveData(COLLECTION, milestone).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error('[MilestoneService] Failed to save milestone', error);
        throw error;
      })
    );
  }

  updateMilestone(id: string, milestone: Partial<MilestoneModel>): Observable<void> {
    logger.log(`[MilestoneService] Updating milestone "${id}"`, milestone);
    return this.firebaseService.updateData(COLLECTION, id, milestone).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[MilestoneService] Failed to update milestone "${id}"`, error);
        throw error;
      })
    );
  }

  deleteMilestone(id: string): Observable<void> {
    logger.log(`[MilestoneService] Deleting milestone "${id}"`);
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[MilestoneService] Failed to delete milestone "${id}"`, error);
        throw error;
      })
    );
  }
}

