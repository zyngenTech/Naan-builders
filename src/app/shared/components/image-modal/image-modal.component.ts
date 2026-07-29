import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ImageModalComponent
 * Fullscreen lightbox for viewing a project/gallery image, with
 * previous/next navigation across a supplied image array.
 */
@Component({
  selector: 'app-image-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-modal.component.html',
  styleUrl: './image-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageModalComponent {
  @Input() images: string[] = [];
  @Input() activeIndex = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
  }

  close(): void {
    console.log('[ImageModalComponent] Closing lightbox');
    this.closed.emit();
  }

  next(): void {
    const nextIndex = (this.activeIndex + 1) % this.images.length;
    this.indexChange.emit(nextIndex);
  }

  prev(): void {
    const prevIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
    this.indexChange.emit(prevIndex);
  }
}
