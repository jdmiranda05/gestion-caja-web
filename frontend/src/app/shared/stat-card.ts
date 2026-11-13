import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

/** Tarjeta de indicador: etiqueta, cifra principal y contexto. */
@Component({
  selector: 'app-stat',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat card" [class.attention]="tone() === 'warn'">
      <div class="top">
        <span class="label">{{ label() }}</span>
        <span class="ic"><app-icon [name]="icon()" [size]="16" /></span>
      </div>
      @if (loading()) {
        <span class="skeleton value-sk"></span>
        <span class="skeleton hint-sk"></span>
      } @else {
        <strong class="value num">{{ value() }}</strong>
        <span class="hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: `
    .stat { display: grid; gap: var(--s-1); padding: var(--s-4) var(--s-5); min-height: 116px; }
    .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--s-2); }
    .label { font-size: var(--text-sm); color: var(--ink-3); font-weight: 500; }
    .ic { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: var(--surface-sunken); color: var(--ink-2); }
    .attention .ic { background: var(--warn-soft); color: var(--warn); }
    .value { font-size: 1.625rem; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
    .hint { font-size: var(--text-xs); color: var(--ink-3); }
    .value-sk { height: 26px; width: 60%; }
    .hint-sk { height: 10px; width: 40%; margin-top: 6px; }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input<string | number>('');
  readonly hint = input('');
  readonly icon = input('chart');
  readonly tone = input<'default' | 'warn'>('default');
  readonly loading = input(false);
}
