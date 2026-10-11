package pe.edu.pe.gestion_caja_web.claim;

import java.time.LocalDateTime;

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
        LocalDateTime updatedAt) {
}