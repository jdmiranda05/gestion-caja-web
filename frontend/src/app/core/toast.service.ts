import { Injectable, signal } from '@angular/core';

export type ToastKind = 'ok' | 'error' | 'warn' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

/** Notificaciones breves, apiladas abajo a la derecha. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  ok(title: string, detail?: string): void {
    this.push('ok', title, detail);
  }

  error(title: string, detail?: string): void {
    this.push('error', title, detail, 6000);
  }

  warn(title: string, detail?: string): void {
    this.push('warn', title, detail, 5000);
  }

  info(title: string, detail?: string): void {
    this.push('info', title, detail);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, title: string, detail?: string, duration = 3800): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list.slice(-3), { id, kind, title, detail }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
