package pe.edu.pe.gestion_caja_web.user.dto;

import jakarta.validation.constraints.NotNull;
import pe.edu.pe.gestion_caja_web.user.model.Role;

/**
 * Datos para cambiar el rol de un usuario.
 */
public record RoleRequest(@NotNull(message = "El rol es obligatorio.") Role role) {
}
