package pe.edu.pe.gestion_caja_web.claim;

import java.time.LocalDateTime;

/**
 * Representa una accion registrada en el historial de un reclamo.
 */
public record ClaimAuditResponse(
        Long id,
        Long actorUserId,
        String previousStatus,
        String newStatus,
        String action,
        String details,
        LocalDateTime createdAt
) {
}