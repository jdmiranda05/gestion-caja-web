import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserApi } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm.service';
import { toApiError } from '../../core/http-error';
import { Role, User } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, notBlank, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/overlays';
import { Pager, pageOf } from '../../shared/pager';
import { EmptyState, ErrorState, SkeletonRows } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, Icon, Modal, FieldError, Pager, EmptyState, ErrorState, SkeletonRows, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Solo administrador</span>
          <h1>Usuarios y roles</h1>
          <p>Asigna roles y solicita la desactivación de cuentas. Los cambios aplican en el siguiente acceso.</p>
        </div>
      </header>

      <section class="card">
        <div class="toolbar">
          <div class="input-group">
            <app-icon name="search" />
            <input class="input" type="search" placeholder="Buscar por usuario o correo…" aria-label="Buscar usuarios"
                   [value]="query()" (input)="query.set($any($event.target).value); page.set(1)" />
          </div>
          <div class="segmented" role="group" aria-label="Filtrar por rol">
            @for (option of roleFilters; track option.label) {
              <button [attr.aria-pressed]="roleFilter() === option.value" (click)="roleFilter.set(option.value); page.set(1)">{{ option.label }}</button>
            }
          </div>
        </div>

        @if (loading()) {
          <app-skeleton-rows [rows]="6" [cols]="4" />
        } @else if (error()) {
          <app-error-state [message]="error()!"><button class="btn btn-sm" (click)="load()">Reintentar</button></app-error-state>
        } @else if (filtered().length === 0) {
          <app-empty-state icon="users" title="Sin usuarios que coincidan" description="Prueba con otro término o rol." />
        } @else {
          <div class="table-wrap">
            <table class="table table-cards">
              <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th class="actions"></th></tr></thead>
              <tbody>
                @for (user of visible(); track user.id) {
                  <tr>
                    <td data-label="Usuario">
                      <div class="who">
                        <span class="avatar" aria-hidden="true">{{ user.username.charAt(0) }}</span>
                        <div><span class="cell-title">{{ user.username }} @if (isMe(user)) { <span class="badge badge-brand plain">Tú</span> }</span>
                          <span class="cell-sub">{{ user.email }}</span></div>
                      </div>
                    </td>
                    <td data-label="Rol">
                      @if (isMe(user)) {
                        <app-status [value]="user.role" />
                      } @else {
                        <select class="select role" [value]="user.role" [disabled]="busyId() === user.id || !user.active"
                                (change)="changeRole(user, $any($event.target))" [attr.aria-label]="'Rol de ' + user.username">
                          <option value="CUSTOMER">Cliente</option>
                          <option value="MANAGER">Gerente</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      }
                    </td>
                    <td data-label="Estado"><app-status [value]="user.active ? 'ACTIVE' : 'INACTIVE'" /></td>
                    <td class="actions">
                      @if (!isMe(user) && user.active) {
                        <button class="btn btn-ghost btn-sm danger" (click)="openDeactivate(user)">Solicitar desactivación</button>
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

    <app-modal [open]="target() !== null" (closed)="target.set(null)" title="Solicitar desactivación"
               [subtitle]="'Cuenta: ' + (target()?.username ?? '')">
      <form class="stack" [formGroup]="form" (ngSubmit)="submitDeactivation()" novalidate>
        <div class="alert alert-warn"><app-icon name="alert" [size]="18" />
          <div>La solicitud debe ser aprobada por otro gerente o administrador antes de ejecutarse.</div></div>
        <div class="field">
          <label for="reason">Motivo</label>
          <textarea id="reason" class="textarea" formControlName="reason" maxlength="255" placeholder="Ej. Personal que dejó de laborar en la bodega."></textarea>
          <app-field-error [control]="form.controls.reason" label="El motivo" />
        </div>
        @if (formError()) { <div class="alert alert-danger"><app-icon name="alert-circle" [size]="18" /><div>{{ formError() }}</div></div> }
        <div class="form-actions">
          <button type="button" class="btn" (click)="target.set(null)">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="saving()">@if (saving()) { <span class="spinner"></span> } Enviar solicitud</button>
        </div>
      </form>
    </app-modal>
  `,
  styles: `
    .who { display: flex; align-items: center; gap: var(--s-3); }
    .avatar { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 50%; background: var(--surface-sunken); color: var(--ink-2); font-weight: 600; text-transform: uppercase; }
    .role { width: 160px; height: 32px; font-size: var(--text-sm); }
    .danger:hover { color: var(--danger); background: var(--danger-soft); }
    @media (max-width: 720px) { .who { text-align: left; } .role { width: auto; } }
  `,
})
export class UsersPage {
  private readonly api = inject(UserApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly roleFilters: { label: string; value: Role | null }[] = [
    { label: 'Todos', value: null },
    { label: 'Clientes', value: 'CUSTOMER' },
    { label: 'Gerentes', value: 'MANAGER' },
    { label: 'Admins', value: 'ADMIN' },
  ];

  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly roleFilter = signal<Role | null>(null);
  protected readonly page = signal(1);
  protected readonly busyId = signal<number | null>(null);
  protected readonly target = signal<User | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, notBlank, Validators.maxLength(255)]],
  });

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.users().filter(
      (u) =>
        (!this.roleFilter() || u.role === this.roleFilter()) &&
        (!q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    );
  });
  protected readonly visible = computed(() => pageOf(this.filtered(), this.page(), 10));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (users) => {
        this.users.set([...users].sort((a, b) => a.username.localeCompare(b.username)));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(toApiError(err).message);
        this.loading.set(false);
      },
    });
  }

  protected isMe(user: User): boolean {
    return user.username === this.auth.username();
  }

  protected async changeRole(user: User, select: HTMLSelectElement): Promise<void> {
    const role = select.value as Role;
    const labels: Record<Role, string> = { CUSTOMER: 'Cliente', MANAGER: 'Gerente', ADMIN: 'Administrador' };
    const ok = await this.confirm.ask({
      title: `¿Cambiar el rol de ${user.username}?`,
      message: `Pasará de ${labels[user.role]} a ${labels[role]}. Su sesión actual se cerrará y deberá ingresar de nuevo.`,
      confirmLabel: 'Cambiar rol',
    });
    if (!ok) {
      select.value = user.role;
      return;
    }
    this.busyId.set(user.id);
    this.api.changeRole(user.id, role).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.toast.ok('Rol actualizado', `${updated.username} ahora es ${labels[updated.role]}.`);
      },
      error: (err) => {
        this.busyId.set(null);
        select.value = user.role;
        this.toast.error('No se pudo cambiar el rol', toApiError(err).message);
      },
    });
  }

  protected openDeactivate(user: User): void {
    this.form.reset({ reason: '' });
    this.formError.set(null);
    this.target.set(user);
  }

  protected submitDeactivation(): void {
    const user = this.target();
    touchAll(this.form);
    if (!user || this.form.invalid) return;
    this.saving.set(true);
    this.api.requestDeactivation(user.id, this.form.getRawValue().reason.trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.target.set(null);
        this.toast.ok('Solicitud enviada', 'Queda pendiente de aprobación.');
        void this.router.navigate(['/panel/solicitudes']);
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
