import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { InquiryModel } from '../models/inquiry.model';

const COLLECTION = 'inquiries';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private firebaseService = inject(FirebaseService);

  /** Saves a new inquiry submitted from the Contact page form. */
  sendInquiry(inquiry: Omit<InquiryModel, 'id'>): Observable<string> {
    console.log('[InquiryService] Sending inquiry', inquiry);
    return this.firebaseService.saveData(COLLECTION, inquiry).pipe(
      tap((id) => console.log(`[InquiryService] Inquiry saved with id "${id}"`)),
      catchError((error) => {
        console.error('[InquiryService] Firebase Error while sending inquiry', error);
        throw error;
      })
    );
  }
}
