import { Injectable } from '@angular/core';

/**
 * CloudinaryService
 * Transforms Cloudinary URLs to optimize for web delivery:
 * - f_auto: Automatic format (WebP for modern browsers, jpg fallback)
 * - q_auto: Automatic quality (reduces file size without visible quality loss)
 * - w_<width>: Responsive width (served to specific viewport widths)
 * - c_fill: Fill mode (crops to exact dimensions)
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly CLOUDINARY_UPLOAD_URL = 'https://res.cloudinary.com';

  /**
   * Detects if a URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string): boolean {
    return !!url && url.includes(this.CLOUDINARY_UPLOAD_URL);
  }

  /**
   * Optimizes a Cloudinary URL for small brand/logo usage (navbar, footer,
   * loading modal). These render at ~40-80px in the UI - 200px covers
   * retina displays without shipping a multi-MB admin-uploaded original.
   */
  getLogo(url: string): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, ['w_200', 'c_fill', 'f_auto', 'q_auto']);
  }

  /**
   * Optimizes a Cloudinary URL for thumbnails/grid display
   * Width: 400px (2x = 800px for high-DPI devices)
   */
  getThumbnail(url: string): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, ['w_800', 'c_fill', 'f_auto', 'q_auto']);
  }

  /**
   * Optimizes a Cloudinary URL for mobile display (90vw on mobile ~375px)
   */
  getMobileOptimized(url: string): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, ['w_600', 'c_fill', 'f_auto', 'q_auto']);
  }

  /**
   * Optimizes a Cloudinary URL for tablet/desktop display
   */
  getDesktopOptimized(url: string): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, ['w_1200', 'c_fill', 'f_auto', 'q_auto']);
  }

  /**
   * Optimizes a Cloudinary URL for fullscreen viewing (lightbox)
   * Width: 1920px for ultra-wide displays
   */
  getFullscreen(url: string): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, ['w_1920', 'c_fill', 'f_auto', 'q_auto']);
  }

  /**
   * Get srcset for responsive images (3 density levels)
   * Usage: <img srcset="service.getResponsiveSrcset(url)" sizes="..." src="..." />
   */
  getResponsiveSrcset(url: string, widths: number[] = [600, 1000, 1400]): string {
    if (!this.isCloudinaryUrl(url)) return '';
    return widths
      .map((width) => {
        const optimized = this.addTransformations(url, [`w_${width}`, 'c_fill', 'f_auto', 'q_auto']);
        return `${optimized} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Get critical image URL (hero, above-the-fold)
   * Lower quality/smaller dimensions to load faster
   */
  getCritical(url: string, width = 800): string {
    if (!this.isCloudinaryUrl(url)) return url;
    return this.addTransformations(url, [`w_${width}`, 'c_fill', 'f_auto', 'q_70']);
  }

  /**
   * Transform an image URL by injecting Cloudinary transformation params
   * into the delivery URL between the upload path and filename
   *
   * Example:
   *   Input:  https://res.cloudinary.com/account/image/upload/v123/folder/image.jpg
   *   Output: https://res.cloudinary.com/account/image/upload/w_800,f_auto,q_auto/v123/folder/image.jpg
   */
  private addTransformations(url: string, transforms: string[]): string {
    if (!transforms.length) return url;

    // Cloudinary transformation format: /upload/<transforms>/...
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url; // Not a Cloudinary URL in expected format

    const beforeUpload = url.substring(0, uploadIndex + 8); // up to and including '/upload/'
    const afterUpload = url.substring(uploadIndex + 8);

    // Insert transforms between upload and the rest
    return `${beforeUpload}${transforms.join(',')}/` + afterUpload;
  }
}
