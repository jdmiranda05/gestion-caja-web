package pe.edu.pe.gestion_caja_web.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import pe.edu.pe.gestion_caja_web.claim.model.ClaimStatus;

/**
 * Datos enviados por el personal para resolver o rechazar un reclamo.
 */
public record ClaimResolutionRequest(
        @NotNull(message = "Indica si el reclamo se resuelve o se rechaza.")
        ClaimStatus status,

        @NotBlank(message = "Escribe una respuesta para el cliente.")
        @Size(max = 1000, message = "La respuesta admite como máximo 1000 caracteres.")
        String response
) {
}
