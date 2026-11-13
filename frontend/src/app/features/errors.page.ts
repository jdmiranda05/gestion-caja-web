import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { EmptyState } from '../shared/states';

@Component({
  selector: 'app-not-found-page',
  imports: [EmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="card">
        <app-empty-state icon="search" title="No encontramos esta página"
          description="El enlace puede estar mal escrito o la página ya no existe.">
          <a class="btn btn-primary" routerLink="/">Volver al catálogo</a>
        </app-empty-state>
      </div>
    </div>
  `,
})
export class NotFoundPage {}

@Component({
  selector: 'app-forbidden-page',
  imports: [EmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="card">
        <app-empty-state icon="lock" title="No tienes acceso a esta sección"
          description="Tu rol actual no tiene permisos para ver esta página. Si crees que es un error, contacta al administrador.">
          <a class="btn btn-primary" [routerLink]="auth.homeFor()">Ir a mi inicio</a>
          <button class="btn" (click)="auth.logout()">Cambiar de cuenta</button>
        </app-empty-state>
      </div>
    </div>
  `,
})
export class ForbiddenPage {
  protected readonly auth = inject(AuthService);
}
