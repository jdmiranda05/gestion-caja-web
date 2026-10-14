package pe.edu.pe.gestion_caja_web.sale;

import java.math.BigDecimal;

/**
 * Resumen de ventas acumuladas por producto.
 */
public record SaleSummary(String productName, Long units, BigDecimal revenue) {
}
