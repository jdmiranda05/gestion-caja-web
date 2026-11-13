import { Pipe, PipeTransform } from '@angular/core';

const SOLES = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

const NUMBER = new Intl.NumberFormat('es-PE');

const DATE_TIME = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** Formatea montos en soles: S/ 12.50 */
@Pipe({ name: 'soles' })
export class SolesPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    return SOLES.format(Number(value));
  }
}

/** Formatea enteros con separador de miles. */
@Pipe({ name: 'num' })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : NUMBER.format(value);
  }
}

/** Fecha y hora local: 13 nov 2026, 10:42 */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(value: string | null | undefined, mode: 'datetime' | 'date' | 'relative' = 'datetime'): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    if (mode === 'date') return DATE.format(date);
    if (mode === 'relative') {
      const minutes = Math.round((date.getTime() - Date.now()) / 60000);
      if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute');
      const hours = Math.round(minutes / 60);
      if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour');
      const days = Math.round(hours / 24);
      if (Math.abs(days) < 7) return RELATIVE.format(days, 'day');
      return DATE.format(date);
    }
    return DATE_TIME.format(date);
  }
}
