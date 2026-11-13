import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Marca: toldo de bodega + nombre. */
@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="brand" [routerLink]="link()" aria-label="Tienda Alondralu, inicio">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <rect x="1" y="1" width="26" height="26" rx="7" class="bg" />
        <path d="M6 9h16l-1.2 4.2a2.2 2.2 0 0 1-4.2 0 2.2 2.2 0 0 1-4.2 0 2.2 2.2 0 0 1-4.2 0L6 9Z" class="awning" />
        <path d="M8 15.5V21h12v-5.5" class="shop" />
      </svg>
      <span class="name">Alondralu<small>{{ caption() }}</small></span>
    </a>
  `,
  styles: `
    .brand { display: inline-flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; }
    .bg { fill: var(--brand); }
    .awning { fill: #fff; }
    .shop { fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0.85; }
    .name { display: grid; font-weight: 650; font-size: 15px; letter-spacing: -0.02em; line-height: 1.1; }
    small { font-size: 11px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; white-space: nowrap; }
    @media (max-width: 480px) { small { display: none; } }
  `,
})
export class Brand {
  readonly caption = input('Bodega y caja');
  readonly link = input('/');
}
