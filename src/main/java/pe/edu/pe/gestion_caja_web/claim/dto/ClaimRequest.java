package pe.edu.pe.gestion_caja_web.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Contiene los datos enviados para registrar un reclamo.
 */
public record ClaimRequest(
        @NotNull(message = "Selecciona el pedido.")
        Long orderId,

        @NotNull(message = "Selecciona el producto del pedido.")
        Long orderItemId,

        @NotBlank(message = "Indica el motivo del reclamo.")
        @Size(max = 80, message = "El motivo admite como máximo 80 caracteres.")
        String reason,

        @NotBlank(message = "Describe lo que ocurrió.")
        @Size(min = 10, max = 1000, message = "La descripción debe tener entre 10 y 1000 caracteres.")
        String description) {
}
