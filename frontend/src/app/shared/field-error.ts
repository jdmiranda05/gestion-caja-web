import { ChangeDetectionStrategy, Component, computed, input, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Icon } from './icon';

/** Traduce los errores de validación de Angular a mensajes claros en español. */
export function validationMessage(control: AbstractControl | null, label = 'Este campo'): string | null {
  const errors = control?.errors;
  if (!errors) return null;
  if (errors['server']) return errors['server'] as string;
  if (errors['required']) return `Completa ${label.charAt(0).toLowerCase()}${label.slice(1)}.`;
  if (errors['email']) return 'Ingresa un correo electrónico válido.';
  if (errors['minlength']) return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
  if (errors['maxlength']) return `Admite como máximo ${errors['maxlength'].requiredLength} caracteres.`;
  if (errors['min']) return `El valor mínimo es ${errors['min'].min}.`;
  if (errors['max']) return `El valor máximo es ${errors['max'].max}.`;
  if (errors['pattern']) return 'El formato no es válido.';
  if (errors['decimals']) return 'Usa como máximo 2 decimales.';
  if (errors['integer']) return 'Debe ser un número entero.';
  if (errors['mismatch']) return 'Las contraseñas no coinciden.';
  if (errors['stock']) return errors['stock'] as string;
  return 'El valor no es válido.';
}

/**
 * Muestra el error de un control cuando el usuario ya interactuó con él
 * o cuando el formulario se intentó enviar.
 */
@Component({
  selector: 'app-field-error',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message()) {
      <p class="field-error" role="alert" [id]="id()">
        <app-icon name="alert-circle" [size]="14" />{{ message() }}
      </p>
    }
  `,
})
export class FieldError implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly control = input.required<AbstractControl | null>();
  readonly label = input('Este campo');
  readonly id = input<string>();
  /** Señal interna para re-evaluar cuando cambia el estado del control (zoneless). */
  private readonly tick = signal(0);

  protected readonly message = computed(() => {
    this.tick();
    const control = this.control();
    if (!control || !(control.touched || control.dirty) || control.valid) return null;
    return validationMessage(control, this.label());
  });

  ngOnInit(): void {
    const subscription = this.control()?.events.subscribe(() => this.tick.update((v) => v + 1));
    this.destroyRef.onDestroy(() => subscription?.unsubscribe());
  }
}
