import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * HeroComponent
 * Reusable full-bleed hero banner. Used as the large "We Build Dreams
 * Into Reality" section on Home, and as a smaller page-header variant
 * on interior pages (About, Projects, Gallery, etc).
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  @Input() backgroundImage = 'assets/images/hero-default.jpg';
  /** Optional admin-uploaded video URL. When set, it autoplays/loops as the banner background instead of `backgroundImage`. */
  @Input() backgroundVideo = '';
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showButtons = false;
  /** Compact variant used on interior page headers instead of the full home hero. */
  @Input() compact = false;
}
