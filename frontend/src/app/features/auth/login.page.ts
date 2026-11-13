import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { toApiError } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { AuthLayout } from './auth-layout';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, FieldError, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout title="Ingresa a tu cuenta" lead="Compra en la tienda o gestiona la caja según tu rol.">
      @if (motivo() === 'expired') {
        <div class="alert alert-info" role="status">
          <app-icon name="clock" [size]="18" />
          <div><strong>Tu sesión terminó</strong>Por seguridad, vuelve a iniciar sesión.</div>
        </div>
      }
      @if (error()) {
        <div class="alert alert-danger" role="alert">
          <app-icon name="alert-circle" [size]="18" />
          <div><strong>No pudimos iniciar sesión</strong>{{ error() }}</div>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
        <div class="field">
          <label for="username">Usuario</label>
          <input id="username" class="input" formControlName="username" autocomplete="username"
                 placeholder="tu_usuario" aria-describedby="username-error" />
          <app-field-error [control]="form.controls.username" label="El usuario" id="username-error" />
        </div>

        <div class="field">
          <div class="row-between">
            <label for="password">Contraseña</label>
          </div>
          <div class="pw">
            <input id="password" class="input" [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                   autocomplete="current-password" aria-describedby="password-error" />
            <button type="button" class="btn btn-ghost btn-icon btn-sm" (click)="showPassword.set(!showPassword())"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" />
            </button>
          </div>
          <app-field-error [control]="form.controls.password" label="La contraseña" id="password-error" />
        </div>

        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Verificando… } @else { Ingresar }
        </button>
      </form>

      <p class="alt">¿Aún no tienes cuenta? <a routerLink="/registro">Crear una cuenta de cliente</a></p>
    </app-auth-layout>
  `,
  styles: `
    .alert { margin-bottom: var(--s-5); }
    .pw { position: relative; }
    .pw .input { padding-right: 44px; }
    .pw .btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
    .alt { margin-top: var(--s-6); text-align: center; color: var(--ink-3); font-size: var(--text-sm); }
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly returnUrl = input<string>();
  readonly motivo = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(30)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });

  protected readonly canSubmit = computed(() => !this.loading());

  submit(): void {
    this.error.set(null);
    touchAll(this.form);
    if (this.form.invalid) return;

    this.loading.set(true);
    const { username, password } = this.form.getRawValue();
    this.auth.login({ username: username.trim(), password }).subscribe({
      next: (session) => {
        this.loading.set(false);
        this.toast.ok(`Hola, ${session.username}`, 'Sesión iniciada correctamente.');
        const target = this.returnUrl() && this.returnUrl() !== '/login' ? this.returnUrl()! : this.auth.homeFor(session.role);
        void this.router.navigateByUrl(target);
      },
      error: (err) => {
        this.loading.set(false);
        const apiError = toApiError(err);
        applyServerErrors(this.form, apiError);
        this.error.set(apiError.message);
        this.form.controls.password.reset('');
      },
    });
  }
}
