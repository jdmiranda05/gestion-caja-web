import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

/** Paginación de listas en cliente: "1–10 de 42" y anterior/siguiente. */
@Component({
  selector: 'app-pager',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > size()) {
      <nav class="pager" aria-label="Paginación">
        <span class="num">{{ from() }}–{{ to() }} de {{ total() }}</span>
        <div class="pager-controls">
          <button class="btn btn-sm btn-icon" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)" aria-label="Página anterior">
            <app-icon name="chevron-left" />
          </button>
          <span class="current num">{{ page() }} / {{ pages() }}</span>
          <button class="btn btn-sm btn-icon" [disabled]="page() >= pages()" (click)="pageChange.emit(page() + 1)" aria-label="Página siguiente">
            <app-icon name="chevron-right" />
          </button>
        </div>
      </nav>
    }
  `,
  styles: `
    :host { display: block; }
    .pager { padding: var(--s-3) var(--s-4); border-top: 1px solid var(--line); }
    .current { display: inline-flex; align-items: center; padding: 0 var(--s-2); color: var(--ink-2); }
  `,
})
export class Pager {
  readonly total = input.required<number>();
  readonly page = input.required<number>();
  readonly size = input(10);
  readonly pageChange = output<number>();
  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  protected readonly from = computed(() => (this.page() - 1) * this.size() + 1);
  protected readonly to = computed(() => Math.min(this.total(), this.page() * this.size()));
}

export function pageOf<T>(items: T[], page: number, size: number): T[] {
  return items.slice((page - 1) * size, page * size);
}
