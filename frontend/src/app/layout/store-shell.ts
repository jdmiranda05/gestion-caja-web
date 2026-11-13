import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { CartService } from '../core/cart.service';
import { Icon } from '../shared/icon';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';

/** Layout de la tienda (público y clientes): barra superior + contenido. */
@Component({
  selector: 'app-store-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Brand, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <div class="inner">
        <app-brand caption="Bodega de barrio" />

        <nav class="nav" aria-label="Principal">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Catálogo</a>
          @if (auth.isCustomer()) {
            <a routerLink="/pedidos" routerLinkActive="active">Mis pedidos</a>
            <a routerLink="/reclamos" routerLinkActive="active">Reclamos</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/panel">Panel de gestión</a>
          }
        </nav>

        <div class="end">
          <app-theme-toggle />
          @if (!auth.isStaff()) {
            <a class="btn btn-ghost cart" routerLink="/carrito" aria-label="Carrito">
              <app-icon name="cart" />
              <span class="hide-sm">Carrito</span>
              @if (cart.count() > 0) {
                <span class="count num" aria-label="productos en el carrito">{{ cart.count() }}</span>
              }
            </a>
          }
          @if (auth.isAuthenticated()) {
            <div class="user">
              <span class="avatar" aria-hidden="true">{{ initial() }}</span>
              <span class="hide-sm uname">{{ auth.username() }}</span>
              <button class="btn btn-ghost btn-icon btn-sm" (click)="auth.logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
                <app-icon name="logout" />
              </button>
            </div>
          } @else {
            <a class="btn btn-ghost hide-sm" routerLink="/registro">Crear cuenta</a>
            <a class="btn btn-primary" routerLink="/login">Ingresar</a>
          }
          <button class="btn btn-ghost btn-icon menu-btn" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-label="Menú">
            <app-icon [name]="menu() ? 'x' : 'menu'" />
          </button>
        </div>
      </div>
      @if (menu()) {
        <nav class="mobile-nav" (click)="menu.set(false)" aria-label="Menú móvil">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Catálogo</a>
          @if (auth.isCustomer()) {
            <a routerLink="/pedidos" routerLinkActive="active">Mis pedidos</a>
            <a routerLink="/reclamos" routerLinkActive="active">Reclamos</a>
          }
          @if (auth.isStaff()) { <a routerLink="/panel">Panel de gestión</a> }
          @if (!auth.isAuthenticated()) { <a routerLink="/registro">Crear cuenta</a> }
        </nav>
      }
    </header>

    <main id="contenido">
      <router-outlet />
    </main>

    <footer class="foot">
      <div class="inner">
        <span>© {{ year }} Tienda Alondralu</span>
        <span class="muted">Pagos al recoger · Lima, Perú</span>
      </div>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    .topbar { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--line); }
    .inner { display: flex; align-items: center; gap: var(--s-6); max-width: var(--content-max); margin: 0 auto;
      padding: 0 var(--s-8); height: var(--topbar-h); }
    .nav { display: flex; gap: var(--s-1); flex: 1; }
    .nav a, .mobile-nav a { padding: 6px var(--s-3); border-radius: var(--r-sm); color: var(--ink-2); font-weight: 500; text-decoration: none;
      transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease); }
    .nav a:hover { background: var(--surface-sunken); color: var(--ink); }
    .nav a.active { color: var(--ink); background: var(--surface-sunken); }
    .end { display: flex; align-items: center; gap: var(--s-2); }
    .cart { position: relative; }
    .count { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px;
      background: var(--brand); color: #fff; font-size: 11px; font-weight: 600; animation: pop-in var(--dur-2) var(--ease); }
    .user { display: flex; align-items: center; gap: var(--s-2); padding-left: var(--s-2); margin-left: var(--s-1); border-left: 1px solid var(--line); }
    .avatar { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--brand-soft);
      color: var(--brand-ink); font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .uname { font-weight: 500; font-size: var(--text-sm); }
    .menu-btn { display: none; }
    .mobile-nav { display: grid; padding: var(--s-2) var(--s-4) var(--s-4); border-top: 1px solid var(--line); animation: fade-up var(--dur-2) var(--ease); }
    .mobile-nav a { padding: var(--s-3); }
    .mobile-nav a.active { background: var(--surface-sunken); color: var(--ink); }
    main { flex: 1; }
    .foot { border-top: 1px solid var(--line); font-size: var(--text-sm); color: var(--ink-2); }
    .foot .inner { justify-content: space-between; height: 64px; }
    @media (max-width: 900px) {
      .inner { padding: 0 var(--s-4); gap: var(--s-3); }
      .nav { display: none; }
      .end { margin-left: auto; }
      .menu-btn { display: inline-flex; }
      .hide-sm { display: none; }
      .foot .inner { flex-direction: column; justify-content: center; gap: 2px; height: 80px; }
    }
  `,
})
export class StoreShell {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly menu = signal(false);
  protected readonly year = new Date().getFullYear();
  protected initial(): string {
    return (this.auth.username() ?? '?').charAt(0);
  }
}
