import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'brand' | 'neutral';

const MAP: Record<string, { label: string; tone: Tone }> = {
  // Reclamos
  PENDING: { label: 'Pendiente', tone: 'warn' },
  IN_REVIEW: { label: 'En revisión', tone: 'info' },
  RESOLVED: { label: 'Resuelto', tone: 'ok' },
  REJECTED: { label: 'Rechazado', tone: 'danger' },
  // Desactivaciones
  APPROVED: { label: 'Aprobada', tone: 'info' },
  EXECUTED: { label: 'Ejecutada', tone: 'neutral' },
  // Roles
  CUSTOMER: { label: 'Cliente', tone: 'neutral' },
  MANAGER: { label: 'Gerente', tone: 'brand' },
  ADMIN: { label: 'Administrador', tone: 'info' },
  // Cuenta
  ACTIVE: { label: 'Activa', tone: 'ok' },
  INACTIVE: { label: 'Desactivada', tone: 'danger' },
};

/** Insignia de estado con punto + texto (el color nunca es la única señal). */
@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge badge-' + info().tone">{{ info().label }}</span>`,
})
export class StatusBadge {
  readonly value = input.required<string>();
  protected readonly info = computed(() => MAP[this.value()] ?? { label: this.value(), tone: 'neutral' as Tone });
}

/** Indicador de stock: agotado / bajo / disponible. */
@Component({
  selector: 'app-stock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stock" [class]="'stock ' + level()">
      <span class="bar"><span [style.width.%]="fill()"></span></span>
      <span class="num">{{ value() }}</span>
      @if (level() === 'out') { <span class="lbl">Agotado</span> }
      @else if (level() === 'low') { <span class="lbl">Bajo</span> }
    </span>
  `,
  styles: `
    .stock { display: inline-flex; align-items: center; gap: 8px; font-size: var(--text-sm); }
    .bar { width: 36px; height: 4px; border-radius: 4px; background: var(--surface-sunken); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: 4px; background: var(--ok); transition: width var(--dur-3) var(--ease); }
    .low .bar span { background: var(--warn); }
    .out .bar span { background: var(--danger); }
    .num { min-width: 2ch; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    .lbl { font-size: var(--text-xs); font-weight: 500; }
    .low .lbl { color: var(--warn); }
    .out .lbl { color: var(--danger); }
  `,
})
export class StockIndicator {
  readonly value = input.required<number>();
  readonly threshold = input(10);
  protected readonly level = computed(() =>
    this.value() <= 0 ? 'out' : this.value() <= this.threshold() ? 'low' : 'ok',
  );
  protected readonly fill = computed(() => Math.max(4, Math.min(100, (this.value() / 40) * 100)));
}
