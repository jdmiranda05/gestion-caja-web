import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ClaimApi, PurchaseApi } from '../../core/api';
import { toApiError } from '../../core/http-error';
import { Claim, Purchase } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, notBlank, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Pager, pageOf } from '../../shared/pager';
import { FechaPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

const REASONS = ['Producto vencido', 'Producto dañado', 'Cantidad incorrecta', 'Producto equivocado', 'Otro motivo'];

@Component({
  selector: 'app-customer-claims-page',
  imports: [ReactiveFormsModule, RouterLink, Icon, FieldError, EmptyState, ErrorState, SkeletonRows, StatusBadge, Pager, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Mi cuenta</span>
          <h1>Reclamos</h1>
          <p>Registra un reclamo sobre un producto comprado y sigue la respuesta de la bodega.</p>
        </div>
      </header>

      <div class="grid-main-aside reverse">
        <section class="card">
          <header class="card-header">
            <div><h2>Historial</h2><p>{{ claims().length }} {{ claims().length === 1 ? 'reclamo' : 'reclamos' }}</p></div>
          </header>
          @if (loading()) {
            <app-skeleton-rows [rows]="3" [cols]="2" />
          } @else if (error()) {
            <app-error-state [message]="error()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
          } @else if (claims().length === 0) {
            <app-empty-state icon="message" title="Sin reclamos registrados" [compact]="true"
              description="Esperamos que todo haya llegado bien. Si no, usa el formulario." />
          } @else {
            <ul class="claims">
              @for (claim of visible(); track claim.id) {
                <li class="claim">
                  <div class="row-between">
                    <strong>{{ claim.productName }}</strong>
                    <app-status [value]="claim.status" />
                  </div>
                  <span class="meta">Pedido <span class="mono">#{{ claim.orderId }}</span> · {{ claim.reason }} · {{ claim.createdAt | fecha:'relative' }}</span>
                  <p class="desc">{{ claim.description }}</p>
                  @if (claim.staffResponse) {
                    <div class="reply">
                      <span class="reply-label"><app-icon name="message" [size]="13" />Respuesta de la bodega · {{ claim.respondedAt | fecha:'date' }}</span>
                      <p>{{ claim.staffResponse }}</p>
                    </div>
                  }
                </li>
              }
            </ul>
            <app-pager [total]="claims().length" [page]="page()" [size]="5" (pageChange)="page.set($event)" />
          }
        </section>

        <aside class="card sticky-aside">
          <header class="card-header"><div><h2>Nuevo reclamo</h2><p>Todos los campos son obligatorios.</p></div></header>
          @if (!loading() && orders().length === 0) {
            <app-empty-state icon="receipt" title="Necesitas un pedido" [compact]="true"
              description="Solo puedes reclamar productos de pedidos confirmados.">
              <a class="btn btn-sm" routerLink="/">Ir al catálogo</a>
            </app-empty-state>
          } @else {
            <form class="card-body stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="field">
                <label for="orderId">Pedido</label>
                <select id="orderId" class="select" formControlName="orderId" (change)="form.controls.orderItemId.reset(null)">
                  <option [ngValue]="null" disabled>Selecciona un pedido</option>
                  @for (order of orders(); track order.id) {
                    <option [ngValue]="order.id">#{{ order.id }} · {{ order.createdAt | fecha:'date' }}</option>
                  }
                </select>
                <app-field-error [control]="form.controls.orderId" label="El pedido" />
              </div>
              <div class="field">
                <label for="orderItemId">Producto</label>
                <select id="orderItemId" class="select" formControlName="orderItemId">
                  <option [ngValue]="null" disabled>{{ items().length ? 'Selecciona un producto' : 'Primero elige un pedido' }}</option>
                  @for (item of items(); track item.id) {
                    <option [ngValue]="item.id">{{ item.productName }} ×{{ item.quantity }}</option>
                  }
                </select>
                <app-field-error [control]="form.controls.orderItemId" label="El producto" />
              </div>
              <div class="field">
                <label for="reason">Motivo</label>
                <select id="reason" class="select" formControlName="reason">
                  <option value="" disabled>Selecciona un motivo</option>
                  @for (reason of reasons; track reason) { <option [value]="reason">{{ reason }}</option> }
                </select>
                <app-field-error [control]="form.controls.reason" label="El motivo" />
              </div>
              <div class="field">
                <label for="description">Descripción</label>
                <textarea id="description" class="textarea" formControlName="description" maxlength="1000"
                          placeholder="Cuéntanos qué ocurrió con el producto."></textarea>
                <span class="hint num">{{ descriptionLength() }}/1000 · mínimo 10 caracteres</span>
                <app-field-error [control]="form.controls.description" label="La descripción" />
              </div>
              @if (formError()) {
                <div class="alert alert-danger" role="alert"><app-icon name="alert-circle" [size]="18" /><div>{{ formError() }}</div></div>
              }
              <button class="btn btn-primary btn-block" type="submit" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> Enviando… } @else { Enviar reclamo }
              </button>
            </form>
          }
        </aside>
      </div>
    </div>
  `,
  styles: `
    .reverse { grid-template-columns: minmax(0, 1fr) 380px; }
    @media (max-width: 1080px) { .reverse { grid-template-columns: 1fr; } .reverse > aside { order: -1; position: static; } }
    .claims { list-style: none; margin: 0; padding: 0; }
    .claim { display: grid; gap: 4px; padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--line); }
    .claim:last-child { border-bottom: 0; }
    .meta { font-size: var(--text-xs); color: var(--ink-3); }
    .desc { margin-top: var(--s-1); color: var(--ink-2); font-size: var(--text-sm); }
    .reply { margin-top: var(--s-2); padding: var(--s-3); border-left: 2px solid var(--brand); background: var(--brand-softer); border-radius: 0 var(--r-sm) var(--r-sm) 0; font-size: var(--text-sm); }
    .reply-label { display: flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 600; color: var(--brand-ink); margin-bottom: 4px; }
  `,
})
export class CustomerClaimsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly claimApi = inject(ClaimApi);
  private readonly purchaseApi = inject(PurchaseApi);
  private readonly toast = inject(ToastService);

  readonly pedido = input<string>();
  readonly item = input<string>();

  protected readonly reasons = REASONS;
  protected readonly claims = signal<Claim[]>([]);
  protected readonly orders = signal<Purchase[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly page = signal(1);

  protected readonly form = this.fb.group({
    orderId: this.fb.control<number | null>(null, Validators.required),
    orderItemId: this.fb.control<number | null>(null, Validators.required),
    reason: this.fb.nonNullable.control('', Validators.required),
    description: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.minLength(10), Validators.maxLength(1000)]),
  });

  private readonly orderId = toSignal(this.form.controls.orderId.valueChanges, { initialValue: null });
  private readonly description = toSignal(this.form.controls.description.valueChanges, { initialValue: '' });
  protected readonly descriptionLength = computed(() => this.description().length);
  protected readonly items = computed(() => this.orders().find((order) => order.id === this.orderId())?.items ?? []);
  protected readonly visible = computed(() => pageOf(this.claims(), this.page(), 5));

  ngOnInit(): void {
    this.load(true);
  }

  load(prefill = false): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ claims: this.claimApi.mine(), orders: this.purchaseApi.mine() }).subscribe({
      next: ({ claims, orders }) => {
        this.claims.set([...claims].sort((a, b) => b.id - a.id));
        this.orders.set([...orders].sort((a, b) => b.id - a.id));
        this.loading.set(false);
        if (prefill && this.pedido()) {
          this.form.controls.orderId.setValue(Number(this.pedido()));
          if (this.item()) this.form.controls.orderItemId.setValue(Number(this.item()));
        }
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.formError.set(null);
    touchAll(this.form);
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.claimApi
      .create({
        orderId: value.orderId!,
        orderItemId: value.orderItemId!,
        reason: value.reason,
        description: value.description.trim(),
      })
      .subscribe({
        next: (claim) => {
          this.saving.set(false);
          this.claims.update((list) => [claim, ...list]);
          this.page.set(1);
          this.form.reset({ orderId: null, orderItemId: null, reason: '', description: '' });
          this.toast.ok('Reclamo registrado', 'Te responderemos a la brevedad.');
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = toApiError(err);
          applyServerErrors(this.form, apiError);
          this.formError.set(apiError.message);
        },
      });
  }
}
