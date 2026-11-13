import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ApiError } from '../core/models';

/** Máximo dos decimales (precios). */
export const decimals2: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return /^\d+(\.\d{1,2})?$/.test(String(value)) ? null : { decimals: true };
};

/** Número entero. */
export const integer: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { integer: true };
};

/** Sin espacios únicamente. */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (typeof value !== 'string') return null;
  return value.length > 0 && value.trim().length === 0 ? { required: true } : null;
};

/**
 * Copia los errores por campo devueltos por el backend (400) a los controles
 * del formulario, para que se muestren junto a cada campo.
 */
export function applyServerErrors(form: FormGroup, error: ApiError): void {
  for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    }
  }
}

/** Marca todos los controles como tocados para mostrar los errores al enviar. */
export function touchAll(form: FormGroup): void {
  form.markAllAsTouched();
  Object.values(form.controls).forEach((control) => control.updateValueAndValidity({ emitEvent: true }));
}
