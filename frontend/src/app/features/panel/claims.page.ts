import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimApi } from '../../core/api';
import { toApiError } from '../../core/http-error';
import { ClaimAudit, ClaimStatus, StaffClaim } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, notBlank, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/overlays';
import { Pager, pageOf } from '../../shared/pager';
import { FechaPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

const ACTIONS: Record<string, string> = {
  START_REVIEW: 'Inició la revisión',
  RESOLVE: 'Resolvió el reclamo',
  RESOLVED: 'Resolvió el reclamo',
  REJECT: 'Rechazó el reclamo',
  REJECTED: 'Rechazó el reclamo',
};

@Component({
  selector: 'app-staff-claims-page',
  imports: [ReactiveFormsModule, Icon, Modal, FieldError, Pager, EmptyState, ErrorState, SkeletonRows, StatusBadge, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Atención al cliente</span>
          <h1>Reclamos</h1>
          <p>Revisa cada reclamo, responde al cliente y deja trazabilidad del cambio de estado.</p>
        </div>
      </header>

      <section class="card">
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filtrar por estado">
            @for (option of filters; track option.label) {
              <button class="chip" [attr.aria-pressed]="status() === option.value" (click)="setStatus(option.value)">
                {{ option.label }}<span class="count">{{ countFor(option.value) }}</span>
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <app-skeleton-rows [rows]="5" [cols]="5" />
        } @else if (error()) {
          <app-error-state [message]="error()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
        } @else if (filtered().length === 0) {
          <app-empty-state icon="check-circle" [title]="status() ? 'Nada en este estado' : 'No hay reclamos'"
            description="Cuando un cliente registre un reclamo aparecerá en esta bandeja." />
        } @else {
          <div class="table-wrap">
            <table class="table table-cards">
              <thead><tr><th>Código</th><th>Producto y motivo</th><th>Estado</th><th>Registrado</th><th class="actions"></th></tr></thead>
              <tbody>
                @for (claim of visible(); track claim.id) {
                  <tr>
                    <td data-label="Código"><span class="mono">{{ claim.internalCode }}</span><span class="cell-sub">Pedido #{{ claim.orderId }}</span></td>
                    <td data-label="Producto"><span class="cell-title">{{ claim.productName }}</span><span class="cell-sub">{{ claim.reason }}</span></td>
                    <td data-label="Estado"><app-status [value]="claim.status" /></td>
                    <td data-label="Registrado">{{ claim.createdAt | fecha:'relative' }}</td>
                    <td class="actions">
                      @if (claim.status === 'PENDING') {
                        <button class="btn btn-sm" [disabled]="busyId() === claim.id" (click)="review(claim)">Iniciar revisión</button>
                      } @else if (claim.status === 'IN_REVIEW') {
                        <button class="btn btn-sm btn-primary" (click)="openResolve(claim)">Responder</button>
                      }
                      <button class="btn btn-ghost btn-sm btn-icon" (click)="openDetail(claim)" aria-label="Ver detalle e historial" title="Detalle"><app-icon name="list" /></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pager [total]="filtered().length" [page]="page()" [size]="10" (pageChange)="page.set($event)" />
        }
      </section>
    </div>

    <app-modal [open]="resolving() !== null" (closed)="resolving.set(null)" title="Responder reclamo"
               [subtitle]="resolving()?.internalCode + ' · ' + resolving()?.productName">
      <form class="stack" [formGroup]="form" (ngSubmit)="resolve()" novalidate>
        <blockquote class="quote">{{ resolving()?.description }}</blockquote>
        <fieldset class="decision">
          <legend class="label">Decisión</legend>
          <label class="option" [class.on]="form.controls.status.value === 'RESOLVED'">
            <input type="radio" formControlName="status" value="RESOLVED" /> <app-icon name="check-circle" />
            <span><strong>Resolver</strong><small>Se atiende lo solicitado</small></span>
          </label>
          <label class="option" [class.on]="form.controls.status.value === 'REJECTED'">
            <input type="radio" formControlName="status" value="REJECTED" /> <app-icon name="x" />
            <span><strong>Rechazar</strong><small>No procede el reclamo</small></span>
          </label>
        </fieldset>
        <app-field-error [control]="form.controls.status" label="La decisión" />
        <div class="field">
          <label for="response">Respuesta para el cliente</label>
          <textarea id="response" class="textarea" formControlName="response" maxlength="1000" placeholder="Explica la solución o el motivo del rechazo."></textarea>
          <app-field-error [control]="form.controls.response" label="La respuesta" />
        </div>
        @if (formError()) { <div class="alert alert-danger"><app-icon name="alert-circle" [size]="18" /><div>{{ formError() }}</div></div> }
        <div class="form-actions">
          <button type="button" class="btn" (click)="resolving.set(null)">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">@if (saving()) { <span class="spinner"></span> } Enviar respuesta</button>
        </div>
      </form>
    </app-modal>

    <app-modal [open]="detail() !== null" (closed)="detail.set(null)" [title]="'Reclamo ' + (detail()?.internalCode ?? '')" [wide]="true">
      @if (detail(); as c) {
        <dl class="facts">
          <div><dt>Producto</dt><dd>{{ c.productName }}</dd></div>
          <div><dt>Pedido</dt><dd class="mono">#{{ c.orderId }}</dd></div>
          <div><dt>Estado</dt><dd><app-status [value]="c.status" /></dd></div>
          <div><dt>Motivo</dt><dd>{{ c.reason }}</dd></div>
        </dl>
        <p class="desc">{{ c.description }}</p>
        <h3 class="h-hist">Historial</h3>
        @if (historyLoading()) {
          <app-skeleton-rows [rows]="2" [cols]="2" />
        } @else if (history().length === 0) {
          <p class="muted">Sin movimientos registrados todavía.</p>
        } @else {
          <ol class="timeline">
            @for (h of history(); track h.id) {
              <li>
                <span class="dot"></span>
                <div>
                  <strong>{{ actionLabel(h) }}</strong>
                  <span class="muted"> · usuario #{{ h.actorUserId }} · {{ h.createdAt | fecha }}</span>
                  @if (h.details) { <p>{{ h.details }}</p> }
                </div>
              </li>
            }
          </ol>
        }
      }
    </app-modal>
  `,
  styles: `
    .quote { margin: 0; padding: var(--s-3) var(--s-4); border-left: 2px solid var(--line-strong); background: var(--surface-2); color: var(--ink-2); font-size: var(--text-sm); }
    .decision { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-2); margin: 0; padding: 0; border: 0; }
    .decision legend { margin-bottom: 6px; }
    .option { display: flex; align-items: center; gap: var(--s-2); padding: var(--s-3); border: 1px solid var(--line-strong); border-radius: var(--r-md); cursor: pointer; transition: all var(--dur-1) var(--ease); }
    .option input { position: absolute; opacity: 0; pointer-events: none; }
    .option span { display: grid; }
    .option small { color: var(--ink-3); font-size: var(--text-xs); }
    .option.on { border-color: var(--brand); background: var(--brand-softer); box-shadow: 0 0 0 1px var(--brand); }
    .option:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
    .facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s-4); margin: 0 0 var(--s-4); }
    .facts dt { font-size: var(--text-xs); color: var(--ink-3); }
    .facts dd { margin: 2px 0 0; font-weight: 500; }
    .desc { padding: var(--s-3) var(--s-4); background: var(--surface-2); border-radius: var(--r-sm); color: var(--ink-2); }
    .h-hist { margin: var(--s-5) 0 var(--s-3); font-size: var(--text-base); }
    .timeline { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-4); }
    .timeline li { position: relative; display: grid; grid-template-columns: 12px 1fr; gap: var(--s-3); font-size: var(--text-sm); }
    .timeline li:not(:last-child)::after { content: ''; position: absolute; left: 5px; top: 16px; bottom: calc(-1 * var(--s-4)); width: 1px; background: var(--line); }
    .dot { width: 11px; height: 11px; margin-top: 4px; border-radius: 50%; border: 2px solid var(--brand); background: var(--surface); }
    .timeline p { margin-top: 2px; color: var(--ink-2); }
    @media (max-width: 640px) { .facts { grid-template-columns: 1fr 1fr; } .decision { grid-template-columns: 1fr; } }
  `,
})
export class StaffClaimsPage {
  private readonly api = inject(ClaimApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly filters: { label: string; value: ClaimStatus | null }[] = [
    { label: 'Todos', value: null },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'En revisión', value: 'IN_REVIEW' },
    { label: 'Resueltos', value: 'RESOLVED' },
    { label: 'Rechazados', value: 'REJECTED' },
  ];

  protected readonly claims = signal<StaffClaim[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<ClaimStatus | null>(null);
  protected readonly page = signal(1);
  protected readonly busyId = signal<number | null>(null);

  protected readonly resolving = signal<StaffClaim | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly detail = signal<StaffClaim | null>(null);
  protected readonly history = signal<ClaimAudit[]>([]);
  protected readonly historyLoading = signal(false);

  protected readonly form = this.fb.group({
    status: this.fb.control<'RESOLVED' | 'REJECTED' | null>(null, Validators.required),
    response: this.fb.nonNullable.control('', [Validators.required, notBlank, Validators.maxLength(1000)]),
  });

  protected readonly filtered = computed(() =>
    this.status() ? this.claims().filter((c) => c.status === this.status()) : this.claims(),
  );
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), 10));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.staff().subscribe({
      next: (claims) => {
        this.claims.set([...claims].sort((a, b) => b.id - a.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected countFor(status: ClaimStatus | null): number {
    return status ? this.claims().filter((c) => c.status === status).length : this.claims().length;
  }

  protected setStatus(status: ClaimStatus | null): void {
    this.status.set(status);
    this.page.set(1);
  }

  protected actionLabel(entry: ClaimAudit): string {
    if (entry.action === 'RESOLVE_CLAIM') {
      return entry.newStatus === 'REJECTED' ? 'Rechazó el reclamo' : 'Resolvió el reclamo';
    }
    return ACTIONS[entry.action] ?? entry.action;
  }

  protected review(claim: StaffClaim): void {
    this.busyId.set(claim.id);
    this.api.startReview(claim.id).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.replace(updated);
        this.toast.ok('Reclamo en revisión', updated.internalCode);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error('No se pudo iniciar la revisión', toApiError(err).message);
      },
    });
  }

  protected openResolve(claim: StaffClaim): void {
    this.form.reset({ status: null, response: '' });
    this.formError.set(null);
    this.resolving.set(claim);
  }

  protected resolve(): void {
    const claim = this.resolving();
    touchAll(this.form);
    if (!claim || this.form.invalid) return;
    this.saving.set(true);
    const { status, response } = this.form.getRawValue();
    this.api.resolve(claim.id, status!, response.trim()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.replace(updated);
        this.resolving.set(null);
        this.toast.ok(status === 'RESOLVED' ? 'Reclamo resuelto' : 'Reclamo rechazado', updated.internalCode);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = toApiError(err);
        applyServerErrors(this.form, apiError);
        this.formError.set(apiError.message);
      },
    });
  }

  protected openDetail(claim: StaffClaim): void {
    this.detail.set(claim);
    this.history.set([]);
    this.historyLoading.set(true);
    this.api.history(claim.id).subscribe({
      next: (history) => {
        this.history.set(history);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  private replace(updated: StaffClaim): void {
    this.claims.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
  }
}
