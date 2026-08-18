import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { logger } from '../../../core/logger';

/** Fullscreen modal for playing a project/gallery video (YouTube embed or direct file). */
@Component({
  selector: 'app-video-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-modal.component.html',
  styleUrl: './video-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoModalComponent {
  @Input() set videoUrl(url: string) {
    this._rawUrl = url;
    this.isEmbed = url.includes('youtube.com') || url.includes('youtu.be');
    this.safeUrl = this.isEmbed ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : url;
  }
  @Output() closed = new EventEmitter<void>();

  isEmbed = false;
  safeUrl: SafeResourceUrl | string = '';
  private _rawUrl = '';

  constructor(private sanitizer: DomSanitizer) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    logger.log('[VideoModalComponent] Closing video player');
    this.closed.emit();
  }
}
