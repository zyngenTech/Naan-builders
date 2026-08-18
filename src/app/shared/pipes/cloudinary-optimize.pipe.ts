import { Pipe, PipeTransform, inject } from '@angular/core';
import { CloudinaryService } from '../../core/services/cloudinary.service';

export type CloudinaryOptimizeType = 'logo' | 'thumbnail' | 'mobile' | 'desktop' | 'fullscreen' | 'critical';

/**
 * CloudinaryOptimizePipe
 * -----------------------
 * Template-friendly, REACTIVE replacement for the old `appImgOptimize`
 * attribute directive. Wraps the existing `CloudinaryService` so the
 * transformation logic (f_auto, q_auto, responsive widths) is unchanged -
 * only *how* it's applied changes.
 *
 * Why this replaces the directive:
 * `ImgOptimizeDirective` read `img.src` once in `ngOnInit()` and mutated
 * the DOM attribute imperatively. That works for the very first value an
 * `<img>` element ever gets, but Angular does not call `ngOnInit()` again
 * when a later change-detection cycle updates the same element's `[src]`
 * binding to a *different* URL (e.g. the lightbox `<app-image-modal>`
 * reusing one `<img>` across Next/Prev clicks: `[src]="images[activeIndex]"`).
 * The result: every image after the first one shown in the lightbox
 * silently fell back to the raw, unoptimized Cloudinary original.
 *
 * A pure pipe re-evaluates automatically whenever its input value
 * changes - including on OnPush components - with no lifecycle timing
 * pitfalls, so this fixes that class of bug entirely rather than just
 * patching the one call site.
 *
 * Usage: <img [src]="url | cldOptimize:'desktop'" ... />
 */
@Pipe({
  name: 'cldOptimize',
  standalone: true,
  pure: true,
})
export class CloudinaryOptimizePipe implements PipeTransform {
  private cloudinary = inject(CloudinaryService);

  transform(url: string | null | undefined, type: CloudinaryOptimizeType = 'desktop'): string {
    if (!url) return '';
    switch (type) {
      case 'logo':
        return this.cloudinary.getLogo(url);
      case 'thumbnail':
        return this.cloudinary.getThumbnail(url);
      case 'mobile':
        return this.cloudinary.getMobileOptimized(url);
      case 'desktop':
        return this.cloudinary.getDesktopOptimized(url);
      case 'fullscreen':
        return this.cloudinary.getFullscreen(url);
      case 'critical':
        return this.cloudinary.getCritical(url);
      default:
        return url;
    }
  }
}
