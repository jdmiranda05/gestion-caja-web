package pe.edu.pe.gestion_caja_web.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Representa los datos que se reciben al registrar un usuario.
 */
public class RegisterRequest {

    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Size(min = 3, max = 30, message = "El usuario debe tener entre 3 y 30 caracteres.")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "Usa solo letras, números, punto, guion o guion bajo.")
    private String username;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "Ingresa un correo electrónico válido.")
    @Size(max = 120, message = "El correo admite como máximo 120 caracteres.")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
    private String password;

    public RegisterRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}