import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { VideoModalComponent } from '../../shared/components/video-modal/video-modal.component';

import { GalleryService } from '../../core/services/gallery.service';
import { GalleryItemModel } from '../../core/models/gallery-item.model';

/** Pinterest-style masonry gallery of images and videos, with lightbox. */
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, HeroComponent, LoaderComponent, ImageModalComponent, VideoModalComponent],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit {
  private galleryService = inject(GalleryService);

  readonly items = signal<GalleryItemModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeType = signal<'all' | 'image' | 'video'>('all');

  readonly filteredItems = computed(() => {
    const type = this.activeType();
    return type === 'all' ? this.items() : this.items().filter((i) => i.type === type);
  });

  readonly imageUrls = computed(() => this.items().filter((i) => i.type === 'image').map((i) => i.url));

  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly activeVideoUrl = signal<string | null>(null);

  ngOnInit(): void {
    console.log('[GalleryComponent] Loading gallery items');
    this.galleryService.getAllItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
        console.log('[GalleryComponent] Images Loaded');
      },
      error: (error) => {
        console.error('[GalleryComponent] Failed to load gallery items', error);
        this.isLoading.set(false);
      },
    });
  }

  setFilter(type: 'all' | 'image' | 'video'): void {
    this.activeType.set(type);
  }

  openItem(item: GalleryItemModel): void {
    if (item.type === 'video') {
      this.activeVideoUrl.set(item.url);
      return;
    }
    const index = this.imageUrls().indexOf(item.url);
    this.lightboxIndex.set(Math.max(index, 0));
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  closeVideo(): void {
    this.activeVideoUrl.set(null);
  }
}
