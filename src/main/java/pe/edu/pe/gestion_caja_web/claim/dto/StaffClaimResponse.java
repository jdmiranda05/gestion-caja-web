package pe.edu.pe.gestion_caja_web.claim.dto;

import java.time.LocalDateTime;

import pe.edu.pe.gestion_caja_web.claim.model.ClaimStatus;

/**
 * Datos de un reclamo visibles solo para el personal autorizado.
 */
public record StaffClaimResponse(
        Long id,
        String internalCode,
        Long orderId,
        Long orderItemId,
        String productName,
        String reason,
        String description,
        ClaimStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
