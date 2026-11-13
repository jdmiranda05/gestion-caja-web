package pe.edu.pe.gestion_caja_web.common;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/**
 * Respuestas JSON para 401 (sin sesión o token inválido) y 403 (sin permisos)
 * generadas por la cadena de filtros de Spring Security.
 */
public final class JsonSecurityHandlers {

    private static final JsonMapper MAPPER = JsonMapper.builder().findAndAddModules().build();

    private JsonSecurityHandlers() {
    }

    /** 401: falta el token, expiró o la cuenta fue desactivada. */
    public static AuthenticationEntryPoint unauthorized() {
        return (request, response, exception) -> write(response, request, HttpStatus.UNAUTHORIZED,
                "Tu sesión no es válida o expiró. Inicia sesión nuevamente.");
    }

    /** 403: el token es válido pero el rol no tiene permiso. */
    public static AccessDeniedHandler forbidden() {
        return (request, response, exception) -> write(response, request, HttpStatus.FORBIDDEN,
                "No tienes permisos para acceder a este recurso.");
    }

    private static void write(HttpServletResponse response, HttpServletRequest request,
            HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        if (status == HttpStatus.UNAUTHORIZED) {
            response.setHeader("WWW-Authenticate", "Bearer");
        }
        MAPPER.writeValue(response.getOutputStream(),
                ApiErrorResponse.of(status.value(), status.getReasonPhrase(), message, request.getRequestURI()));
    }
}
