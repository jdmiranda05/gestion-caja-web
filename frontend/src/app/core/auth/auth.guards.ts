import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from './auth.service';

/** Impide entrar a rutas privadas sin sesión: redirige al login con returnUrl. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.token()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Restringe una ruta a ciertos roles; si no coincide muestra "acceso denegado". */
export const roleGuard = (...roles: Role[]): CanActivateFn => (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  const role = auth.role();
  return role && roles.includes(role) ? true : router.createUrlTree(['/acceso-denegado']);
};

/** Evita mostrar login/registro a quien ya inició sesión. */
export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token() ? router.createUrlTree([auth.homeFor()]) : true;
};
