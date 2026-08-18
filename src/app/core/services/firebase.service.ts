import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase/firestore/lite';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  QueryConstraint,
} from 'firebase/firestore/lite';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { firebaseApp } from '../firebase-app';
import { logger } from '../logger';

/**
 * FirebaseService
 * ----------------
 * A single, reusable gateway to Firestore.
 * Every page/service in the app should go through this class instead of
 * talking to Firebase directly - this keeps logging, error handling, and
 * future swap-outs (e.g. adding caching) in one place.
 *
 * Firestore access goes through `firebase/firestore/lite`, not the full
 * `firebase/firestore` SDK. This app only ever does one-time reads/writes
 * (getDoc/getDocs/addDoc/setDoc/updateDoc/deleteDoc) - it never uses
 * onSnapshot or offline persistence. The full SDK opens a persistent
 * WebChannel "Listen" stream for its internal sync engine even when an
 * app only calls getDoc/getDocs and never onSnapshot; Lite is a REST-only
 * client with no such stream, which is a straight drop-in for this app's
 * usage and meaningfully smaller to download/parse.
 *
 * Firebase Storage is deliberately NOT here - it lives in StorageService
 * (core/services/storage.service.ts). This class is reached by every
 * public page, so importing `firebase/storage` alongside it dragged the
 * whole Storage SDK into the initial bundle for visitors who never
 * upload anything. Keeping them apart lets Storage load only with the
 * lazy /admin chunk. See StorageService for the full reasoning.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private firestore = getFirestore(firebaseApp);

  // ------------------------------------------------------------------
  // FIRESTORE - READ (one-time; this is all Firestore Lite supports,
  // which is also all this app has ever used)
  // ------------------------------------------------------------------

  /**
   * Fetches every document in a collection as an array, optionally
   * filtered/ordered via Firestore QueryConstraints (where, orderBy, limit...).
   */
  getData<T>(collectionName: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    logger.log(`[FirebaseService] Loading collection "${collectionName}"`);
    const colRef = collection(this.firestore, collectionName);
    const q = constraints.length ? query(colRef, ...constraints) : query(colRef);

    return from(getDocs(q)).pipe(
      map((snapshot) => snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as T)),
      tap((data) => logger.log(`[FirebaseService] "${collectionName}" loaded (${data.length} docs)`)),
      catchError((error) => {
        logger.error(`[FirebaseService] Error loading "${collectionName}"`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetches a single document by id. Emits `undefined` (not an error) if
   * the document doesn't exist yet - callers already handle that case
   * (e.g. the "settings/site" document before Admin has saved anything).
   */
  getDocById<T>(collectionName: string, id: string): Observable<T> {
    logger.log(`[FirebaseService] Loading document "${collectionName}/${id}"`);
    const docRef = doc(this.firestore, collectionName, id);

    return from(getDoc(docRef)).pipe(
      map((snap) => (snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : (undefined as unknown as T))),
      tap(() => logger.log(`[FirebaseService] Document "${collectionName}/${id}" loaded`)),
      catchError((error) => {
        logger.error(`[FirebaseService] Error loading document "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  // ------------------------------------------------------------------
  // FIRESTORE - WRITE
  // ------------------------------------------------------------------

  /** Adds a new document to a collection. Returns the new document id. */
  saveData(collectionName: string, data: unknown): Observable<string> {
    logger.log(`[FirebaseService] Saving new document to "${collectionName}"`, data);
    const colRef = collection(this.firestore, collectionName);

    return from(addDoc(colRef, data as object)).pipe(
      map((docRef) => {
        logger.log(`[FirebaseService] Document saved with id "${docRef.id}"`);
        return docRef.id;
      }),
      catchError((error) => {
        logger.error(`[FirebaseService] Error saving to "${collectionName}"`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a document at a known id if it doesn't exist, or merges fields
   * into it if it does. Used for the single "settings/site" document, which
   * the Admin dashboard must be able to write to even before it exists.
   */
  setData(collectionName: string, id: string, data: unknown, merge = true): Observable<void> {
    logger.log(`[FirebaseService] Setting document "${collectionName}/${id}" (merge=${merge})`, data);
    const docRef = doc(this.firestore, collectionName, id);

    return from(setDoc(docRef, data as object, { merge })).pipe(
      tap(() => logger.log(`[FirebaseService] Document "${collectionName}/${id}" set`)),
      catchError((error) => {
        logger.error(`[FirebaseService] Error setting "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  /** Updates fields on an existing document. */
  updateData(collectionName: string, id: string, data: unknown): Observable<void> {
    logger.log(`[FirebaseService] Updating document "${collectionName}/${id}"`, data);
    const docRef = doc(this.firestore, collectionName, id);

    return from(updateDoc(docRef, data as object)).pipe(
      tap(() => logger.log(`[FirebaseService] Document "${collectionName}/${id}" updated`)),
      catchError((error) => {
        logger.error(`[FirebaseService] Error updating "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  /** Deletes a document. */
  deleteData(collectionName: string, id: string): Observable<void> {
    logger.log(`[FirebaseService] Deleting document "${collectionName}/${id}"`);
    const docRef = doc(this.firestore, collectionName, id);

    return from(deleteDoc(docRef)).pipe(
      tap(() => logger.log(`[FirebaseService] Document "${collectionName}/${id}" deleted`)),
      catchError((error) => {
        logger.error(`[FirebaseService] Error deleting "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }
}

// Re-export commonly used query helpers so pages don't need a second import
// from 'firebase/firestore/lite'.
export { orderBy, where };
