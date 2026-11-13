import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from './icon';

/** Estado vacío: icono, título, explicación y una acción opcional proyectada. */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" [class.compact]="compact()">
      <div class="empty-mark"><app-icon [name]="icon()" [size]="compact() ? 18 : 22" /></div>
      <h3>{{ title() }}</h3>
      @if (description()) {
        <p>{{ description() }}</p>
      }
      <div class="empty-actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty {
      display: grid;
      justify-items: center;
      text-align: center;
      gap: var(--s-2);
      padding: var(--s-12) var(--s-6);
      animation: fade-up var(--dur-3) var(--ease);
    }
    .empty.compact { padding: var(--s-8) var(--s-4); }
    .empty-mark {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      margin-bottom: var(--s-2);
      border-radius: 12px;
      background: var(--surface-sunken);
      color: var(--ink-3);
      box-shadow: inset 0 0 0 1px var(--line);
    }
    .compact .empty-mark { width: 40px; height: 40px; }
    h3 { font-size: var(--text-md); }
    p { max-width: 42ch; color: var(--ink-3); font-size: var(--text-sm); }
    .empty-actions:empty { display: none; }
    .empty-actions { margin-top: var(--s-3); display: flex; gap: var(--s-2); flex-wrap: wrap; justify-content: center; }
  `,
})
export class EmptyState {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly compact = input(false);
}

/** Estado de error con reintento. */
@Component({
  selector: 'app-error-state',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="err" role="alert">
      <app-icon name="alert-circle" [size]="20" />
      <div class="grow">
        <strong>{{ title() }}</strong>
        <p>{{ message() }}</p>
      </div>
      <ng-content />
    </div>
  `,
  styles: `
    .err {
      display: flex; align-items: flex-start; gap: var(--s-3);
      margin: var(--s-4); padding: var(--s-4);
      border-radius: var(--r-md);
      background: var(--danger-soft); color: var(--danger);
      animation: fade-up var(--dur-2) var(--ease);
    }
    strong { display: block; font-size: var(--text-base); }
    p { font-size: var(--text-sm); color: var(--ink-2); margin-top: 2px; }
    .grow { flex: 1; }
  `,
})
export class ErrorState {
  readonly title = input('No se pudo cargar la información');
  readonly message = input.required<string>();
}

/** Esqueleto de tabla mientras cargan los datos. */
@Component({
  selector: 'app-skeleton-rows',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sk" aria-busy="true" aria-label="Cargando">
      @for (row of rowsArr(); track $index) {
        <div class="sk-row">
          @for (col of colsArr(); track $index; let first = $first) {
            <span class="skeleton" [style.width]="first ? '38%' : widths[$index % widths.length]"></span>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .sk-row {
      display: flex; align-items: center; justify-content: space-between; gap: var(--s-6);
      padding: 16px var(--s-4); border-bottom: 1px solid var(--line);
    }
    .sk-row:last-child { border-bottom: 0; }
    .skeleton { height: 12px; }
    .sk-row:nth-child(2n) .skeleton:first-child { width: 28% !important; }
  `,
})
export class SkeletonRows {
  readonly rows = input(5);
  readonly cols = input(4);
  protected readonly widths = ['12%', '9%', '14%', '8%'];
  protected readonly rowsArr = computed(() => Array.from({ length: this.rows() }));
  protected readonly colsArr = computed(() => Array.from({ length: this.cols() }));
}
