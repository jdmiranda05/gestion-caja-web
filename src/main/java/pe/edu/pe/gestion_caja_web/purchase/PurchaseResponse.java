
package pe.edu.pe.gestion_caja_web.purchase;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Representa los datos públicos de una compra confirmada.
 */
public record PurchaseResponse(
        Long id,
        LocalDateTime createdAt,
        BigDecimal total,
        List<Item> items) {

    /**
     * Representa el detalle de un producto dentro de una compra.
     */
    public record Item(
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
    }
}