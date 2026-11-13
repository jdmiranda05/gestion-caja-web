import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { ConfirmService } from '../core/confirm.service';
import { ToastService } from '../core/toast.service';
import { Icon } from './icon';

/** Pila de notificaciones. */
@Component({
  selector: 'app-toaster',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toaster" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast ' + toast.kind" role="status">
          <app-icon [name]="icons[toast.kind]" [size]="18" />
          <div class="body">
            <strong>{{ toast.title }}</strong>
            @if (toast.detail) { <span>{{ toast.detail }}</span> }
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" (click)="toasts.dismiss(toast.id)" aria-label="Cerrar notificación">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toaster {
      position: fixed; z-index: 100; right: var(--s-5); bottom: var(--s-5);
      display: grid; gap: var(--s-2); width: min(380px, calc(100vw - 32px));
    }
    .toast {
      display: flex; align-items: flex-start; gap: var(--s-3);
      padding: var(--s-3) var(--s-2) var(--s-3) var(--s-4);
      background: var(--surface); border: 1px solid var(--line);
      border-radius: var(--r-md); box-shadow: var(--shadow-3);
      animation: pop-in var(--dur-2) var(--ease);
    }
    .toast > app-icon { margin-top: 1px; }
    .ok > app-icon { color: var(--ok); }
    .error > app-icon { color: var(--danger); }
    .warn > app-icon { color: var(--warn); }
    .info > app-icon { color: var(--info); }
    .body { flex: 1; display: grid; gap: 2px; font-size: var(--text-sm); }
    .body strong { font-weight: 600; }
    .body span { color: var(--ink-3); }
    @media (max-width: 640px) { .toaster { right: 16px; left: 16px; bottom: 16px; width: auto; } }
  `,
})
export class Toaster {
  protected readonly toasts = inject(ToastService);
  protected readonly icons = { ok: 'check-circle', error: 'alert-circle', warn: 'alert', info: 'info' } as const;
}

/** Diálogo modal reutilizable basado en <dialog> nativo (foco y Escape accesibles). */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" [class.wide]="wide()" (close)="closed.emit()" (click)="onBackdrop($event)"
            [attr.aria-labelledby]="'modal-title'">
      <div class="modal-inner">
        <header>
          <div>
            <h2 id="modal-title">{{ title() }}</h2>
            @if (subtitle()) { <p>{{ subtitle() }}</p> }
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" (click)="dialog.close()" aria-label="Cerrar">
            <app-icon name="x" />
          </button>
        </header>
        <div class="content"><ng-content /></div>
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 48px);
      padding: 0; border: 1px solid var(--line); border-radius: var(--r-lg);
      background: var(--surface); color: var(--ink); box-shadow: var(--shadow-3);
    }
    .modal.wide { width: min(720px, calc(100vw - 32px)); }
    .modal[open] { animation: pop-in var(--dur-2) var(--ease); }
    .modal::backdrop { background: var(--overlay); animation: fade-in var(--dur-2) var(--ease); }
    header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--s-3);
      padding: var(--s-5) var(--s-5) var(--s-3); }
    h2 { font-size: var(--text-lg); }
    header p { margin-top: 4px; color: var(--ink-3); font-size: var(--text-sm); }
    .content { padding: 0 var(--s-5) var(--s-5); }
    @media (max-width: 640px) {
      .modal { margin: auto auto 0; width: 100vw; max-width: 100vw; border-radius: var(--r-lg) var(--r-lg) 0 0; }
    }
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly open = input(false);
  readonly wide = input(false);
  readonly closed = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const element = this.dialog().nativeElement;
      if (this.open() && !element.open) element.showModal();
      if (!this.open() && element.open) element.close();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}

/** Diálogo global de confirmación (ConfirmService). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirm.current(); as c) {
      <app-modal [title]="c.title" [open]="true" (closed)="confirm.answer(false)">
        <p class="msg">{{ c.message }}</p>
        <div class="form-actions">
          <button class="btn" (click)="confirm.answer(false)">{{ c.cancelLabel ?? 'Cancelar' }}</button>
          <button class="btn" [class.btn-danger]="c.tone === 'danger'" [class.btn-primary]="c.tone !== 'danger'"
                  (click)="confirm.answer(true)">{{ c.confirmLabel ?? 'Confirmar' }}</button>
        </div>
      </app-modal>
    }
  `,
  styles: `.msg { color: var(--ink-2); margin-bottom: var(--s-5); }`,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
}
