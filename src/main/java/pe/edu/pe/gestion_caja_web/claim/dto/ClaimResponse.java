package pe.edu.pe.gestion_caja_web.claim.dto;

import java.time.LocalDateTime;

import pe.edu.pe.gestion_caja_web.claim.model.ClaimStatus;

/**
 * Representa los datos de un reclamo que puede consultar el cliente.
 */
public record ClaimResponse(
        Long id,
        Long orderId,
        Long orderItemId,
        String productName,
        String reason,
        String description,
        ClaimStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String staffResponse,
        LocalDateTime respondedAt) {
}