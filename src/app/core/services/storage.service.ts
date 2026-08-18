import { Injectable } from '@angular/core';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { firebaseApp } from '../firebase-app';
import { logger } from '../logger';

/**
 * StorageService
 * --------------
 * Firebase Storage access - uploads and deletes. Split out of
 * FirebaseService purely for bundle reasons.
 *
 * FirebaseService is `providedIn: 'root'` and every public page reaches
 * it (via SettingsService, ProjectService, GalleryService...). While it
 * also imported `firebase/storage` at module scope, the whole Storage
 * SDK was pulled into the INITIAL bundle and parsed on every visit to
 * the home page - even though nothing on the public site uploads or
 * deletes anything. Only the two Admin uploader components
 * (<app-admin-upload> and <app-admin-multi-upload>) ever call these
 * methods, and those live behind the lazy-loaded /admin route.
 *
 * Because this class is tree-shakeable and referenced only from those
 * components, `firebase/storage` now lands in the admin chunk instead of
 * the initial one. Firestore access stays in FirebaseService and stays
 * on `firebase/firestore/lite` exactly as before - nothing about the
 * read/write path changed.
 *
 * IMPORTANT: do not inject this from any public (non-admin) page, or the
 * Storage SDK returns to the initial bundle and the win is undone.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = getStorage(firebaseApp);

  /**
   * Uploads a file to Firebase Storage under `path` and returns a
   * progress-reporting Observable that completes with the final download URL.
   * Emits { progress: number, downloadUrl?: string } so callers can drive a
   * progress bar and know when the upload is fully done.
   */
  uploadFile(path: string, file: File): Observable<{ progress: number; downloadUrl?: string }> {
    logger.log(`[StorageService] Uploading file to "${path}"`);
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
          logger.error(`[StorageService] Upload failed for "${path}"`, error);
          observer.error(error);
        },
        () => {
          getDownloadURL(task.snapshot.ref)
            .then((downloadUrl) => {
              logger.log(`[StorageService] Upload complete for "${path}"`);
              observer.next({ progress: 100, downloadUrl });
              observer.complete();
            })
            .catch((error) => {
              logger.error(`[StorageService] Failed to resolve download URL for "${path}"`, error);
              observer.error(error);
            });
        }
      );
    });
  }

  /** Deletes a file from Storage given its full storage path. */
  deleteFile(path: string): Observable<void> {
    logger.log(`[StorageService] Deleting file "${path}"`);
    const storageRef = ref(this.storage, path);

    return from(deleteObject(storageRef)).pipe(
      tap(() => logger.log(`[StorageService] File "${path}" deleted`)),
      catchError((error) => {
        logger.error(`[StorageService] Error deleting file "${path}"`, error);
        return throwError(() => error);
      })
    );
  }
}
