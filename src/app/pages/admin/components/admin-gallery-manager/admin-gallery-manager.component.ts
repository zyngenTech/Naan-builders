import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminUploadComponent } from '../../../../shared/components/admin-upload/admin-upload.component';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';
import { GalleryService } from '../../../../core/services/gallery.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GalleryItemModel } from '../../../../core/models/gallery-item.model';
import { logger } from '../../../../core/logger';

/** Full CRUD for the "gallery" collection (Pinterest-style masonry page). */
@Component({
  selector: 'app-admin-gallery-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminUploadComponent, ImgFallbackDirective],
  templateUrl: './admin-gallery-manager.component.html',
  styleUrl: './admin-gallery-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGalleryManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);

  readonly items = signal<GalleryItemModel[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);

  readonly fileUrl = signal<string | null>(null);
  readonly fileType = signal<'image' | 'video'>('image');

  readonly captionForm = this.fb.nonNullable.group({
    caption: [''],
  });

  ngOnInit(): void {
    logger.log('[AdminGalleryManagerComponent] Loading gallery items');
    this.loadItems();
  }

  private loadItems(): void {
    this.isLoading.set(true);
    this.galleryService.getAllItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminGalleryManagerComponent] Failed to load gallery items', error);
        this.isLoading.set(false);
      },
    });
  }

  openAddForm(type: 'image' | 'video'): void {
    this.fileType.set(type);
    this.fileUrl.set(null);
    this.captionForm.reset();
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  onFileUploaded(url: string): void {
    this.fileUrl.set(url);
  }
  onFileRemoved(): void {
    this.fileUrl.set(null);
  }

  onSubmit(): void {
    if (!this.fileUrl()) {
      this.toastService.error('Please upload a file first.');
      return;
    }

    const payload: Partial<GalleryItemModel> = {
      type: this.fileType(),
      url: this.fileUrl()!,
      caption: this.captionForm.getRawValue().caption,
      createdDate: new Date().toISOString(),
    };

    logger.log('[AdminGalleryManagerComponent] Saving new gallery item', payload);
    this.isSaving.set(true);

    this.galleryService.saveItem(payload).subscribe({
      next: () => {
        this.toastService.success('Gallery item added.');
        this.isSaving.set(false);
        this.showForm.set(false);
        this.loadItems();
      },
      error: (error) => {
        logger.error('[AdminGalleryManagerComponent] Failed to save gallery item', error);
        this.toastService.error('Failed to save gallery item.');
        this.isSaving.set(false);
      },
    });
  }

  deleteItem(item: GalleryItemModel): void {
    if (!item.id) return;
    if (!confirm('Delete this gallery item?')) return;

    logger.log(`[AdminGalleryManagerComponent] Deleting gallery item "${item.id}"`);
    this.galleryService.deleteItem(item.id).subscribe({
      next: () => {
        this.toastService.success('Gallery item deleted.');
        this.loadItems();
      },
      error: (error) => {
        logger.error(`[AdminGalleryManagerComponent] Failed to delete gallery item "${item.id}"`, error);
        this.toastService.error('Failed to delete gallery item.');
      },
    });
  }
}
