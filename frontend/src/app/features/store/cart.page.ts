import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PurchaseApi } from '../../core/api';
import { AuthService } from '../../core/auth/auth.service';
import { CartService, MAX_PER_ITEM } from '../../core/cart.service';
import { toApiError } from '../../core/http-error';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';
import { SolesPipe } from '../../shared/pipes';
import { EmptyState } from '../../shared/states';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, Icon, EmptyState, SolesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <span class="eyebrow">Tu pedido</span>
          <h1>Carrito</h1>
          <p>Revisa cantidades antes de confirmar. Pagas al recoger en la bodega.</p>
        </div>
      </header>

      @if (cart.lines().length === 0) {
        <div class="card">
          <app-empty-state icon="cart" title="Tu carrito está vacío"
            description="Agrega productos desde el catálogo y aparecerán aquí.">
            <a class="btn btn-primary" routerLink="/">Ir al catálogo</a>
          </app-empty-state>
        </div>
      } @else {
        <div class="grid-main-aside">
          <section class="card">
            <ul class="lines">
              @for (line of cart.lines(); track line.product.id) {
                <li class="line">
                  <div class="info">
                    <span class="cat">{{ line.product.category }}</span>
                    <strong>{{ line.product.name }}</strong>
                    <span class="unit num">{{ line.product.price | soles }} c/u</span>
                  </div>
                  <div class="qty" role="group" [attr.aria-label]="'Cantidad de ' + line.product.name">
                    <button class="btn btn-sm btn-icon" (click)="cart.setQuantity(line.product.id, line.quantity - 1)" aria-label="Quitar uno">
                      <app-icon name="minus" />
                    </button>
                    <span class="num">{{ line.quantity }}</span>
                    <button class="btn btn-sm btn-icon" [disabled]="line.quantity >= max(line.product.stock)"
                            (click)="cart.setQuantity(line.product.id, line.quantity + 1)" aria-label="Agregar uno">
                      <app-icon name="plus" />
                    </button>
                  </div>
                  <strong class="subtotal num">{{ line.quantity * line.product.price | soles }}</strong>
                  <button class="btn btn-ghost btn-icon btn-sm remove" (click)="cart.remove(line.product.id)"
                          [attr.aria-label]="'Quitar ' + line.product.name">
                    <app-icon name="trash" />
                  </button>
                </li>
              }
            </ul>
            <div class="card-footer">
              <button class="btn btn-ghost btn-sm" (click)="cart.clear()">Vaciar carrito</button>
              <a routerLink="/">Seguir comprando</a>
            </div>
          </section>

          <aside class="card summary sticky-aside">
            <div class="card-body stack">
              <h2>Resumen</h2>
              <dl>
                <div><dt>Productos</dt><dd class="num">{{ cart.count() }}</dd></div>
                <div><dt>Subtotal</dt><dd class="num">{{ cart.total() | soles }}</dd></div>
                <div class="total"><dt>Total</dt><dd class="num">{{ cart.total() | soles }}</dd></div>
              </dl>

              @if (error()) {
                <div class="alert alert-danger" role="alert">
                  <app-icon name="alert-circle" [size]="18" />
                  <div><strong>No se pudo confirmar</strong>{{ error() }}</div>
                </div>
              }

              @if (!auth.isAuthenticated()) {
                <a class="btn btn-primary btn-lg btn-block" routerLink="/login" [queryParams]="{ returnUrl: '/carrito' }">
                  Inicia sesión para confirmar
                </a>
                <p class="note">¿Eres nuevo? <a routerLink="/registro">Crea tu cuenta</a> en un minuto.</p>
              } @else if (!auth.isCustomer()) {
                <div class="alert alert-info"><app-icon name="info" [size]="18" />
                  <div>Las compras en línea son solo para cuentas de cliente.</div></div>
              } @else {
                <button class="btn btn-primary btn-lg btn-block" [disabled]="placing()" (click)="checkout()">
                  @if (placing()) { <span class="spinner"></span> Confirmando… } @else { Confirmar pedido }
                </button>
                <p class="note">El stock se reserva al confirmar.</p>
              }
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `
    .lines { list-style: none; margin: 0; padding: 0; }
    .line { display: grid; grid-template-columns: minmax(0, 1fr) auto 96px auto; align-items: center; gap: var(--s-4);
      padding: var(--s-4) var(--s-5); border-bottom: 1px solid var(--line); animation: fade-up var(--dur-2) var(--ease); }
    .line:last-child { border-bottom: 0; }
    .info { display: grid; gap: 2px; min-width: 0; }
    .cat { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-3); }
    .unit { font-size: var(--text-xs); color: var(--ink-3); }
    .qty { display: inline-flex; align-items: center; gap: 4px; }
    .qty span { min-width: 28px; text-align: center; font-weight: 600; }
    .subtotal { text-align: right; }
    .remove:hover { color: var(--danger); }
    .summary h2 { font-size: var(--text-md); }
    dl { display: grid; gap: var(--s-2); margin: 0; }
    dl div { display: flex; justify-content: space-between; color: var(--ink-2); }
    dd { margin: 0; }
    .total { padding-top: var(--s-3); margin-top: var(--s-1); border-top: 1px solid var(--line); color: var(--ink); font-size: var(--text-lg); font-weight: 600; }
    .note { text-align: center; font-size: var(--text-xs); color: var(--ink-3); }
    @media (max-width: 640px) {
      .line { grid-template-columns: 1fr auto; grid-template-areas: 'info remove' 'qty subtotal'; row-gap: var(--s-3); padding: var(--s-4); }
      .info { grid-area: info; } .qty { grid-area: qty; } .subtotal { grid-area: subtotal; } .remove { grid-area: remove; }
    }
  `,
})
export class CartPage {
  private readonly purchases = inject(PurchaseApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly placing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected max(stock: number): number {
    return Math.min(stock, MAX_PER_ITEM);
  }

  checkout(): void {
    this.error.set(null);
    this.placing.set(true);
    const items = this.cart.lines().map((line) => ({ productId: line.product.id, quantity: line.quantity }));
    this.purchases.place(items).subscribe({
      next: (order) => {
        this.placing.set(false);
        this.cart.clear();
        this.toast.ok(`Pedido #${order.id} confirmado`, 'Puedes seguirlo en “Mis pedidos”.');
        void this.router.navigate(['/pedidos'], { queryParams: { nuevo: order.id } });
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(toApiError(err).message);
      },
    });
  }
}
