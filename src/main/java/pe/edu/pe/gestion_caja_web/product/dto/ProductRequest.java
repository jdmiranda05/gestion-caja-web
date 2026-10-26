package pe.edu.pe.gestion_caja_web.product.dto;

import java.math.BigDecimal;

public record ProductRequest(
        String name,
        String category,
        BigDecimal price,
        Integer stock
) {
}
