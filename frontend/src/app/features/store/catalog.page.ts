import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductApi } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { CartService, MAX_PER_ITEM } from '../../core/cart.service';
import { toApiError } from '../../core/http-error';
import { Product } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Pager, pageOf } from '../../shared/pager';
import { SolesPipe } from '../../shared/pipes';
import { EmptyState, ErrorState } from '../../shared/states';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, Icon, EmptyState, ErrorState, Pager, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Catálogo</span>
          <h1>Lo de siempre, a la vuelta de la esquina</h1>
          <p>Elige tus productos, confirma el pedido y recógelo en la bodega.</p>
        </div>
      </header>

      <div class="filters">
        <div class="input-group search">
          <app-icon name="search" />
          <input class="input" type="search" placeholder="Buscar productos…" aria-label="Buscar productos"
                 [value]="query()" (input)="onSearch($any($event.target).value)" />
        </div>
        <div class="chips" role="group" aria-label="Categorías">
          <button class="chip" [attr.aria-pressed]="category() === null" (click)="setCategory(null)">
            Todo<span class="count">{{ products().length }}</span>
          </button>
          @for (cat of categories(); track cat.name) {
            <button class="chip" [attr.aria-pressed]="category() === cat.name" (click)="setCategory(cat.name)">
              {{ cat.name }}<span class="count">{{ cat.count }}</span>
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="card">
          <app-error-state [message]="error()!">
            <button class="btn btn-sm" (click)="load()"><app-icon name="refresh" />Reintentar</button>
          </app-error-state>
        </div>
      } @else if (loading()) {
        <div class="grid" aria-busy="true">
          @for (i of skeletons; track i) {
            <div class="product card sk">
              <span class="skeleton" style="width: 40%; height: 10px"></span>
              <span class="skeleton" style="width: 75%; height: 16px; margin-top: 14px"></span>
              <span class="skeleton" style="width: 30%; height: 22px; margin-top: 28px"></span>
              <span class="skeleton" style="width: 100%; height: 36px; margin-top: 16px"></span>
            </div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <div class="card">
          @if (products().length === 0) {
            <app-empty-state icon="box" title="Todavía no hay productos"
              description="Cuando la bodega publique productos aparecerán aquí." />
          } @else {
            <app-empty-state icon="search" title="Sin resultados"
              [description]="'No encontramos productos para “' + query() + '”' + (category() ? ' en ' + category() : '') + '.'">
              <button class="btn" (click)="reset()">Limpiar filtros</button>
            </app-empty-state>
          }
        </div>
      } @else {
        <p class="result-count" aria-live="polite">{{ filtered().length }} {{ filtered().length === 1 ? 'producto' : 'productos' }}</p>
        <div class="grid">
          @for (product of visible(); track product.id) {
            <article class="product card">
              <div class="p-top">
                <span class="cat">{{ product.category }}</span>
                @if (product.stock === 0) {
                  <span class="badge badge-danger">Agotado</span>
                } @else if (product.stock <= 5) {
                  <span class="badge badge-warn">Quedan {{ product.stock }}</span>
                }
              </div>
              <h2>{{ product.name }}</h2>
              <div class="p-bottom">
                <span class="price num">{{ product.price | soles }}</span>
                @if (auth.isStaff()) {
                  <a class="btn btn-sm" [routerLink]="['/panel/productos', product.id, 'editar']"><app-icon name="edit" />Editar</a>
                } @else if (cart.quantityOf(product.id) > 0) {
                  <div class="stepper" role="group" [attr.aria-label]="'Cantidad de ' + product.name">
                    <button class="btn btn-sm btn-icon" (click)="cart.setQuantity(product.id, cart.quantityOf(product.id) - 1)" aria-label="Quitar uno">
                      <app-icon name="minus" />
                    </button>
                    <span class="num">{{ cart.quantityOf(product.id) }}</span>
                    <button class="btn btn-sm btn-icon" [disabled]="cart.quantityOf(product.id) >= limit(product)"
                            (click)="cart.add(product)" aria-label="Agregar uno">
                      <app-icon name="plus" />
                    </button>
                  </div>
                } @else {
                  <button class="btn btn-sm add" [disabled]="product.stock === 0" (click)="add(product)">
                    <app-icon name="plus" />Agregar
                  </button>
                }
              </div>
            </article>
          }
        </div>
        <app-pager class="pager-wrap" [total]="filtered().length" [page]="page()" [size]="pageSize" (pageChange)="page.set($event)" />
      }

      @if (!auth.isStaff() && cart.count() > 0) {
        <a class="cart-bar" routerLink="/carrito">
          <span><strong class="num">{{ cart.count() }}</strong> en el carrito</span>
          <span class="num">{{ cart.total() | soles }}<app-icon name="arrow-right" /></span>
        </a>
      }
    </div>
  `,
  styles: `
    .filters { display: grid; gap: var(--s-3); margin-bottom: var(--s-6); }
    .search { max-width: 420px; }
    .result-count { margin-bottom: var(--s-3); font-size: var(--text-sm); color: var(--ink-3); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--s-4); }
    .product { display: flex; flex-direction: column; padding: var(--s-4) var(--s-4) var(--s-4) var(--s-5); min-height: 172px;
      transition: border-color var(--dur-2) var(--ease), transform var(--dur-2) var(--ease), box-shadow var(--dur-2) var(--ease);
      animation: fade-up var(--dur-3) var(--ease) both; }
    .product:not(.sk):hover { border-color: var(--line-strong); box-shadow: var(--shadow-2); transform: translateY(-1px); }
    .p-top { display: flex; justify-content: space-between; align-items: center; gap: var(--s-2); min-height: 22px; }
    .cat { font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-3); }
    h2 { margin-top: var(--s-2); font-size: var(--text-md); font-weight: 600; letter-spacing: -0.01em; }
    .p-bottom { display: flex; align-items: center; justify-content: space-between; gap: var(--s-2); margin-top: auto; padding-top: var(--s-5); }
    .price { font-size: var(--text-lg); font-weight: 600; letter-spacing: -0.02em; }
    .add { border-color: var(--line-strong); }
    .add:hover:not(:disabled) { border-color: var(--brand); color: var(--brand-ink); background: var(--brand-softer); }
    .stepper { display: inline-flex; align-items: center; gap: 4px; padding: 2px; border-radius: var(--r-sm); background: var(--brand-softer); animation: pop-in var(--dur-2) var(--ease); }
    .stepper .btn { border-color: transparent; background: var(--surface); }
    .stepper span { min-width: 24px; text-align: center; font-weight: 600; color: var(--brand-ink); }
    .pager-wrap { margin-top: var(--s-4); }
    .pager-wrap ::ng-deep .pager { border-top: 0; padding: 0; }
    .cart-bar { position: fixed; z-index: 15; left: 50%; bottom: var(--s-5); transform: translateX(-50%);
      display: none; align-items: center; justify-content: space-between; gap: var(--s-6);
      width: min(420px, calc(100vw - 32px)); padding: var(--s-3) var(--s-4); border-radius: var(--r-md);
      background: var(--ink); color: var(--bg); text-decoration: none; box-shadow: var(--shadow-3); animation: pop-in var(--dur-3) var(--ease); }
    .cart-bar span { display: inline-flex; align-items: center; gap: var(--s-2); }
    @media (max-width: 900px) { .cart-bar { display: flex; } }
    @media (max-width: 480px) { .grid { grid-template-columns: 1fr 1fr; gap: var(--s-2); } .product { padding: var(--s-3); min-height: 150px; }
      .p-bottom { flex-direction: column; align-items: stretch; } .p-bottom .btn, .stepper { justify-content: center; } .stepper { justify-content: space-between; } }
  `,
})
export class CatalogPage {
  private readonly api = inject(ProductApi);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly category = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  protected readonly categories = computed(() => {
    const counts = new Map<string, number>();
    for (const product of this.products()) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count }));
  });

  protected readonly filtered = computed(() => {
    const q = this.normalize(this.query());
    const cat = this.category();
    return this.products().filter(
      (product) => (!cat || product.category === cat) && (!q || this.normalize(product.name).includes(q)),
    );
  });

  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), PAGE_SIZE));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected onSearch(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  protected setCategory(value: string | null): void {
    this.category.set(value);
    this.page.set(1);
  }

  protected reset(): void {
    this.query.set('');
    this.category.set(null);
    this.page.set(1);
  }

  protected limit(product: Product): number {
    return Math.min(product.stock, MAX_PER_ITEM);
  }

  protected add(product: Product): void {
    this.cart.add(product);
    this.toast.ok('Agregado al carrito', product.name);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
