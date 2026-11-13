import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Brand } from '../../layout/brand';
import { ThemeToggle } from '../../layout/theme-toggle';

/** Marco de las pantallas de acceso: formulario a la izquierda y ticket ilustrativo a la derecha. */
@Component({
  selector: 'app-auth-layout',
  imports: [Brand, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth">
      <section class="form-side">
        <div class="head">
          <app-brand />
          <app-theme-toggle />
        </div>
        <main id="contenido" class="form-wrap enter">
          <h1>{{ title() }}</h1>
          <p class="lead">{{ lead() }}</p>
          <ng-content />
        </main>
        <p class="legal">Tus datos viajan cifrados y la sesión expira automáticamente.</p>
      </section>

      <aside class="art" aria-hidden="true">
        <div class="ticket">
          <div class="t-head">
            <strong>ALONDRALU</strong>
            <span>Bodega de barrio · Lima</span>
          </div>
          <div class="t-meta"><span>Boleta</span><span class="mono">B001-000128</span></div>
          <div class="t-rows">
            <div><span>Leche entera ×2</span><span class="mono">8.00</span></div>
            <div><span>Pan francés ×6</span><span class="mono">3.00</span></div>
            <div><span>Queso fresco ×1</span><span class="mono">8.50</span></div>
            <div><span>Yogur natural ×1</span><span class="mono">3.50</span></div>
          </div>
          <div class="t-total"><span>Total</span><span class="mono">S/ 23.00</span></div>
          <div class="t-foot">Gracias por su compra</div>
        </div>
        <blockquote>
          <p>Caja, inventario y pedidos de tu bodega en un solo lugar.</p>
        </blockquote>
      </aside>
    </div>
  `,
  styles: `
    .auth { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 100dvh; }
    .form-side { display: flex; flex-direction: column; padding: var(--s-6) var(--s-8); }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .form-wrap { width: 100%; max-width: 380px; margin: auto; padding: var(--s-10) 0; }
    h1 { font-size: 1.75rem; letter-spacing: -0.025em; }
    .lead { margin: var(--s-2) 0 var(--s-8); color: var(--ink-3); }
    .legal { font-size: var(--text-xs); color: var(--ink-3); text-align: center; }
    .art { position: relative; display: grid; place-items: center; align-content: center; gap: var(--s-10); padding: var(--s-10);
      background: var(--brand); overflow: hidden; }
    .art::before { content: ''; position: absolute; inset: 0;
      background-image: repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 28px, transparent 28px 56px); }
    .art::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 18px;
      background: radial-gradient(circle at 14px 0, var(--bg) 13px, transparent 14px) 0 0 / 28px 18px repeat-x; }
    .ticket { position: relative; width: 300px; padding: var(--s-6) var(--s-5) var(--s-5); background: #fffdf8; color: #1c1f1d;
      border-radius: 4px; box-shadow: 0 30px 60px rgb(0 0 0 / 0.25); transform: rotate(-2.5deg);
      font-size: 13px; animation: ticket-in 600ms var(--ease) both 120ms; }
    .ticket::after { content: ''; position: absolute; left: 0; right: 0; bottom: -8px; height: 8px;
      background: linear-gradient(-45deg, transparent 6px, #fffdf8 0) 0 0 / 12px 8px, linear-gradient(45deg, transparent 6px, #fffdf8 0) 0 0 / 12px 8px; }
    .t-head { display: grid; text-align: center; gap: 2px; padding-bottom: var(--s-3); border-bottom: 1px dashed #c9c5ba; }
    .t-head strong { letter-spacing: 0.2em; font-size: 14px; }
    .t-head span, .t-foot, .t-meta { color: #6d706c; font-size: 11px; }
    .t-meta { display: flex; justify-content: space-between; padding: var(--s-3) 0; }
    .t-rows { display: grid; gap: 6px; padding-bottom: var(--s-3); border-bottom: 1px dashed #c9c5ba; }
    .t-rows div, .t-total { display: flex; justify-content: space-between; }
    .t-total { padding: var(--s-3) 0; font-weight: 700; font-size: 15px; }
    .t-foot { text-align: center; }
    blockquote { position: relative; margin: 0; max-width: 320px; color: rgb(255 255 255 / 0.92); font-size: var(--text-lg);
      font-weight: 500; line-height: 1.35; text-align: center; letter-spacing: -0.01em; }
    @keyframes ticket-in { from { opacity: 0; transform: translateY(24px) rotate(-6deg); } to { opacity: 1; transform: rotate(-2.5deg); } }
    @media (max-width: 900px) {
      .auth { grid-template-columns: 1fr; }
      .art { display: none; }
      .form-side { padding: var(--s-4); }
      .form-wrap { padding: var(--s-8) 0; }
    }
  `,
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly lead = input('');
}
