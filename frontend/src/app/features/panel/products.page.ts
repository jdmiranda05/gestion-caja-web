import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductApi } from '../../core/api';
import { ConfirmService } from '../../core/confirm.service';
import { toApiError } from '../../core/http-error';
import { Product } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { integer } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/overlays';
import { Pager, pageOf } from '../../shared/pager';
import { SolesPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StockIndicator } from '../../shared/status-badge';

const PAGE_SIZE = 10;
type Tab = 'activos' | 'retirados';

@Component({
  selector: 'app-products-page',
  imports: [ReactiveFormsModule, RouterLink, Icon, Modal, FieldError, Pager, SolesPipe, EmptyState, ErrorState, SkeletonRows, StockIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Inventario</span>
          <h1>Productos</h1>
          <p>Crea, edita, repone stock o retira productos del catálogo.</p>
        </div>
        <div class="actions">
          <a class="btn btn-primary" routerLink="/panel/productos/nuevo"><app-icon name="plus" />Nuevo producto</a>
        </div>
      </header>

      <section class="card">
        <div class="tabs" role="tablist">
          <button role="tab" [attr.aria-selected]="tab() === 'activos'" (click)="setTab('activos')">
            Activos <span class="count num">{{ active().length }}</span>
          </button>
          <button role="tab" [attr.aria-selected]="tab() === 'retirados'" (click)="setTab('retirados')">
            Retirados <span class="count num">{{ inactive().length }}</span>
          </button>
        </div>

        <div class="toolbar">
          <div class="input-group">
            <app-icon name="search" />
            <input class="input" type="search" placeholder="Buscar por nombre…" aria-label="Buscar productos"
                   [value]="query()" (input)="query.set($any($event.target).value); page.set(1)" />
          </div>
          <select class="select cat" aria-label="Filtrar por categoría" [value]="category()"
                  (change)="category.set($any($event.target).value); page.set(1)">
            <option value="">Todas las categorías</option>
            @for (cat of categories(); track cat) { <option [value]="cat">{{ cat }}</option> }
          </select>
          @if (tab() === 'activos') {
            <button class="chip" [attr.aria-pressed]="lowOnly()" (click)="lowOnly.set(!lowOnly()); page.set(1)">
              <app-icon name="alert" [size]="13" /> Stock bajo
            </button>
          }
        </div>

        @if (loading()) {
          <app-skeleton-rows [rows]="6" [cols]="4" />
        } @else if (error()) {
          <app-error-state [message]="error()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
        } @else if (filtered().length === 0) {
          @if (source().length === 0) {
            @if (tab() === 'activos') {
              <app-empty-state icon="box" title="No hay productos activos" description="Crea el primer producto para empezar a vender.">
                <a class="btn btn-primary" routerLink="/panel/productos/nuevo">Nuevo producto</a>
              </app-empty-state>
            } @else {
              <app-empty-state icon="restore" title="No hay productos retirados" description="Los productos que retires aparecerán aquí y podrás restaurarlos." />
            }
          } @else {
            <app-empty-state icon="search" title="Sin coincidencias" description="Ajusta la búsqueda o los filtros.">
              <button class="btn btn-sm" (click)="clearFilters()">Limpiar filtros</button>
            </app-empty-state>
          }
        } @else {
          <div class="table-wrap">
            <table class="table table-cards">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th class="num">Precio</th>
                  <th class="num">Stock</th>
                  <th class="actions"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                @for (product of visible(); track product.id) {
                  <tr [class.flash]="product.id === flashId()">
                    <td data-label="Producto"><span class="cell-title">{{ product.name }}</span><span class="cell-sub mono">ID {{ product.id }}</span></td>
                    <td data-label="Categoría"><span class="badge plain">{{ product.category }}</span></td>
                    <td data-label="Precio" class="num">{{ product.price | soles }}</td>
                    <td data-label="Stock" class="num"><app-stock [value]="product.stock" /></td>
                    <td class="actions">
                      @if (tab() === 'activos') {
                        <button class="btn btn-sm" (click)="openRestock(product)"><app-icon name="plus" />Reponer</button>
                        <a class="btn btn-ghost btn-sm btn-icon" [routerLink]="['/panel/productos', product.id, 'editar']"
                           [attr.aria-label]="'Editar ' + product.name" title="Editar"><app-icon name="edit" /></a>
                        <button class="btn btn-ghost btn-sm btn-icon danger" (click)="retire(product)"
                                [attr.aria-label]="'Retirar ' + product.name" title="Retirar"><app-icon name="trash" /></button>
                      } @else {
                        <button class="btn btn-sm" [disabled]="busyId() === product.id" (click)="restore(product)">
                          <app-icon name="restore" />Restaurar
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [total]="filtered().length" [page]="page()" [size]="pageSize" (pageChange)="page.set($event)" />
        }
      </section>
    </div>

    <app-modal [open]="restockTarget() !== null" (closed)="restockTarget.set(null)"
               title="Reponer stock" [subtitle]="restockTarget()?.name + ' · stock actual ' + restockTarget()?.stock">
      <form class="stack" [formGroup]="restockForm" (ngSubmit)="saveRestock()" novalidate>
        <div class="field">
          <label for="units">Unidades a agregar</label>
          <input id="units" class="input" type="number" min="1" max="10000" step="1" formControlName="units" />
          <app-field-error [control]="units" label="Las unidades" />
        </div>
        <div class="quick row wrap">
          @for (n of [6, 12, 24, 48]; track n) {
            <button type="button" class="chip" (click)="units.setValue(n)">+{{ n }}</button>
          }
        </div>
        <div class="form-actions">
          <button type="button" class="btn" (click)="restockTarget.set(null)">Cancelar</button>
          <button type="submit" class="btn btn-primary" [disabled]="savingRestock()">
            @if (savingRestock()) { <span class="spinner"></span> } Reponer
          </button>
        </div>
      </form>
    </app-modal>
  `,
  styles: `
    .tabs { display: flex; gap: var(--s-1); padding: 0 var(--s-4); border-bottom: 1px solid var(--line); }
    .tabs button { position: relative; height: 46px; padding: 0 var(--s-3); border: 0; background: none; color: var(--ink-3); font-weight: 500; }
    .tabs button:hover { color: var(--ink); }
    .tabs button[aria-selected="true"] { color: var(--ink); }
    .tabs button[aria-selected="true"]::after { content: ''; position: absolute; left: var(--s-3); right: var(--s-3); bottom: -1px; height: 2px; background: var(--brand); border-radius: 2px; }
    .count { margin-left: 4px; padding: 1px 7px; border-radius: 10px; background: var(--surface-sunken); font-size: 11px; }
    .cat { width: auto; min-width: 190px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; }
    .danger:hover { color: var(--danger); background: var(--danger-soft); }
    tr.flash td { animation: flash 1.6s var(--ease); }
    @keyframes flash { 0%, 40% { background: var(--brand-softer); } 100% { background: transparent; } }
    @media (max-width: 640px) { .cat { flex: 1; min-width: 0; } }
  `,
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ProductApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly filtro = input<string>();

  protected readonly tab = signal<Tab>('activos');
  protected readonly active = signal<Product[]>([]);
  protected readonly inactive = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly lowOnly = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly busyId = signal<number | null>(null);
  protected readonly flashId = signal<number | null>(null);

  protected readonly restockTarget = signal<Product | null>(null);
  protected readonly savingRestock = signal(false);
  protected readonly units = new FormControl<number | null>(12, [Validators.required, Validators.min(1), Validators.max(10000), integer]);
  /** El FormGroup es necesario para que (ngSubmit) se dispare con ReactiveFormsModule. */
  protected readonly restockForm = new FormGroup({ units: this.units });

  protected readonly source = computed(() => (this.tab() === 'activos' ? this.active() : this.inactive()));
  protected readonly categories = computed(() =>
    [...new Set([...this.active(), ...this.inactive()].map((p) => p.category))].sort((a, b) => a.localeCompare(b)),
  );
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.source().filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!this.category() || p.category === this.category()) &&
        (this.tab() === 'retirados' || !this.lowOnly() || p.stock <= 10),
    );
  });
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  ngOnInit(): void {
    if (this.filtro() === 'bajo') this.lowOnly.set(true);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ active: this.api.list(), inactive: this.api.inactive() }).subscribe({
      next: ({ active, inactive }) => {
        this.active.set(active);
        this.inactive.set(inactive);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected setTab(tab: Tab): void {
    this.tab.set(tab);
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.category.set('');
    this.lowOnly.set(false);
  }

  protected openRestock(product: Product): void {
    this.units.reset(12);
    this.restockTarget.set(product);
  }

  protected saveRestock(): void {
    const product = this.restockTarget();
    this.units.markAsTouched();
    if (!product || this.units.invalid) return;
    this.savingRestock.set(true);
    this.api.restock(product.id, Number(this.units.value)).subscribe({
      next: (updated) => {
        this.savingRestock.set(false);
        this.active.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.restockTarget.set(null);
        this.flash(updated.id);
        this.toast.ok('Stock actualizado', `${updated.name}: ${updated.stock} unidades`);
      },
      error: (err) => {
        this.savingRestock.set(false);
        const apiError = toApiError(err);
        this.units.setErrors({ server: apiError.fieldErrors?.['units'] ?? apiError.message });
      },
    });
  }

  protected async retire(product: Product): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Retirar “${product.name}”?`,
      message: 'Dejará de mostrarse en el catálogo y en caja. Podrás restaurarlo desde la pestaña Retirados.',
      confirmLabel: 'Retirar producto',
      tone: 'danger',
    });
    if (!ok) return;
    this.api.remove(product.id).subscribe({
      next: () => {
        this.active.update((list) => list.filter((p) => p.id !== product.id));
        this.inactive.update((list) => [{ ...product, active: false }, ...list]);
        this.toast.ok('Producto retirado', product.name);
      },
      error: (err) => this.toast.error('No se pudo retirar', toApiError(err).message),
    });
  }

  protected restore(product: Product): void {
    this.busyId.set(product.id);
    this.api.restore(product.id).subscribe({
      next: (restored) => {
        this.busyId.set(null);
        this.inactive.update((list) => list.filter((p) => p.id !== product.id));
        this.active.update((list) => [...list, restored].sort((a, b) => a.name.localeCompare(b.name)));
        this.toast.ok('Producto restaurado', restored.name);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error('No se pudo restaurar', toApiError(err).message);
      },
    });
  }

  private flash(id: number): void {
    this.flashId.set(id);
    setTimeout(() => this.flashId.set(null), 1600);
  }
}
