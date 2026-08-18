import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage.service';
import { ToastService } from '../../../core/services/toast.service';
import { logger } from '../../../core/logger';

type UploadMode = 'file' | 'url';

/**
 * AdminUploadComponent
 * Single-file uploader used throughout the Admin dashboard (project cover
 * image, project video, owner photo, home banner video...). Supports two
 * ways to set the media: upload a file to Firebase Storage (with a live
 * progress bar), or paste an already-hosted URL directly - useful for
 * reusing existing CDN/YouTube links without re-uploading.
 * Shows a preview (image or video) of the current file/URL with a Remove
 * action, and falls back to a themed placeholder if the media fails to
 * load or play. Emits the final URL via `uploaded`, or notifies `removed`
 * when cleared.
 */
@Component({
  selector: 'app-admin-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-upload.component.html',
  styleUrl: './admin-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUploadComponent {
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  @Input() label = 'Upload File';
  @Input() accept: 'image' | 'video' = 'image';
  /** Storage folder this file is uploaded under, e.g. "projects/covers". */
  @Input() folder = 'uploads';
  /** Existing download URL, if any (for editing an already-saved record). */
  @Input() currentUrl: string | null = null;
  /**
   * CSS aspect-ratio for the dropzone/preview box, e.g. "16 / 9" for wide
   * banners, "3 / 4" for a portrait photo, "1.91 / 1" for a social share
   * image. Keeps every upload slot a consistent, properly-aligned shape
   * regardless of the uploaded image's real dimensions (object-fit: cover
   * crops to fill it, never stretches).
   */
  @Input() aspectRatio = '16 / 9';
  /** Recommended pixel dimensions shown under the label, e.g. "1600 x 900px". Helps avoid oddly-framed/cropped uploads. */
  @Input() sizeHint?: string;

  @Output() uploaded = new EventEmitter<string>();
  @Output() removed = new EventEmitter<void>();

  readonly progress = signal(0);
  readonly isUploading = signal(false);
  readonly mode = signal<UploadMode>('file');
  readonly urlInput = signal('');
  readonly mediaFailed = signal(false);

  get acceptAttr(): string {
    return this.accept === 'video' ? 'video/*' : 'image/*';
  }

  setMode(mode: UploadMode): void {
    this.mode.set(mode);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxSizeMb = this.accept === 'video' ? 100 : 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      logger.error(`[AdminUploadComponent] File too large (${file.size} bytes), max is ${maxSizeMb}MB`);
      this.toastService.error(`File is too large. Maximum size is ${maxSizeMb}MB.`);
      input.value = '';
      return;
    }

    const path = `${this.folder}/${Date.now()}_${file.name}`;
    logger.log(`[AdminUploadComponent] Starting upload to "${path}"`);
    this.isUploading.set(true);
    this.progress.set(0);

    this.storageService.uploadFile(path, file).subscribe({
      next: ({ progress, downloadUrl }) => {
        this.progress.set(progress);
        if (downloadUrl) {
          logger.log('[AdminUploadComponent] Upload complete', downloadUrl);
          this.mediaFailed.set(false);
          this.currentUrl = downloadUrl;
          this.isUploading.set(false);
          this.uploaded.emit(downloadUrl);
          this.toastService.success('File uploaded successfully.');
        }
      },
      error: (error) => {
        logger.error('[AdminUploadComponent] Upload failed', error);
        this.isUploading.set(false);
        this.toastService.error('Upload failed. Please try again.');
      },
    });

    input.value = '';
  }

  useUrl(): void {
    const url = this.urlInput().trim();
    if (!url) {
      this.toastService.error('Please paste a valid URL first.');
      return;
    }
    try {
      new URL(url);
    } catch {
      logger.error(`[AdminUploadComponent] Invalid URL entered: "${url}"`);
      this.toastService.error('That does not look like a valid URL.');
      return;
    }

    logger.log(`[AdminUploadComponent] Using external URL "${url}"`);
    this.mediaFailed.set(false);
    this.currentUrl = url;
    this.urlInput.set('');
    this.uploaded.emit(url);
    this.toastService.success('URL set successfully.');
  }

  onMediaError(): void {
    logger.error(`[AdminUploadComponent] Media failed to load: "${this.currentUrl}"`);
    this.mediaFailed.set(true);
  }

  clear(): void {
    logger.log('[AdminUploadComponent] Clearing selected file');
    this.currentUrl = null;
    this.mediaFailed.set(false);
    this.removed.emit();
  }
}
