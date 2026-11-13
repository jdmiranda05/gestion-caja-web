package pe.edu.pe.gestion_caja_web.common;

import java.time.Instant;
import java.util.Map;

/**
 * Formato único de error que devuelve toda la API.
 * El frontend lo usa para mostrar mensajes claros y marcar los campos inválidos.
 *
 * @param status      código HTTP (400, 401, 403, 404, 409, 500)
 * @param error       nombre corto del estado HTTP
 * @param message     mensaje legible para el usuario
 * @param path        ruta solicitada
 * @param timestamp   instante en el que ocurrió el error
 * @param fieldErrors errores por campo cuando falla la validación (puede ser vacío)
 */
public record ApiErrorResponse(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        Map<String, String> fieldErrors) {

    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(status, error, message, path, Instant.now(), Map.of());
    }
}
