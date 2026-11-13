package pe.edu.pe.gestion_caja_web.user.dto;

import java.time.Instant;

import pe.edu.pe.gestion_caja_web.user.model.Role;

/**
 * Respuesta de una autenticación JWT exitosa.
 * Incluye el usuario, el rol y la expiración para que el frontend
 * configure la sesión sin tener que decodificar el token.
 */
public class LoginResponse {

    private final String token;
    private final String tokenType;
    private final String username;
    private final Role role;
    private final Instant expiresAt;

    public LoginResponse(String token, String username, Role role, Instant expiresAt) {
        this.token = token;
        this.tokenType = "Bearer";
        this.username = username;
        this.role = role;
        this.expiresAt = expiresAt;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public String getUsername() {
        return username;
    }

    public Role getRole() {
        return role;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
