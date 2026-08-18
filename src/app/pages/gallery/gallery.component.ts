import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { VideoModalComponent } from '../../shared/components/video-modal/video-modal.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../shared/pipes/cloudinary-optimize.pipe';

import { GalleryService } from '../../core/services/gallery.service';
import { SettingsService } from '../../core/services/settings.service';
import { GalleryItemModel } from '../../core/models/gallery-item.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { logger } from '../../core/logger';

/** Pinterest-style masonry gallery of images and videos, with lightbox. */
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, HeroComponent, LoaderComponent, ImageModalComponent, VideoModalComponent, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryComponent implements OnInit {
  private galleryService = inject(GalleryService);
  private settingsService = inject(SettingsService);

  readonly items = signal<GalleryItemModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeType = signal<'all' | 'image' | 'video'>('all');
  readonly settings = signal<SiteSettingsModel | null>(null);

  readonly filteredItems = computed(() => {
    const type = this.activeType();
    return type === 'all' ? this.items() : this.items().filter((i) => i.type === type);
  });

  readonly imageUrls = computed(() => this.items().filter((i) => i.type === 'image').map((i) => i.url));

  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly activeVideoUrl = signal<string | null>(null);

  ngOnInit(): void {
    logger.log('[GalleryComponent] Loading gallery items');
    this.galleryService.getAllItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
        logger.log('[GalleryComponent] Images Loaded');
      },
      error: (error) => {
        logger.error('[GalleryComponent] Failed to load gallery items', error);
        this.isLoading.set(false);
      },
    });

    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings ?? null),
      error: (error) => logger.error('[GalleryComponent] Failed to load site settings', error),
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
