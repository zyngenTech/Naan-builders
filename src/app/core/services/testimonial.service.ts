import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { TestimonialModel } from '../models/testimonial.model';

const COLLECTION = 'testimonials';

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private firebaseService = inject(FirebaseService);

  getAllTestimonials(): Observable<TestimonialModel[]> {
    console.log('[TestimonialService] Loading testimonials');
    return this.firebaseService
      .getData<TestimonialModel>(COLLECTION, [orderBy('createdDate', 'desc')])
      .pipe(
        tap((list) => console.log(`[TestimonialService] ${list.length} testimonials loaded`)),
        catchError((error) => {
          console.error('[TestimonialService] Failed to load testimonials', error);
          throw error;
        })
      );
  }

  saveTestimonial(testimonial: Partial<TestimonialModel>): Observable<string> {
    return this.firebaseService.saveData(COLLECTION, testimonial);
  }

  updateTestimonial(id: string, data: Partial<TestimonialModel>): Observable<void> {
    return this.firebaseService.updateData(COLLECTION, id, data);
  }

  deleteTestimonial(id: string): Observable<void> {
    return this.firebaseService.deleteData(COLLECTION, id);
  }
}
