package pe.edu.pe.gestion_caja_web.purchase.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Representa los productos y las cantidades solicitadas en una compra.
 */
public record PurchaseRequest(
        @NotEmpty(message = "El carrito está vacío.")
        List<@Valid Item> items) {

    /**
     * Representa un producto solicitado y su cantidad.
     */
    public record Item(
            @NotNull(message = "Producto obligatorio.")
            Long productId,

            @NotNull(message = "Cantidad obligatoria.")
            @Min(value = 1, message = "La cantidad mínima es 1.")
            @Max(value = 99, message = "La cantidad máxima por producto es 99.")
            Integer quantity) {
    }
}
