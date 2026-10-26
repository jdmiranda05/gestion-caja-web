package pe.edu.pe.gestion_caja_web.user.dto;

import pe.edu.pe.gestion_caja_web.user.model.Role;

/**
 * Datos para cambiar el rol de un usuario.
 */
public record RoleRequest(Role role) {
}
