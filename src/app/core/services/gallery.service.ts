import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { GalleryItemModel } from '../models/gallery-item.model';

const COLLECTION = 'gallery';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private firebaseService = inject(FirebaseService);

  getAllItems(): Observable<GalleryItemModel[]> {
    console.log('[GalleryService] Loading gallery items');
    return this.firebaseService
      .getData<GalleryItemModel>(COLLECTION, [orderBy('createdDate', 'desc')])
      .pipe(
        tap((items) => console.log(`[GalleryService] Images loaded (${items.length})`)),
        catchError((error) => {
          console.error('[GalleryService] Failed to load gallery items', error);
          throw error;
        })
      );
  }

  saveItem(item: Partial<GalleryItemModel>): Observable<string> {
    return this.firebaseService.saveData(COLLECTION, item);
  }

  updateItem(id: string, data: Partial<GalleryItemModel>): Observable<void> {
    return this.firebaseService.updateData(COLLECTION, id, data);
  }

  deleteItem(id: string): Observable<void> {
    return this.firebaseService.deleteData(COLLECTION, id);
  }
}
