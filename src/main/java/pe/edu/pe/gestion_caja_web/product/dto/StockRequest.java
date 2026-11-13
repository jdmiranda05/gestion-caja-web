package pe.edu.pe.gestion_caja_web.product.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Datos para reponer stock de un producto.
 */
public record StockRequest(
        @NotNull(message = "Indica cuántas unidades vas a reponer.")
        @Min(value = 1, message = "Las unidades deben ser mayores que cero.")
        @Max(value = 10000, message = "Puedes reponer como máximo 10,000 unidades por vez.")
        Integer units) {
}
