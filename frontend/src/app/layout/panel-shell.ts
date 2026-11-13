import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { Icon } from '../shared/icon';
import { StatusBadge } from '../shared/status-badge';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  adminOnly?: boolean;
}

/** Layout del panel de gestión (gerente y administrador): barra lateral + contenido. */
@Component({
  selector: 'app-panel-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Brand, ThemeToggle, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.open]="drawer()">
      <aside class="sidebar" aria-label="Navegación del panel">
        <div class="side-top">
          <app-brand caption="Panel de gestión" link="/panel" />
        </div>

        <nav class="side-nav">
          @for (group of groups(); track group.title) {
            <div class="group">
              <span class="group-title">{{ group.title }}</span>
              @for (item of group.items; track item.path) {
                <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }"
                   (click)="drawer.set(false)">
                  <app-icon [name]="item.icon" [size]="17" />
                  <span>{{ item.label }}</span>
                </a>
              }
            </div>
          }
          <div class="group">
            <span class="group-title">Tienda</span>
            <a routerLink="/" (click)="drawer.set(false)"><app-icon name="store" [size]="17" /><span>Ver catálogo</span></a>
          </div>
        </nav>

        <div class="side-foot">
          <div class="me">
            <span class="avatar" aria-hidden="true">{{ initial() }}</span>
            <div class="who">
              <strong>{{ auth.username() }}</strong>
              <app-status [value]="auth.role() ?? ''" />
            </div>
          </div>
          <div class="session" title="Token JWT en memoria de sesión (enmascarado)">
            <app-icon name="key" [size]="13" />
            <span class="mono">{{ auth.maskedToken() }}</span>
          </div>
          <div class="session"><app-icon name="clock" [size]="13" /><span>Sesión hasta las {{ expires() }}</span></div>
          <div class="foot-actions">
            <app-theme-toggle />
            <button class="btn btn-ghost btn-sm grow" (click)="auth.logout()"><app-icon name="logout" />Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <div class="scrim" (click)="drawer.set(false)"></div>

      <div class="main">
        <header class="mobile-bar">
          <button class="btn btn-ghost btn-icon" (click)="drawer.set(true)" aria-label="Abrir menú"><app-icon name="menu" /></button>
          <span class="crumb">{{ title() }}</span>
          <app-theme-toggle />
        </header>
        <main id="contenido"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: `
    .shell { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); min-height: 100dvh; }
    .sidebar { position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column;
      background: var(--surface); border-right: 1px solid var(--line); }
    .side-top { padding: var(--s-5) var(--s-5) var(--s-4); }
    .side-nav { flex: 1; overflow-y: auto; padding: var(--s-2) var(--s-3); display: grid; align-content: start; gap: var(--s-5); }
    .group { display: grid; gap: 2px; }
    .group-title { padding: 0 var(--s-3) var(--s-1); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); }
    .side-nav a { position: relative; display: flex; align-items: center; gap: var(--s-3); height: 36px; padding: 0 var(--s-3);
      border-radius: var(--r-sm); color: var(--ink-2); font-weight: 500; text-decoration: none;
      transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease); }
    .side-nav a:hover { background: var(--surface-sunken); color: var(--ink); }
    .side-nav a.active { background: var(--brand-softer); color: var(--brand-ink); }
    .side-nav a.active::before { content: ''; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: var(--brand); }
    .side-foot { display: grid; gap: var(--s-2); padding: var(--s-4); border-top: 1px solid var(--line); }
    .me { display: flex; align-items: center; gap: var(--s-3); }
    .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-ink); font-weight: 600; text-transform: uppercase; }
    .who { display: grid; gap: 2px; justify-items: start; }
    .who strong { font-size: var(--text-sm); }
    .session { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ink-3); }
    .foot-actions { display: flex; gap: var(--s-1); margin-top: var(--s-1); }
    .main { min-width: 0; }
    .mobile-bar { display: none; }
    .scrim { display: none; }
    @media (max-width: 960px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: fixed; z-index: 40; left: 0; width: min(300px, 86vw); transform: translateX(-100%);
        transition: transform var(--dur-3) var(--ease); box-shadow: var(--shadow-3); }
      .open .sidebar { transform: none; }
      .scrim { position: fixed; inset: 0; z-index: 30; background: var(--overlay); opacity: 0; pointer-events: none; transition: opacity var(--dur-3) var(--ease); display: block; }
      .open .scrim { opacity: 1; pointer-events: auto; }
      .mobile-bar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: var(--s-2);
        height: 56px; padding: 0 var(--s-2); background: color-mix(in srgb, var(--bg) 90%, transparent);
        backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
      .crumb { flex: 1; font-weight: 600; }
    }
  `,
})
export class PanelShell {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly drawer = signal(false);

  private readonly items: { title: string; items: NavItem[] }[] = [
    { title: 'General', items: [{ path: '/panel', label: 'Resumen', icon: 'chart', exact: true }] },
    {
      title: 'Operación',
      items: [
        { path: '/panel/caja', label: 'Caja', icon: 'cash' },
        { path: '/panel/productos', label: 'Productos', icon: 'box' },
        { path: '/panel/reclamos', label: 'Reclamos', icon: 'message' },
      ],
    },
    {
      title: 'Administración',
      items: [
        { path: '/panel/solicitudes', label: 'Solicitudes', icon: 'shield' },
        { path: '/panel/usuarios', label: 'Usuarios y roles', icon: 'users', adminOnly: true },
      ],
    },
  ];

  protected readonly groups = computed(() =>
    this.items.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || this.auth.isAdmin()),
    })),
  );

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly title = computed(() => {
    const url = this.url();
    const all = this.items.flatMap((group) => group.items);
    const match = [...all].sort((a, b) => b.path.length - a.path.length).find((item) => url.startsWith(item.path));
    return match?.label ?? 'Panel';
  });

  protected readonly expires = computed(() => {
    const at = this.auth.expiresAt();
    return at ? new Date(at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';
  });

  protected initial(): string {
    return (this.auth.username() ?? '?').charAt(0);
  }
}
