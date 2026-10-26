package pe.edu.pe.gestion_caja_web.claim.dto;

import pe.edu.pe.gestion_caja_web.claim.model.ClaimStatus;

/**
 * Datos enviados por el personal para resolver o rechazar un reclamo.
 */
public record ClaimResolutionRequest(
        ClaimStatus status,
        String response
) {
}