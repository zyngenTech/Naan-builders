import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  afterNextRender,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CounterComponent
 * Animates a number counting up from 0 -> [end] once it scrolls into view.
 * Used for the "35+ Projects / 100% Satisfied / 10+ Years" stat strip.
 *
 * The IntersectionObserver setup runs inside `afterNextRender`, which Angular
 * guarantees only ever executes in the browser - never during a server-side
 * prerender. `IntersectionObserver` does not exist in Node, so building it in
 * `ngAfterViewInit` (which DOES run during prerendering, since Angular must
 * execute the full component lifecycle to produce the static HTML) would
 * throw and fail the build.
 */
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent implements OnDestroy {
  @Input() end = 0;
  @Input() suffix = '';
  @Input() label = '';
  @Input() durationMs = 1600;

  readonly displayValue = signal(0);
  private observer?: IntersectionObserver;
  private hasAnimated = false;

  constructor(private hostRef: ElementRef<HTMLElement>) {
    afterNextRender(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.hasAnimated) {
              this.hasAnimated = true;
              this.animateCount();
            }
          });
        },
        { threshold: 0.4 }
      );
      this.observer.observe(this.hostRef.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animateCount(): void {
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / this.durationMs, 1);
      // Ease-out cubic for a smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      this.displayValue.set(Math.round(eased * this.end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
