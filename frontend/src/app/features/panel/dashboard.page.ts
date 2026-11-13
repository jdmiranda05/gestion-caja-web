import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClaimApi, ProductApi, SaleApi } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { toApiError } from '../../core/http-error';
import { DailySales, Product, Sale, SaleSummary, StaffClaim } from '../../core/models';
import { BarList, ChartPoint, ColumnChart } from '../../shared/charts';
import { Icon } from '../../shared/icon';
import { FechaPipe, SolesPipe } from '../../shared/pipes';
import { StatCard } from '../../shared/stat-card';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StockIndicator } from '../../shared/status-badge';

const soles = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const compact = new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' });
const longDay = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, Icon, StatCard, ColumnChart, BarList, EmptyState, ErrorState, SkeletonRows, StockIndicator, SolesPipe, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">{{ today }}</span>
          <h1>Buen día, {{ auth.username() }}</h1>
          <p>Así va la bodega. Las cifras se calculan con las ventas registradas en caja.</p>
        </div>
        <div class="actions">
          <button class="btn" (click)="load()" [disabled]="loading()"><app-icon name="refresh" />Actualizar</button>
          <a class="btn btn-primary" routerLink="/panel/caja"><app-icon name="cash" />Registrar venta</a>
        </div>
      </header>

      @if (error()) {
        <div class="card"><app-error-state [message]="error()!">
          <button class="btn btn-sm" (click)="load()">Reintentar</button>
        </app-error-state></div>
      } @else {
        <section class="grid-stats" aria-label="Indicadores">
          <app-stat label="Ingresos de hoy" icon="cash" [loading]="loading()" [value]="todayRevenue()"
                    [hint]="todayTickets() + ' tickets en caja'" />
          <app-stat [label]="'Últimos ' + range() + ' días'" icon="trend-up" [loading]="loading()" [value]="rangeRevenue()"
                    [hint]="'Promedio ' + avgRevenue() + ' por día'" />
          <app-stat label="Stock bajo" icon="box" [loading]="loading()" [value]="lowStock().length"
                    [hint]="lowStock().length ? 'Productos con 10 unidades o menos' : 'Inventario en buen nivel'"
                    [tone]="lowStock().length ? 'warn' : 'default'" />
          <app-stat label="Reclamos pendientes" icon="message" [loading]="loading()" [value]="pendingClaims()"
                    [hint]="pendingClaims() ? 'Esperan revisión del personal' : 'Sin reclamos por atender'"
                    [tone]="pendingClaims() ? 'warn' : 'default'" />
        </section>

        <section class="grid-wide">
          <article class="card">
            <header class="card-header">
              <div><h2>Ingresos por día</h2><p>Ventas en caja · soles</p></div>
              <div class="segmented" role="group" aria-label="Rango de días">
                @for (option of ranges; track option) {
                  <button [attr.aria-pressed]="range() === option" (click)="setRange(option)">{{ option }} d</button>
                }
              </div>
            </header>
            <div class="card-body chart-body">
              @if (loading()) {
                <span class="skeleton" style="height: 240px"></span>
              } @else if (rangeTotal() === 0) {
                <app-empty-state icon="chart" title="Sin ventas en este periodo" [compact]="true"
                  description="Registra una venta en caja y el gráfico se actualizará.">
                  <a class="btn btn-sm" routerLink="/panel/caja">Ir a caja</a>
                </app-empty-state>
              } @else {
                <app-column-chart [data]="chartData()" [format]="money" [tickFormat]="tick"
                  [ariaLabel]="'Ingresos diarios de los últimos ' + range() + ' días'" />
              }
            </div>
          </article>

          <article class="card">
            <header class="card-header"><div><h2>Más vendidos</h2><p>Ingresos acumulados</p></div></header>
            <div class="card-body">
              @if (loading()) {
                <div class="stack">@for (i of [1,2,3,4,5]; track i) { <span class="skeleton" style="height: 28px"></span> }</div>
              } @else if (topProducts().length === 0) {
                <app-empty-state icon="tag" title="Aún sin ventas" [compact]="true" />
              } @else {
                <app-bar-list [items]="topProducts()" [format]="money" ariaLabel="Productos más vendidos por ingresos" />
              }
            </div>
          </article>
        </section>

        <section class="grid-2">
          <article class="card">
            <header class="card-header">
              <div><h2>Últimas ventas</h2><p>Registradas en caja</p></div>
              <a class="btn btn-ghost btn-sm" routerLink="/panel/caja">Ver todo<app-icon name="arrow-right" /></a>
            </header>
            @if (loading()) { <app-skeleton-rows [rows]="5" [cols]="3" /> }
            @else if (recent().length === 0) { <app-empty-state icon="receipt" title="Sin ventas registradas" [compact]="true" /> }
            @else {
              <div class="table-wrap">
                <table class="table">
                  <tbody>
                    @for (sale of recent(); track sale.id) {
                      <tr>
                        <td><span class="cell-title">{{ sale.productName }}</span><span class="cell-sub">{{ sale.soldAt | fecha:'relative' }} · {{ sale.quantity }} u.</span></td>
                        <td class="num"><strong>{{ sale.total | soles }}</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </article>

          <article class="card">
            <header class="card-header">
              <div><h2>Por reponer</h2><p>Stock de 10 unidades o menos</p></div>
              <a class="btn btn-ghost btn-sm" routerLink="/panel/productos" [queryParams]="{ filtro: 'bajo' }">Inventario<app-icon name="arrow-right" /></a>
            </header>
            @if (loading()) { <app-skeleton-rows [rows]="5" [cols]="2" /> }
            @else if (lowStock().length === 0) {
              <app-empty-state icon="check-circle" title="Todo en orden" description="Ningún producto está por agotarse." [compact]="true" />
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <tbody>
                    @for (product of lowStock().slice(0, 6); track product.id) {
                      <tr>
                        <td><span class="cell-title">{{ product.name }}</span><span class="cell-sub">{{ product.category }}</span></td>
                        <td class="num"><app-stock [value]="product.stock" /></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </article>
        </section>
      }
    </div>
  `,
  styles: `
    .grid-stats { margin-bottom: var(--s-4); }
    .grid-wide { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: var(--s-4); margin-bottom: var(--s-4); }
    .chart-body { min-height: 288px; }
    @media (max-width: 1080px) { .grid-wide { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .card-header { flex-wrap: wrap; } }
  `,
})
export class DashboardPage {
  private readonly sales = inject(SaleApi);
  private readonly products = inject(ProductApi);
  private readonly claims = inject(ClaimApi);
  protected readonly auth = inject(AuthService);

  protected readonly ranges = [7, 14, 30];
  protected readonly range = signal(14);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly daily = signal<DailySales[]>([]);
  private readonly summary = signal<SaleSummary[]>([]);
  protected readonly recent = signal<Sale[]>([]);
  protected readonly lowStock = signal<Product[]>([]);
  private readonly staffClaims = signal<StaffClaim[]>([]);

  protected readonly today = longDay.format(new Date());
  protected readonly money = (value: number) => soles.format(value);
  protected readonly tick = (value: number) => (value >= 1000 ? compact.format(value) : String(Math.round(value)));

  protected readonly todayRevenue = computed(() => soles.format(this.daily().at(-1)?.revenue ?? 0));
  protected readonly todayTickets = computed(() => this.daily().at(-1)?.tickets ?? 0);
  protected readonly rangeTotal = computed(() => this.daily().reduce((sum, day) => sum + Number(day.revenue), 0));
  protected readonly rangeRevenue = computed(() => soles.format(this.rangeTotal()));
  protected readonly avgRevenue = computed(() => soles.format(this.rangeTotal() / Math.max(1, this.daily().length)));
  protected readonly pendingClaims = computed(() => this.staffClaims().filter((c) => c.status === 'PENDING').length);

  protected readonly chartData = computed<ChartPoint[]>(() =>
    this.daily().map((day) => {
      const date = new Date(`${day.date}T12:00:00`);
      return {
        label: dayFmt.format(date).replace('.', ''),
        detail: longDay.format(date),
        value: Number(day.revenue),
        secondary: `${day.tickets} tickets · ${day.units} unidades`,
      };
    }),
  );

  protected readonly topProducts = computed(() =>
    this.summary()
      .slice(0, 5)
      .map((row) => ({ label: row.productName, value: Number(row.revenue), caption: `${row.units} unidades` })),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      daily: this.sales.daily(this.range()),
      summary: this.sales.summary(),
      recent: this.sales.recent(),
      low: this.products.lowStock(10),
      claims: this.claims.staff(),
    }).subscribe({
      next: ({ daily, summary, recent, low, claims }) => {
        this.daily.set(daily);
        this.summary.set(summary);
        this.recent.set(recent.slice(0, 6));
        this.lowStock.set([...low].sort((a, b) => a.stock - b.stock));
        this.staffClaims.set(claims);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected setRange(days: number): void {
    this.range.set(days);
    this.sales.daily(days).subscribe({
      next: (daily) => this.daily.set(daily),
      error: (err) => this.error.set(toApiError(err).message),
    });
  }
}
