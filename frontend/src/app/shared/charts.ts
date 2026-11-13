import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

export interface ChartPoint {
  label: string;
  /** Etiqueta larga para el tooltip y la tabla. */
  detail?: string;
  value: number;
  secondary?: string;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * Gráfico de columnas de una sola serie (SVG):
 * columnas delgadas con extremo redondeado anclado a la base, rejilla recesiva,
 * tooltip al pasar el cursor (área de impacto = toda la banda) y vista de tabla.
 */
@Component({
  selector: 'app-column-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" (mouseleave)="active.set(null)">
      <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" [attr.width]="width()" [attr.height]="height()"
           role="img" [attr.aria-label]="ariaLabel()">
        @for (tick of ticks(); track tick.value) {
          <g>
            <line [attr.x1]="padL" [attr.x2]="width() - padR" [attr.y1]="tick.y" [attr.y2]="tick.y" class="grid" />
            <text [attr.x]="padL - 8" [attr.y]="tick.y" class="axis" text-anchor="end" dominant-baseline="middle">{{ tick.label }}</text>
          </g>
        }
        @for (bar of bars(); track bar.key; let i = $index) {
          <g>
            <rect class="hit" [attr.x]="bar.bandX" y="0" [attr.width]="bar.bandW" [attr.height]="plotBottom()"
                  (mouseenter)="active.set(i)" (focus)="active.set(i)" (blur)="active.set(null)" tabindex="0"
                  [attr.aria-label]="bar.point.detail ?? bar.point.label" />
            <path class="bar" [class.dim]="active() !== null && active() !== i" [attr.d]="bar.d" />
            @if (bar.showLabel) {
              <text [attr.x]="bar.cx" [attr.y]="plotBottom() + 16" class="axis" text-anchor="middle">{{ bar.point.label }}</text>
            }
          </g>
        }
        <line [attr.x1]="padL" [attr.x2]="width() - padR" [attr.y1]="plotBottom()" [attr.y2]="plotBottom()" class="base" />
      </svg>

      @if (active() !== null && bars()[active()!]; as bar) {
        <div class="tip" [style.left.px]="bar.cx" [style.top.px]="bar.y">
          <span class="tip-title">{{ bar.point.detail ?? bar.point.label }}</span>
          <strong class="num">{{ format()(bar.point.value) }}</strong>
          @if (bar.point.secondary) { <span class="tip-sub">{{ bar.point.secondary }}</span> }
        </div>
      }
    </div>

    <table class="sr-only">
      <caption>{{ ariaLabel() }}</caption>
      <thead><tr><th>Periodo</th><th>Valor</th></tr></thead>
      <tbody>
        @for (p of data(); track p.label) {
          <tr><td>{{ p.detail ?? p.label }}</td><td>{{ format()(p.value) }}</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host { display: block; }
    .chart { position: relative; }
    svg { display: block; overflow: visible; }
    .grid { stroke: var(--chart-grid); stroke-width: 1; }
    .base { stroke: var(--line-strong); stroke-width: 1; }
    .axis { fill: var(--chart-axis); font-size: 11px; font-variant-numeric: tabular-nums; }
    .bar { fill: var(--chart-1); transition: opacity var(--dur-2) var(--ease); pointer-events: none; }
    .bar.dim { opacity: 0.35; }
    .hit { fill: transparent; cursor: default; outline: none; }
    .hit:focus-visible { fill: color-mix(in srgb, var(--chart-1) 8%, transparent); }
    .tip {
      position: absolute; z-index: 2; pointer-events: none;
      transform: translate(-50%, calc(-100% - 10px));
      display: grid; gap: 2px; min-width: 120px;
      padding: 8px 10px; border-radius: 8px;
      background: var(--ink); color: var(--bg);
      box-shadow: var(--shadow-3); font-size: var(--text-xs);
      animation: fade-in var(--dur-1) var(--ease);
      white-space: nowrap;
    }
    .tip strong { font-size: var(--text-base); }
    .tip-title, .tip-sub { opacity: 0.72; }
  `,
})
export class ColumnChart {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly data = input.required<ChartPoint[]>();
  readonly height = input(240);
  readonly ariaLabel = input('Gráfico de columnas');
  readonly format = input<(value: number) => string>((value) => String(value));
  readonly tickFormat = input<(value: number) => string>((value) => String(value));

  protected readonly width = signal(640);
  protected readonly active = signal<number | null>(null);
  protected readonly padL = 48;
  protected readonly padR = 8;
  private readonly padT = 12;
  private readonly padB = 26;

  protected readonly plotBottom = computed(() => this.height() - this.padB);
  private readonly max = computed(() => niceMax(Math.max(0, ...this.data().map((p) => p.value))));

  protected readonly ticks = computed(() => {
    const max = this.max();
    const span = this.plotBottom() - this.padT;
    return [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      value: f * max,
      y: this.plotBottom() - f * span,
      label: this.tickFormat()(f * max),
    }));
  });

  protected readonly bars = computed(() => {
    const data = this.data();
    const plotW = this.width() - this.padL - this.padR;
    const bandW = data.length ? plotW / data.length : plotW;
    const barW = Math.max(4, Math.min(28, bandW * 0.56));
    const span = this.plotBottom() - this.padT;
    const every = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 44)));
    return data.map((point, i) => {
      const bandX = this.padL + i * bandW;
      const cx = bandX + bandW / 2;
      const h = this.max() ? (point.value / this.max()) * span : 0;
      const y = this.plotBottom() - h;
      const x = cx - barW / 2;
      const r = Math.min(4, barW / 2, h);
      const d =
        h <= 0
          ? ''
          : `M${x},${this.plotBottom()} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${this.plotBottom()} Z`;
      return {
        key: point.label + i,
        point,
        bandX,
        bandW,
        cx,
        y,
        d,
        showLabel: i % every === (data.length - 1) % every,
      };
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const observer = new ResizeObserver(([entry]) => {
        const next = Math.max(260, Math.floor(entry.contentRect.width));
        if (next !== this.width()) this.width.set(next);
      });
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

export interface BarItem {
  label: string;
  value: number;
  caption?: string;
}

/** Lista de barras horizontales con etiqueta y valor directo (ranking). */
@Component({
  selector: 'app-bar-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="bars" [attr.aria-label]="ariaLabel()">
      @for (item of items(); track item.label; let i = $index) {
        <li [title]="item.label + ': ' + format()(item.value)">
          <div class="meta">
            <span class="name"><span class="rank num">{{ i + 1 }}</span>{{ item.label }}</span>
            <span class="val num">{{ format()(item.value) }}</span>
          </div>
          <div class="track"><span class="fill" [style.width.%]="pct(item.value)"></span></div>
          @if (item.caption) { <span class="cap">{{ item.caption }}</span> }
        </li>
      }
    </ol>
  `,
  styles: `
    .bars { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-4); }
    li { display: grid; gap: 6px; }
    .meta { display: flex; justify-content: space-between; gap: var(--s-3); font-size: var(--text-sm); }
    .name { display: flex; gap: var(--s-2); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
    .rank { color: var(--ink-3); width: 1.4ch; flex: none; }
    .val { font-weight: 500; }
    .track { height: 6px; border-radius: 6px; background: var(--surface-sunken); overflow: hidden; }
    .fill { display: block; height: 100%; border-radius: 6px; background: var(--chart-1);
      transform-origin: left; animation: grow var(--dur-3) var(--ease) both; }
    li:hover .fill { filter: brightness(1.08); }
    .cap { font-size: var(--text-xs); color: var(--ink-3); }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  `,
})
export class BarList {
  readonly items = input.required<BarItem[]>();
  readonly ariaLabel = input('Ranking');
  readonly format = input<(value: number) => string>((value) => String(value));
  private readonly max = computed(() => Math.max(1, ...this.items().map((item) => item.value)));
  protected pct(value: number): number {
    return Math.max(2, (value / this.max()) * 100);
  }
}
