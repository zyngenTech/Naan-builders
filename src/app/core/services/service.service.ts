import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { ServiceModel } from '../models/service.model';

const COLLECTION = 'services';

/** Wraps the "services" Firestore collection (House Construction, Structural Design, etc). */
@Injectable({ providedIn: 'root' })
export class ServiceOfferingService {
  private firebaseService = inject(FirebaseService);

  getAllServices(): Observable<ServiceModel[]> {
    console.log('[ServiceOfferingService] Loading services');
    return this.firebaseService
      .getData<ServiceModel>(COLLECTION, [orderBy('order', 'asc')])
      .pipe(
        tap((list) => console.log(`[ServiceOfferingService] ${list.length} services loaded`)),
        catchError((error) => {
          console.error('[ServiceOfferingService] Failed to load services', error);
          throw error;
        })
      );
  }

  saveService(service: Partial<ServiceModel>): Observable<string> {
    return this.firebaseService.saveData(COLLECTION, service);
  }

  updateService(id: string, data: Partial<ServiceModel>): Observable<void> {
    return this.firebaseService.updateData(COLLECTION, id, data);
  }

  deleteService(id: string): Observable<void> {
    return this.firebaseService.deleteData(COLLECTION, id);
  }
}
