import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { UserApi } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { toApiError } from '../../core/http-error';
import { DeactivationRequest, DeactivationStatus, User } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { Pager, pageOf } from '../../shared/pager';
import { FechaPipe } from '../../shared/pipes';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-approvals-page',
  imports: [Icon, Pager, EmptyState, ErrorState, SkeletonRows, StatusBadge, FechaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Control interno</span>
          <h1>Solicitudes de desactivación</h1>
          <p>Quien solicita no puede aprobar su propia solicitud. Solo un administrador ejecuta las aprobadas.</p>
        </div>
      </header>

      <ol class="flow" aria-label="Flujo de aprobación">
        <li><span class="step">1</span>Administrador solicita</li>
        <li><span class="step">2</span>Otro gerente o administrador aprueba o rechaza</li>
        <li><span class="step">3</span>Administrador ejecuta y la cuenta queda desactivada</li>
      </ol>

      <section class="card">
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filtrar por estado">
            @for (option of filters; track option.label) {
              <button class="chip" [attr.aria-pressed]="status() === option.value" (click)="status.set(option.value); page.set(1)">
                {{ option.label }}<span class="count">{{ countFor(option.value) }}</span>
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <app-skeleton-rows [rows]="4" [cols]="5" />
        } @else if (error()) {
          <app-error-state [message]="error()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
        } @else if (filtered().length === 0) {
          <app-empty-state icon="shield" title="Sin solicitudes" [description]="auth.isAdmin()
            ? 'Puedes crear una solicitud desde Usuarios y roles.'
            : 'Cuando un administrador solicite desactivar una cuenta, la verás aquí para aprobarla.'" />
        } @else {
          <div class="table-wrap">
            <table class="table table-cards">
              <thead><tr><th>Cuenta</th><th>Motivo</th><th>Solicitó</th><th>Estado</th><th>Fecha</th><th class="actions"></th></tr></thead>
              <tbody>
                @for (r of visible(); track r.id) {
                  <tr>
                    <td data-label="Cuenta"><span class="cell-title">{{ userName(r.targetUserId) }}</span><span class="cell-sub mono">Solicitud #{{ r.id }}</span></td>
                    <td data-label="Motivo" class="reason">{{ r.reason }}</td>
                    <td data-label="Solicitó">{{ userName(r.requestedByUserId) }}</td>
                    <td data-label="Estado"><app-status [value]="r.status" /></td>
                    <td data-label="Fecha">{{ r.requestedAt | fecha:'relative' }}</td>
                    <td class="actions">
                      @if (r.status === 'PENDING') {
                        <button class="btn btn-sm" [disabled]="busyId() === r.id" (click)="reject(r)">Rechazar</button>
                        <button class="btn btn-sm btn-primary" [disabled]="busyId() === r.id" (click)="approve(r)">Aprobar</button>
                      } @else if (r.status === 'APPROVED' && auth.isAdmin()) {
                        <button class="btn btn-sm btn-danger" [disabled]="busyId() === r.id" (click)="execute(r)">
                          <app-icon name="lock" />Ejecutar
                        </button>
                      } @else {
                        <span class="muted small">{{ r.decidedAt ? 'Decidida ' : '' }}{{ r.decidedAt | fecha:'date' }}</span>
                      }
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
  `,
  styles: `
    .flow { list-style: none; margin: 0 0 var(--s-5); padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-3); }
    .flow li { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); border: 1px dashed var(--line-strong); border-radius: var(--r-md); font-size: var(--text-sm); color: var(--ink-2); }
    .step { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-ink); font-weight: 600; font-size: 12px; }
    .reason { max-width: 280px; color: var(--ink-2); }
    .small { font-size: var(--text-xs); }
    @media (max-width: 900px) { .flow { grid-template-columns: 1fr; } }
  `,
})
export class ApprovalsPage {
  private readonly api = inject(UserApi);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  protected readonly auth = inject(AuthService);

  protected readonly filters: { label: string; value: DeactivationStatus | null }[] = [
    { label: 'Todas', value: null },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Aprobadas', value: 'APPROVED' },
    { label: 'Ejecutadas', value: 'EXECUTED' },
    { label: 'Rechazadas', value: 'REJECTED' },
  ];

  protected readonly requests = signal<DeactivationRequest[]>([]);
  private readonly users = signal<Map<number, User>>(new Map());
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<DeactivationStatus | null>('PENDING');
  protected readonly page = signal(1);
  protected readonly busyId = signal<number | null>(null);

  protected readonly filtered = computed(() =>
    this.status() ? this.requests().filter((r) => r.status === this.status()) : this.requests(),
  );
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), 10));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      requests: this.api.requests(),
      // El listado de usuarios es exclusivo de ADMIN: el gerente ve solo los identificadores.
      users: this.auth.isAdmin() ? this.api.list() : of([] as User[]),
    }).subscribe({
      next: ({ requests, users }) => {
        this.requests.set(requests);
        this.users.set(new Map(users.map((u) => [u.id, u])));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected countFor(status: DeactivationStatus | null): number {
    return status ? this.requests().filter((r) => r.status === status).length : this.requests().length;
  }

  protected userName(id: number): string {
    return this.users().get(id)?.username ?? `Usuario #${id}`;
  }

  protected approve(r: DeactivationRequest): void {
    this.run(r, this.api.approve(r.id), 'Solicitud aprobada');
  }

  protected reject(r: DeactivationRequest): void {
    this.run(r, this.api.reject(r.id), 'Solicitud rechazada');
  }

  protected async execute(r: DeactivationRequest): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Desactivar la cuenta de ${this.userName(r.targetUserId)}?`,
      message: 'La persona no podrá iniciar sesión y sus tokens actuales dejarán de ser válidos de inmediato.',
      confirmLabel: 'Desactivar cuenta',
      tone: 'danger',
    });
    if (ok) this.run(r, this.api.execute(r.id), 'Cuenta desactivada');
  }

  private run(r: DeactivationRequest, request: ReturnType<UserApi['approve']>, message: string): void {
    this.busyId.set(r.id);
    request.subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.requests.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.toast.ok(message, this.userName(updated.targetUserId));
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error('No se pudo completar', toApiError(err).message);
      },
    });
  }
}
