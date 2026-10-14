package pe.edu.pe.gestion_caja_web.claim;

import java.time.LocalDateTime;

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
