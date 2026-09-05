package pe.edu.pe.gestion_caja_web.sale;

public record SaleRequest(Long productId, Integer quantity, String customerName) {
}
