import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../../core/services/storage.service';
import { ToastService } from '../../../core/services/toast.service';
import { logger } from '../../../core/logger';

/**
 * AdminMultiUploadComponent
 * Multi-file uploader for an array field - a project's gallery[] images or
 * its videos[] list. Add files either by uploading (one at a time, with a
 * progress bar) or by pasting an already-hosted URL. Remove individual
 * items; the current full list is emitted via `urlsChange` after every
 * change. Each thumbnail falls back to a themed placeholder if the file
 * fails to load/play.
 */
@Component({
  selector: 'app-admin-multi-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-multi-upload.component.html',
  styleUrl: './admin-multi-upload.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMultiUploadComponent {
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);

  @Input() label = 'Gallery Images';
  @Input() accept: 'image' | 'video' = 'image';
  @Input() folder = 'uploads/gallery';
  @Input() urls: string[] = [];
  /** Recommended pixel dimensions shown under the label, e.g. "1200 x 900px". */
  @Input() sizeHint?: string;
  @Output() urlsChange = new EventEmitter<string[]>();

  readonly isUploading = signal(false);
  readonly progress = signal(0);
  readonly showUrlInput = signal(false);
  readonly urlInput = signal('');
  readonly failedUrls = signal<Set<string>>(new Set());

  get acceptAttr(): string {
    return this.accept === 'video' ? 'video/*' : 'image/*';
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    logger.log(`[AdminMultiUploadComponent] Uploading ${files.length} file(s) to "${this.folder}"`);
    this.uploadNext(Array.from(files));
    input.value = '';
  }

  private uploadNext(remaining: File[]): void {
    if (remaining.length === 0) {
      this.isUploading.set(false);
      return;
    }

    const [file, ...rest] = remaining;
    this.isUploading.set(true);
    this.progress.set(0);
    const path = `${this.folder}/${Date.now()}_${file.name}`;

    this.storageService.uploadFile(path, file).subscribe({
      next: ({ progress, downloadUrl }) => {
        this.progress.set(progress);
        if (downloadUrl) {
          logger.log('[AdminMultiUploadComponent] Uploaded', downloadUrl);
          this.urls = [...this.urls, downloadUrl];
          this.urlsChange.emit(this.urls);
          this.uploadNext(rest);
        }
      },
      error: (error) => {
        logger.error('[AdminMultiUploadComponent] Upload failed', error);
        this.toastService.error('One of the uploads failed. Please try again.');
        this.uploadNext(rest);
      },
    });
  }

  toggleUrlInput(): void {
    this.showUrlInput.update((v) => !v);
    this.urlInput.set('');
  }

  addUrl(): void {
    const url = this.urlInput().trim();
    if (!url) {
      this.toastService.error('Please paste a valid URL first.');
      return;
    }
    try {
      new URL(url);
    } catch {
      logger.error(`[AdminMultiUploadComponent] Invalid URL entered: "${url}"`);
      this.toastService.error('That does not look like a valid URL.');
      return;
    }

    logger.log(`[AdminMultiUploadComponent] Adding external URL "${url}"`);
    this.urls = [...this.urls, url];
    this.urlsChange.emit(this.urls);
    this.urlInput.set('');
  }

  onMediaError(url: string): void {
    logger.error(`[AdminMultiUploadComponent] Media failed to load: "${url}"`);
    const next = new Set(this.failedUrls());
    next.add(url);
    this.failedUrls.set(next);
  }

  removeAt(index: number): void {
    logger.log(`[AdminMultiUploadComponent] Removing item at index ${index}`);
    this.urls = this.urls.filter((_, i) => i !== index);
    this.urlsChange.emit(this.urls);
  }
}
