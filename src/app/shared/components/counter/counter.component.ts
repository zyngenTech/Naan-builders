import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CounterComponent
 * Animates a number counting up from 0 -> [end] once it scrolls into view.
 * Used for the "35+ Projects / 100% Satisfied / 10+ Years" stat strip.
 */
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent implements AfterViewInit, OnDestroy {
  @Input() end = 0;
  @Input() suffix = '';
  @Input() label = '';
  @Input() durationMs = 1600;

  readonly displayValue = signal(0);
  private observer?: IntersectionObserver;
  private hasAnimated = false;

  constructor(private hostRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
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
