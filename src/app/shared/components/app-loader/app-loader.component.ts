import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../pipes/cloudinary-optimize.pipe';

/**
 * AppLoaderComponent
 * Full-screen branded loading modal shown while the site (re)loads or
 * navigates to a new lazy-loaded page, so there's never a blank flash -
 * just a smooth, on-brand loading state until content is ready. Shows
 * the admin-uploaded logo (circular) once it's known, falling back to a
 * generic icon before that first settings fetch resolves.
 */
@Component({
  selector: 'app-loader-modal',
  standalone: true,
  imports: [CommonModule, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './app-loader.component.html',
  styleUrl: './app-loader.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoaderComponent {
  @Input() visible = true;
  @Input() logoUrl: string | null = null;
}
