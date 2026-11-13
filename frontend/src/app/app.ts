import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ThemeService } from './core/theme.service';
import { ConfirmDialog, Toaster } from './shared/overlays';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toaster, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    @if (navigating()) { <div class="route-progress" aria-hidden="true"></div> }
    <router-outlet />
    <app-toaster />
    <app-confirm-dialog />
  `,
  styles: `
    .skip { position: absolute; left: -999px; top: 8px; z-index: 200; padding: 8px 12px; border-radius: 6px; background: var(--ink); color: var(--bg); }
    .skip:focus { left: 8px; }
    .route-progress { position: fixed; z-index: 300; top: 0; left: 0; height: 2px; width: 100%; background: var(--brand);
      transform-origin: left; animation: progress 1.2s var(--ease) forwards; }
    @keyframes progress { from { transform: scaleX(0); } to { transform: scaleX(0.85); } }
  `,
})
export class App {
  private readonly router = inject(Router);
  constructor() {
    inject(ThemeService);
  }
  protected readonly navigating = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd),
      map((event) => event instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}
