package pe.edu.pe.gestion_caja_web.sale.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Venta registrada en caja.
 */
public record SaleRequest(
        @NotNull(message = "Selecciona un producto.")
        Long productId,

        @NotNull(message = "La cantidad es obligatoria.")
        @Min(value = 1, message = "La cantidad mínima es 1.")
        @Max(value = 999, message = "La cantidad máxima por venta es 999.")
        Integer quantity,

        @Size(max = 80, message = "El nombre del cliente admite como máximo 80 caracteres.")
        String customerName) {
}
