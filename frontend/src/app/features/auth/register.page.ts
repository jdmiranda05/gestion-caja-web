import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { toApiError } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { FieldError } from '../../shared/field-error';
import { applyServerErrors, touchAll } from '../../shared/forms';
import { Icon } from '../../shared/icon';
import { AuthLayout } from './auth-layout';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirm = group.get('confirm');
  if (!password || !confirm || !confirm.value) return null;
  const mismatch = password.value !== confirm.value;
  const others = { ...(confirm.errors ?? {}) };
  delete others['mismatch'];
  confirm.setErrors(mismatch ? { ...others, mismatch: true } : Object.keys(others).length ? others : null);
  return null;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, FieldError, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout title="Crea tu cuenta" lead="Compra en línea y sigue tus pedidos y reclamos.">
      @if (error()) {
        <div class="alert alert-danger" role="alert">
          <app-icon name="alert-circle" [size]="18" />
          <div><strong>No pudimos crear la cuenta</strong>{{ error() }}</div>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="stack" novalidate>
        <div class="field">
          <label for="username">Usuario</label>
          <input id="username" class="input" formControlName="username" autocomplete="username" placeholder="maria.lopez" />
          <span class="hint">Entre 3 y 30 caracteres: letras, números, punto o guion.</span>
          <app-field-error [control]="form.controls.username" label="El usuario" />
        </div>

        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" placeholder="nombre@correo.com" />
          <app-field-error [control]="form.controls.email" label="El correo" />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password" />
          <div class="meter" [attr.data-level]="strength()" aria-hidden="true"><span></span><span></span><span></span></div>
          <span class="hint">{{ strengthLabel() }}</span>
          <app-field-error [control]="form.controls.password" label="La contraseña" />
        </div>

        <div class="field">
          <label for="confirm">Repite la contraseña</label>
          <input id="confirm" class="input" type="password" formControlName="confirm" autocomplete="new-password" />
          <app-field-error [control]="form.controls.confirm" label="La confirmación" />
        </div>

        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Creando cuenta… } @else { Crear cuenta }
        </button>
      </form>

      <p class="alt">¿Ya tienes cuenta? <a routerLink="/login">Ingresar</a></p>
    </app-auth-layout>
  `,
  styles: `
    .alert { margin-bottom: var(--s-5); }
    .alt { margin-top: var(--s-6); text-align: center; color: var(--ink-3); font-size: var(--text-sm); }
    .meter { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .meter span { height: 4px; border-radius: 4px; background: var(--surface-sunken); transition: background var(--dur-2) var(--ease); }
    .meter[data-level="1"] span:nth-child(-n + 1) { background: var(--danger); }
    .meter[data-level="2"] span:nth-child(-n + 2) { background: var(--warn); }
    .meter[data-level="3"] span { background: var(--ok); }
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

  protected readonly strength = computed(() => {
    const value = this.password();
    if (!value) return 0;
    let score = value.length >= 8 ? 1 : 0;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.max(1, score);
  });

  protected readonly strengthLabel = computed(
    () => ['Mínimo 8 caracteres.', 'Seguridad baja.', 'Seguridad media.', 'Contraseña segura.'][this.strength()],
  );

  submit(): void {
    this.error.set(null);
    touchAll(this.form);
    this.form.updateValueAndValidity();
    if (this.form.invalid) return;

    this.loading.set(true);
    const { username, email, password } = this.form.getRawValue();
    this.auth.register({ username: username.trim(), email: email.trim(), password }).subscribe({
      next: () => {
        // Inicia sesión automáticamente con las mismas credenciales.
        this.auth.login({ username: username.trim(), password }).subscribe({
          next: () => {
            this.toast.ok('Cuenta creada', 'Bienvenido a Tienda Alondralu.');
            void this.router.navigateByUrl('/');
          },
          error: () => void this.router.navigate(['/login']),
        });
      },
      error: (err) => {
        this.loading.set(false);
        const apiError = toApiError(err);
        applyServerErrors(this.form, apiError);
        this.error.set(apiError.message);
      },
    });
  }
}
