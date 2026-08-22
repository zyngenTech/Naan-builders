import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { CacheService } from './cache.service';
import { TestimonialModel } from '../models/testimonial.model';
import { logger } from '../logger';

const COLLECTION = 'testimonials';
const CACHE_KEY = 'testimonials-all';

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /** `useTransferState: false` - see the note on GalleryService.getAllItems(). */
  getAllTestimonials(): Observable<TestimonialModel[]> {
    logger.log('[TestimonialService] Loading testimonials');
    return this.cacheService.get(
      CACHE_KEY,
      () =>
        this.firebaseService
          .getData<TestimonialModel>(COLLECTION, [orderBy('createdDate', 'desc')])
          .pipe(
            tap((list) => logger.log(`[TestimonialService] ${list.length} testimonials loaded`)),
            catchError((error) => {
              logger.error('[TestimonialService] Failed to load testimonials', error);
              throw error;
            })
          ),
      undefined,
      false
    );
  }

  saveTestimonial(testimonial: Partial<TestimonialModel>): Observable<string> {
    logger.log('[TestimonialService] Saving new testimonial', testimonial);
    return this.firebaseService.saveData(COLLECTION, testimonial).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error('[TestimonialService] Failed to save testimonial', error);
        throw error;
      })
    );
  }

  updateTestimonial(id: string, testimonial: Partial<TestimonialModel>): Observable<void> {
    logger.log(`[TestimonialService] Updating testimonial "${id}"`, testimonial);
    return this.firebaseService.updateData(COLLECTION, id, testimonial).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[TestimonialService] Failed to update testimonial "${id}"`, error);
        throw error;
      })
    );
  }

  deleteTestimonial(id: string): Observable<void> {
    logger.log(`[TestimonialService] Deleting testimonial "${id}"`);
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[TestimonialService] Failed to delete testimonial "${id}"`, error);
        throw error;
      })
    );
  }
}
