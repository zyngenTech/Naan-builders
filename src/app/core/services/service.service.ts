import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { CacheService } from './cache.service';
import { ServiceModel } from '../models/service.model';
import { logger } from '../logger';

const COLLECTION = 'services';
const CACHE_KEY = 'services-all';

/** Wraps the "services" Firestore collection (House Construction, Structural Design, etc). */
@Injectable({ providedIn: 'root' })
export class ServiceOfferingService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /** `useTransferState: false` - see the note on GalleryService.getAllItems(). */
  getAllServices(): Observable<ServiceModel[]> {
    logger.log('[ServiceOfferingService] Loading services');
    return this.cacheService.get(
      CACHE_KEY,
      () =>
        this.firebaseService
          .getData<ServiceModel>(COLLECTION, [orderBy('order', 'asc')])
          .pipe(
            tap((list) => logger.log(`[ServiceOfferingService] ${list.length} services loaded`)),
            catchError((error) => {
              logger.error('[ServiceOfferingService] Failed to load services', error);
              throw error;
            })
          ),
      undefined,
      false
    );
  }

  saveService(service: Partial<ServiceModel>): Observable<string> {
    logger.log('[ServiceOfferingService] Saving new service', service);
    return this.firebaseService.saveData(COLLECTION, service).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error('[ServiceOfferingService] Failed to save service', error);
        throw error;
      })
    );
  }

  updateService(id: string, service: Partial<ServiceModel>): Observable<void> {
    logger.log(`[ServiceOfferingService] Updating service "${id}"`, service);
    return this.firebaseService.updateData(COLLECTION, id, service).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[ServiceOfferingService] Failed to update service "${id}"`, error);
        throw error;
      })
    );
  }

  deleteService(id: string): Observable<void> {
    logger.log(`[ServiceOfferingService] Deleting service "${id}"`);
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      tap(() => this.cacheService.invalidate(CACHE_KEY)),
      catchError((error) => {
        logger.error(`[ServiceOfferingService] Failed to delete service "${id}"`, error);
        throw error;
      })
    );
  }
}
