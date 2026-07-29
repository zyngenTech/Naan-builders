import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

/**
 * ToastService
 * ------------
 * Lightweight, signal-based toast/snackbar notifier used across the app
 * (e.g. inquiry submitted successfully, Firestore errors, etc).
 * <app-toast/> in the shell reads `toasts()` and renders them.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  success(text: string): void {
    console.log('[ToastService] success:', text);
    this.push('success', text);
  }

  error(text: string): void {
    console.log('[ToastService] error:', text);
    this.push('error', text);
  }

  info(text: string): void {
    console.log('[ToastService] info:', text);
    this.push('info', text);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(type: ToastType, text: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, text }]);
    // Auto-dismiss after 4.5s
    setTimeout(() => this.dismiss(id), 4500);
  }
}
