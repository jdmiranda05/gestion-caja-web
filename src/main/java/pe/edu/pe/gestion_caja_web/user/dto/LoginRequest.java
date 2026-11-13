
package pe.edu.pe.gestion_caja_web.user.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Representa las credenciales enviadas por un usuario
 * para iniciar sesion mediante la API.
 */
public class LoginRequest {

    @NotBlank(message = "Ingresa tu usuario.")
    private String username;

    @NotBlank(message = "Ingresa tu contraseña.")
    private String password;

    public LoginRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
