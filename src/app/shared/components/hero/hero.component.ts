import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../pipes/cloudinary-optimize.pipe';
import { logger } from '../../../core/logger';

/**
 * HeroComponent
 * Reusable full-bleed hero banner. Used as the large "We Build Dreams
 * Into Reality" section on Home, and as a smaller page-header variant
 * on interior pages (About, Projects, Gallery, etc).
 *
 * `backgroundImage`/`backgroundVideo` are both optional now - if neither
 * is set (Admin hasn't uploaded a banner for this page yet), a pure CSS
 * black-and-gold design renders instead of any placeholder image file,
 * so there's zero dependency on shipping static asset images. A real
 * image, once set, always gets a gold/black tint overlay on top so text
 * stays readable and on-brand no matter what photo is uploaded.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  @Input() backgroundImage?: string;
  @Input() backgroundVideo?: string;
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showButtons = false;
  /** Compact variant used on interior page headers instead of the full home hero. */
  @Input() compact = false;

  readonly videoFailed = signal(false);
  readonly imageFailed = signal(false);

  /** Base layer is the real image if one is set and loads successfully. */
  get showImage(): boolean {
    return !!this.backgroundImage && !this.imageFailed();
  }

  /** Base layer falls back to the pure CSS black/gold design when there's no working image. */
  get showDesign(): boolean {
    return !this.showImage;
  }

  /** Video plays as a separate layer on top of the base, independent of it. */
  get showVideo(): boolean {
    return !!this.backgroundVideo && !this.videoFailed();
  }

  onVideoError(): void {
    logger.warn(`[HeroComponent] Banner video failed to play, falling back to image/design: "${this.backgroundVideo}"`);
    this.videoFailed.set(true);
  }

  onImageError(): void {
    logger.warn(`[HeroComponent] Banner image failed to load, showing design fallback: "${this.backgroundImage}"`);
    this.imageFailed.set(true);
  }
}
