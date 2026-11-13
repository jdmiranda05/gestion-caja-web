import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProductApi, SaleApi } from '../../core/api';
import { toApiError } from '../../core/http-error';
import { Product, Receipt, Sale } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, integer, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/overlays';
import { Pager, pageOf } from '../../shared/pager';
import { FechaPipe, SolesPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';

@Component({
  selector: 'app-cash-page',
  imports: [ReactiveFormsModule, Icon, Modal, FieldError, Pager, EmptyState, ErrorState, SkeletonRows, SolesPipe, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Caja</span>
          <h1>Registrar venta</h1>
          <p>Cada venta descuenta stock y genera una boleta con correlativo.</p>
        </div>
      </header>

      <div class="layout">
        <form class="card register" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <header class="card-header"><div><h2>Nueva venta</h2><p>Producto, cantidad y cliente opcional.</p></div></header>
          <div class="card-body stack">
            <div class="field">
              <label for="productId">Producto</label>
              <select id="productId" class="select" formControlName="productId">
                <option [ngValue]="null" disabled>{{ loading() ? 'Cargando productos…' : 'Selecciona un producto' }}</option>
                @for (product of products(); track product.id) {
                  <option [ngValue]="product.id" [disabled]="product.stock === 0">
                    {{ product.name }} · {{ product.price | soles }} · {{ product.stock === 0 ? 'agotado' : product.stock + ' u.' }}
                  </option>
                }
              </select>
              <app-field-error [control]="form.controls.productId" label="El producto" />
            </div>

            <div class="field">
              <label for="quantity">Cantidad</label>
              <div class="qty">
                <button type="button" class="btn btn-icon" (click)="step(-1)" aria-label="Restar uno"><app-icon name="minus" /></button>
                <input id="quantity" class="input num" type="number" min="1" step="1" formControlName="quantity" />
                <button type="button" class="btn btn-icon" (click)="step(1)" aria-label="Sumar uno"><app-icon name="plus" /></button>
              </div>
              @if (selected(); as product) { <span class="hint">Disponible: {{ product.stock }} unidades</span> }
              <app-field-error [control]="form.controls.quantity" label="La cantidad" />
            </div>

            <div class="field">
              <label for="customerName">Cliente <span class="muted">(opcional)</span></label>
              <input id="customerName" class="input" formControlName="customerName" maxlength="80" placeholder="Nombre para la boleta" />
              <app-field-error [control]="form.controls.customerName" label="El nombre" />
            </div>

            <div class="total-box" aria-live="polite">
              <div class="line"><span>Precio unitario</span><span class="num">{{ selected()?.price ?? 0 | soles }}</span></div>
              <div class="line big"><span>Total</span><strong class="num">{{ total() | soles }}</strong></div>
            </div>

            @if (error()) {
              <div class="alert alert-danger" role="alert"><app-icon name="alert-circle" [size]="18" />
                <div><strong>Venta no registrada</strong>{{ error() }}</div></div>
            }

            <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> Registrando… } @else { <app-icon name="check" /> Cobrar {{ total() | soles }} }
            </button>
          </div>
        </form>

        <section class="card">
          <header class="card-header">
            <div><h2>Ventas recientes</h2><p>Las 20 últimas operaciones</p></div>
            <button class="btn btn-ghost btn-sm" (click)="load()" aria-label="Actualizar"><app-icon name="refresh" /></button>
          </header>
          @if (loading()) {
            <app-skeleton-rows [rows]="6" [cols]="4" />
          } @else if (loadError()) {
            <app-error-state [message]="loadError()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
          } @else if (sales().length === 0) {
            <app-empty-state icon="receipt" title="Todavía no hay ventas" description="Las ventas que registres aparecerán aquí con su boleta." />
          } @else {
            <div class="table-wrap">
              <table class="table table-cards">
                <thead><tr><th>Boleta</th><th>Producto</th><th class="num">Cant.</th><th class="num">Total</th><th class="actions"></th></tr></thead>
                <tbody>
                  @for (sale of visibleSales(); track sale.id) {
                    <tr [class.flash]="sale.id === lastId()">
                      <td data-label="Boleta"><span class="mono">B001-{{ pad(sale.id) }}</span><span class="cell-sub">{{ sale.soldAt | fecha:'relative' }}</span></td>
                      <td data-label="Producto"><span class="cell-title">{{ sale.productName }}</span>
                        @if (sale.customerName) { <span class="cell-sub">{{ sale.customerName }}</span> }</td>
                      <td data-label="Cantidad" class="num">{{ sale.quantity }}</td>
                      <td data-label="Total" class="num"><strong>{{ sale.total | soles }}</strong></td>
                      <td class="actions">
                        <button class="btn btn-ghost btn-sm" (click)="openReceipt(sale.id)"><app-icon name="receipt" />Boleta</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pager [total]="sales().length" [page]="page()" [size]="8" (pageChange)="page.set($event)" />
          }
        </section>
      </div>
    </div>

    <app-modal [open]="receiptOpen()" (closed)="receiptOpen.set(false)" title="Boleta de venta" subtitle="Comprobante emitido por caja">
      @if (receiptLoading()) {
        <div class="stack"><span class="skeleton" style="height: 220px"></span></div>
      } @else if (receipt(); as r) {
        <div class="receipt" id="boleta">
          <div class="r-head"><strong>TIENDA ALONDRALU</strong><span>Bodega y gestión de caja</span></div>
          <div class="r-row"><span>N.º</span><span class="mono">{{ r.receiptNumber }}</span></div>
          <div class="r-row"><span>Fecha</span><span>{{ r.issueDate | fecha }}</span></div>
          <div class="r-sep"></div>
          <div class="r-row"><span>{{ r.productName }} ×{{ r.quantity }}</span><span class="num">{{ r.total | soles }}</span></div>
          <div class="r-row small"><span>P. unitario</span><span class="num">{{ r.unitPrice | soles }}</span></div>
          <div class="r-sep"></div>
          <div class="r-row total"><span>TOTAL</span><span class="num">{{ r.total | soles }}</span></div>
          <p class="r-foot">Gracias por su compra</p>
        </div>
        <div class="form-actions">
          <button class="btn" (click)="receiptOpen.set(false)">Cerrar</button>
          <button class="btn btn-primary" (click)="print()"><app-icon name="printer" />Imprimir</button>
        </div>
      }
    </app-modal>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: var(--s-6); align-items: start; }
    .register { position: sticky; top: var(--s-6); }
    @media (max-width: 1080px) { .layout { grid-template-columns: 1fr; } .register { position: static; } }
    .qty { display: grid; grid-template-columns: 38px 1fr 38px; gap: var(--s-2); }
    .qty .btn { height: 38px; width: 38px; }
    .qty .input { text-align: center; }
    .total-box { display: grid; gap: var(--s-2); padding: var(--s-4); border-radius: var(--r-md); background: var(--surface-2); border: 1px dashed var(--line-strong); }
    .line { display: flex; justify-content: space-between; color: var(--ink-3); font-size: var(--text-sm); }
    .line.big { color: var(--ink); font-size: var(--text-md); align-items: baseline; }
    .line.big strong { font-size: 1.75rem; letter-spacing: -0.02em; }
    tr.flash td { animation: flash 1.8s var(--ease); }
    @keyframes flash { 0%, 40% { background: var(--brand-softer); } 100% { background: transparent; } }
    .receipt { margin-bottom: var(--s-5); padding: var(--s-5); background: #fffdf8; color: #1c1f1d; border: 1px solid var(--line); border-radius: var(--r-sm); font-size: 13px; }
    .r-head { display: grid; text-align: center; gap: 2px; margin-bottom: var(--s-4); }
    .r-head strong { letter-spacing: 0.18em; }
    .r-head span, .r-foot, .small { color: #6d706c; font-size: 12px; }
    .r-row { display: flex; justify-content: space-between; gap: var(--s-4); padding: 3px 0; }
    .r-sep { border-top: 1px dashed #c9c5ba; margin: var(--s-2) 0; }
    .total { font-weight: 700; font-size: 16px; }
    .r-foot { text-align: center; margin-top: var(--s-4); }
  `,
})
export class CashPage {
  private readonly fb = inject(FormBuilder);
  private readonly productApi = inject(ProductApi);
  private readonly saleApi = inject(SaleApi);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<Product[]>([]);
  protected readonly sales = signal<Sale[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastId = signal<number | null>(null);
  protected readonly page = signal(1);

  protected readonly receiptOpen = signal(false);
  protected readonly receiptLoading = signal(false);
  protected readonly receipt = signal<Receipt | null>(null);

  protected readonly form = this.fb.group({
    productId: this.fb.control<number | null>(null, Validators.required),
    quantity: this.fb.control<number | null>(1, [Validators.required, Validators.min(1), Validators.max(999), integer]),
    customerName: this.fb.nonNullable.control('', [Validators.maxLength(80)]),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly selected = computed(() => this.products().find((p) => p.id === this.value().productId) ?? null);
  protected readonly total = computed(() => Number(this.selected()?.price ?? 0) * Math.max(0, Number(this.value().quantity) || 0));
  protected readonly visibleSales = computed(() => pageOf(this.sales(), this.page(), 8));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({ products: this.productApi.list(), sales: this.saleApi.recent() }).subscribe({
      next: ({ products, sales }) => {
        this.products.set(products);
        this.sales.set(sales);
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected step(delta: number): void {
    const current = Number(this.form.controls.quantity.value) || 0;
    this.form.controls.quantity.setValue(Math.max(1, current + delta));
    this.form.controls.quantity.markAsTouched();
  }

  protected pad(id: number): string {
    return String(id).padStart(6, '0');
  }

  submit(): void {
    this.error.set(null);
    touchAll(this.form);
    const product = this.selected();
    const quantity = Number(this.form.controls.quantity.value);
    if (product && quantity > product.stock) {
      this.form.controls.quantity.setErrors({ stock: `Solo hay ${product.stock} unidades disponibles.` });
    }
    if (this.form.invalid) return;

    this.saving.set(true);
    const value = this.form.getRawValue();
    this.saleApi
      .register({ productId: value.productId!, quantity, customerName: value.customerName.trim() || null })
      .subscribe({
        next: (sale) => {
          this.saving.set(false);
          this.sales.update((list) => [sale, ...list].slice(0, 20));
          this.products.update((list) => list.map((p) => (p.id === sale.productId ? { ...p, stock: p.stock - sale.quantity } : p)));
          this.lastId.set(sale.id);
          this.page.set(1);
          this.form.reset({ productId: null, quantity: 1, customerName: '' });
          this.toast.ok('Venta registrada', `B001-${this.pad(sale.id)} · ${sale.productName}`);
          this.openReceipt(sale.id);
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = toApiError(err);
          applyServerErrors(this.form, apiError);
          this.error.set(apiError.message);
        },
      });
  }

  protected openReceipt(id: number): void {
    this.receipt.set(null);
    this.receiptLoading.set(true);
    this.receiptOpen.set(true);
    this.saleApi.receipt(id).subscribe({
      next: (receipt) => {
        this.receipt.set(receipt);
        this.receiptLoading.set(false);
      },
      error: (err) => {
        this.receiptLoading.set(false);
        this.receiptOpen.set(false);
        this.toast.error('No se pudo obtener la boleta', toApiError(err).message);
      },
    });
  }

  protected print(): void {
    window.print();
  }
}
