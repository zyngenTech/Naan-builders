import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  QueryConstraint,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * FirebaseService
 * ----------------
 * A single, reusable gateway to Firestore + Firebase Storage.
 * Every page/service in the app should go through this class instead of
 * talking to `@angular/fire` directly - this keeps logging, error handling,
 * and future swap-outs (e.g. adding caching) in one place.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private injector = inject(Injector);

  // ------------------------------------------------------------------
  // FIRESTORE - READ
  // ------------------------------------------------------------------

  /**
   * Streams every document in a collection as an array, optionally
   * filtered/ordered via Firestore QueryConstraints (where, orderBy, limit...).
   */
  getData<T>(collectionName: string, constraints: QueryConstraint[] = []): Observable<T[]> {
    console.log(`[FirebaseService] Loading collection "${collectionName}"`);
    const ref = collection(this.firestore, collectionName);
    const q = constraints.length ? query(ref, ...constraints) : query(ref);

    return (
      runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' })) as Observable<T[]>
    ).pipe(
      tap((data) => console.log(`[FirebaseService] "${collectionName}" loaded (${data.length} docs)`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error loading "${collectionName}"`, error);
        return throwError(() => error);
      })
    );
  }

  /** Streams a single document by id. */
  getDocById<T>(collectionName: string, id: string): Observable<T> {
    console.log(`[FirebaseService] Loading document "${collectionName}/${id}"`);
    const ref = doc(this.firestore, collectionName, id);

    return (
      runInInjectionContext(this.injector, () => docData(ref, { idField: 'id' })) as Observable<T>
    ).pipe(
      tap(() => console.log(`[FirebaseService] Document "${collectionName}/${id}" loaded`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error loading document "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  // ------------------------------------------------------------------
  // FIRESTORE - WRITE
  // ------------------------------------------------------------------

  /** Adds a new document to a collection. Returns the new document id. */
  saveData(collectionName: string, data: unknown): Observable<string> {
    console.log(`[FirebaseService] Saving new document to "${collectionName}"`, data);
    const ref = collection(this.firestore, collectionName);

    return from(addDoc(ref, data as object)).pipe(
      map((docRef) => {
        console.log(`[FirebaseService] Document saved with id "${docRef.id}"`);
        return docRef.id;
      }),
      catchError((error) => {
        console.error(`[FirebaseService] Error saving to "${collectionName}"`, error);
        return throwError(() => error);
      })
    );
  }

  /** Updates fields on an existing document. */
  updateData(collectionName: string, id: string, data: unknown): Observable<void> {
    console.log(`[FirebaseService] Updating document "${collectionName}/${id}"`, data);
    const ref = doc(this.firestore, collectionName, id);

    return from(updateDoc(ref, data as object)).pipe(
      tap(() => console.log(`[FirebaseService] Document "${collectionName}/${id}" updated`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error updating "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates or overwrites a document at a known id (merge: true), so callers
   * don't need to know in advance whether it already exists. Used for
   * singleton docs like "settings/site".
   */
  setData(collectionName: string, id: string, data: unknown): Observable<void> {
    console.log(`[FirebaseService] Upserting document "${collectionName}/${id}"`, data);
    const ref = doc(this.firestore, collectionName, id);

    return from(setDoc(ref, data as object, { merge: true })).pipe(
      tap(() => console.log(`[FirebaseService] Document "${collectionName}/${id}" upserted`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error upserting "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  /** Deletes a document. */
  deleteData(collectionName: string, id: string): Observable<void> {
    console.log(`[FirebaseService] Deleting document "${collectionName}/${id}"`);
    const ref = doc(this.firestore, collectionName, id);

    return from(deleteDoc(ref)).pipe(
      tap(() => console.log(`[FirebaseService] Document "${collectionName}/${id}" deleted`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error deleting "${collectionName}/${id}"`, error);
        return throwError(() => error);
      })
    );
  }

  // ------------------------------------------------------------------
  // STORAGE
  // ------------------------------------------------------------------

  /**
   * Uploads a file to Firebase Storage under `path` and returns a
   * progress-reporting Observable that completes with the final download URL.
   * Emits { progress: number, downloadUrl?: string } so callers can drive a
   * progress bar and know when the upload is fully done.
   */
  uploadFile(path: string, file: File): Observable<{ progress: number; downloadUrl?: string }> {
    console.log(`[FirebaseService] Uploading file to "${path}"`);
    const storageRef = ref(this.storage, path);
    const task = uploadBytesResumable(storageRef, file);

    return new Observable((observer) => {
      task.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          observer.next({ progress });
        },
        (error) => {
          console.error(`[FirebaseService] Upload failed for "${path}"`, error);
          observer.error(error);
        },
        () => {
          getDownloadURL(task.snapshot.ref)
            .then((downloadUrl) => {
              console.log(`[FirebaseService] Upload complete for "${path}"`);
              observer.next({ progress: 100, downloadUrl });
              observer.complete();
            })
            .catch((error) => {
              console.error(`[FirebaseService] Failed to resolve download URL for "${path}"`, error);
              observer.error(error);
            });
        }
      );
    });
  }

  /** Deletes a file from Storage given its full storage path. */
  deleteFile(path: string): Observable<void> {
    console.log(`[FirebaseService] Deleting file "${path}"`);
    const storageRef = ref(this.storage, path);

    return from(deleteObject(storageRef)).pipe(
      tap(() => console.log(`[FirebaseService] File "${path}" deleted`)),
      catchError((error) => {
        console.error(`[FirebaseService] Error deleting file "${path}"`, error);
        return throwError(() => error);
      })
    );
  }
}

// Re-export commonly used query helpers so pages don't need a second import
// from '@angular/fire/firestore'.
export { orderBy, where };
