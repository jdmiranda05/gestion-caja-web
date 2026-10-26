package pe.edu.pe.gestion_caja_web.sale.dto;

public record SaleRequest(Long productId, Integer quantity, String customerName) {
}
