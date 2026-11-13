import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseApi } from '../../core/api';
import { toApiError } from '../../core/http-error';
import { Purchase } from '../../core/models';
import { Icon } from '../../shared/icon';
import { Pager, pageOf } from '../../shared/pager';
import { FechaPipe, SolesPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, Icon, EmptyState, ErrorState, SkeletonRows, Pager, SolesPipe, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Mi cuenta</span>
          <h1>Mis pedidos</h1>
          <p>Historial de compras confirmadas. Si algo salió mal, puedes registrar un reclamo.</p>
        </div>
        <div class="actions">
          <a class="btn" routerLink="/reclamos"><app-icon name="message" />Mis reclamos</a>
        </div>
      </header>

      @if (loading()) {
        <div class="card"><app-skeleton-rows [rows]="4" [cols]="3" /></div>
      } @else if (error()) {
        <div class="card"><app-error-state [message]="error()!">
          <button class="btn btn-sm" (click)="load()"><app-icon name="refresh" />Reintentar</button>
        </app-error-state></div>
      } @else if (orders().length === 0) {
        <div class="card">
          <app-empty-state icon="receipt" title="Aún no tienes pedidos"
            description="Cuando confirmes tu primera compra, verás aquí el detalle y el total.">
            <a class="btn btn-primary" routerLink="/">Explorar catálogo</a>
          </app-empty-state>
        </div>
      } @else {
        <div class="stack">
          @for (order of visible(); track order.id) {
            <article class="card order" [class.new]="order.id === highlight()">
              <header class="card-header">
                <div>
                  <h2>Pedido <span class="mono">#{{ order.id }}</span>
                    @if (order.id === highlight()) { <span class="badge badge-ok">Nuevo</span> }
                  </h2>
                  <p>{{ order.createdAt | fecha }}</p>
                </div>
                <div class="total">
                  <span>Total</span>
                  <strong class="num">{{ order.total | soles }}</strong>
                </div>
              </header>
              <div class="table-wrap">
                <table class="table table-cards">
                  <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th><th class="actions"></th></tr></thead>
                  <tbody>
                    @for (item of order.items; track item.id) {
                      <tr>
                        <td data-label="Producto" class="cell-title">{{ item.productName }}</td>
                        <td data-label="Cantidad" class="num">{{ item.quantity }}</td>
                        <td data-label="Precio" class="num">{{ item.unitPrice | soles }}</td>
                        <td data-label="Subtotal" class="num">{{ item.lineTotal | soles }}</td>
                        <td class="actions">
                          <a class="btn btn-ghost btn-sm" routerLink="/reclamos"
                             [queryParams]="{ pedido: order.id, item: item.id }">Reclamar</a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          }
          <app-pager [total]="orders().length" [page]="page()" [size]="pageSize" (pageChange)="page.set($event)" />
        </div>
      }
    </div>
  `,
  styles: `
    .order h2 { display: flex; align-items: center; gap: var(--s-2); }
    .order.new { border-color: color-mix(in srgb, var(--brand) 45%, var(--line)); box-shadow: 0 0 0 3px var(--brand-softer); }
    .total { display: grid; justify-items: end; }
    .total span { font-size: var(--text-xs); color: var(--ink-3); }
    .total strong { font-size: var(--text-lg); }
  `,
})
export class OrdersPage {
  private readonly api = inject(PurchaseApi);
  readonly nuevo = input<string>();
  protected readonly orders = signal<Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly highlight = computed(() => (this.nuevo() ? Number(this.nuevo()) : null));
  protected readonly visible = computed(() => pageOf(this.orders(), this.page(), PAGE_SIZE));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.mine().subscribe({
      next: (orders) => {
        this.orders.set([...orders].sort((a, b) => b.id - a.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }
}
