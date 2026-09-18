import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast$ = new BehaviorSubject<ToastMessage | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, type: ToastType = 'success'): void {
    this.toast$.next({ message, type });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.toast$.next(null), 3200);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.toast$.next(null);
  }
}