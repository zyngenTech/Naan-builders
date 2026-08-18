import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { logger } from '../../core/logger';

/**
 * ImgFallbackDirective
 * Applied to any <img> tag across the site (project covers, gallery
 * thumbnails, testimonial photos, admin previews...). If the real image
 * fails to load (broken Storage URL, deleted file, bad external link),
 * it swaps in an on-brand placeholder graphic instead of the browser's
 * default broken-image icon, so the layout never looks broken.
 * Usage: <img [src]="url" appImgFallback />
 *
 * Deliberately has no @Input of the same name as the selector - a bare
 * attribute like `appImgFallback` (no square brackets) is always parsed
 * as a string binding, so pairing it with a same-named boolean @Input
 * causes a template type-check error. The directive is simply active
 * whenever the attribute is present.
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true,
})
export class ImgFallbackDirective {
  private hasFailed = false;

  // Inline SVG placeholder (charcoal background, gold picture icon) - no
  // network request needed, so it always renders instantly.
  private readonly placeholder =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#1a1e24"/>
        <g fill="none" stroke="#c9a267" stroke-width="6" opacity="0.6">
          <rect x="90" y="80" width="220" height="150" rx="10"/>
          <circle cx="150" cy="130" r="16"/>
          <path d="M90 210 L160 150 L210 190 L260 140 L310 210" />
        </g>
      </svg>`
    );

  constructor(private el: ElementRef<HTMLImageElement>, private renderer: Renderer2) {}

  @HostListener('error')
  onError(): void {
    if (this.hasFailed) return;
    this.hasFailed = true;
    logger.warn(`[ImgFallbackDirective] Image failed to load, showing placeholder: "${this.el.nativeElement.src}"`);
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    this.renderer.addClass(this.el.nativeElement, 'img-fallback--active');
  }
}
