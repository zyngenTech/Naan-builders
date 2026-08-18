import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy } from './firebase.service';
import { InquiryModel, InquiryStatus } from '../models/inquiry.model';
import { logger } from '../logger';

const COLLECTION = 'inquiries';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private firebaseService = inject(FirebaseService);

  /** Saves a new inquiry submitted from the Contact page form. Public - no auth required (see firestore.rules). */
  sendInquiry(inquiry: Omit<InquiryModel, 'id'>): Observable<string> {
    logger.log('[InquiryService] Sending inquiry', inquiry);
    return this.firebaseService.saveData(COLLECTION, inquiry).pipe(
      tap((id) => logger.log(`[InquiryService] Inquiry saved with id "${id}"`)),
      catchError((error) => {
        logger.error('[InquiryService] Firebase Error while sending inquiry', error);
        throw error;
      })
    );
  }

  /** Admin only (see firestore.rules) - all inquiries, most recent first. */
  getAllInquiries(): Observable<InquiryModel[]> {
    logger.log('[InquiryService] Loading all inquiries');
    return this.firebaseService.getData<InquiryModel>(COLLECTION, [orderBy('createdDate', 'desc')]).pipe(
      tap((list) => logger.log(`[InquiryService] ${list.length} inquiries loaded`)),
      catchError((error) => {
        logger.error('[InquiryService] Failed to load inquiries', error);
        throw error;
      })
    );
  }

  /** Admin only - marks an inquiry as contacted/closed/new. */
  updateInquiryStatus(id: string, status: InquiryStatus): Observable<void> {
    logger.log(`[InquiryService] Updating inquiry "${id}" status -> "${status}"`);
    return this.firebaseService.updateData(COLLECTION, id, { status }).pipe(
      catchError((error) => {
        logger.error(`[InquiryService] Failed to update inquiry "${id}" status`, error);
        throw error;
      })
    );
  }

  /** Admin only - permanently deletes an inquiry. */
  deleteInquiry(id: string): Observable<void> {
    logger.log(`[InquiryService] Deleting inquiry "${id}"`);
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      catchError((error) => {
        logger.error(`[InquiryService] Failed to delete inquiry "${id}"`, error);
        throw error;
      })
    );
  }
}
