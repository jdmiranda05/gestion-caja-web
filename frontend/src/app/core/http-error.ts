import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from './models';

const DEFAULT_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Revisa tu conexión.',
  400: 'Hay datos inválidos en la solicitud.',
  401: 'Tu sesión no es válida o expiró.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No encontramos lo que buscabas.',
  409: 'La operación entra en conflicto con el estado actual.',
  500: 'Ocurrió un error en el servidor. Inténtalo nuevamente.',
};

/** Convierte cualquier error HTTP en un ApiError legible para la interfaz. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as Partial<ApiError> | null;
    const status = error.status;
    const message =
      (body && typeof body === 'object' && typeof body.message === 'string' && body.message) ||
      DEFAULT_MESSAGES[status] ||
      DEFAULT_MESSAGES[500];
    return {
      status,
      message,
      error: body?.error,
      path: body?.path,
      fieldErrors: body?.fieldErrors ?? {},
    };
  }
  return { status: -1, message: 'Ocurrió un error inesperado.', fieldErrors: {} };
}
