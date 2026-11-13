import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../toast.service';
import { AuthService } from './auth.service';

/**
 * Interceptor HTTP:
 *  1. Adjunta "Authorization: Bearer <token>" a todas las llamadas a /api.
 *  2. Ante un 401 cierra la sesión y lleva al login conservando la ruta.
 *  3. Ante un 403 avisa que el rol no tiene permisos.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isApi = request.url.startsWith('/api/');
  const isLogin = request.url.endsWith('/api/users/login');
  const token = auth.token();

  const authorized =
    isApi && token && !isLogin
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isApi && !isLogin) {
        if (error.status === 401 && token) {
          toast.warn('Tu sesión expiró', 'Inicia sesión nuevamente para continuar.');
          auth.handleUnauthorized(router.url);
        } else if (error.status === 403) {
          toast.error('Acceso denegado (403)', 'Tu rol no tiene permisos para esta acción.');
        } else if (error.status === 0) {
          toast.error('Sin conexión', 'No se pudo contactar al servidor.');
        }
      }
      return throwError(() => error);
    }),
  );
};
