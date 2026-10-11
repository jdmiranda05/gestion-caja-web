package pe.edu.pe.gestion_caja_web.claim;

/**
 * Contiene los datos enviados para registrar un reclamo.
 */
public record ClaimRequest(
        Long orderId,
        Long orderItemId,
        String reason,
        String description) {
}