package pe.edu.pe.gestion_caja_web.product.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear o actualizar un producto. Se validan con Bean Validation.
 */
public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio.")
        @Size(min = 2, max = 80, message = "El nombre debe tener entre 2 y 80 caracteres.")
        String name,

        @NotBlank(message = "La categoría es obligatoria.")
        @Size(max = 40, message = "La categoría admite como máximo 40 caracteres.")
        String category,

        @NotNull(message = "El precio es obligatorio.")
        @DecimalMin(value = "0.10", message = "El precio mínimo es S/ 0.10.")
        @DecimalMax(value = "99999.99", message = "El precio máximo es S/ 99,999.99.")
        @Digits(integer = 5, fraction = 2, message = "El precio admite hasta 2 decimales.")
        BigDecimal price,

        @NotNull(message = "El stock es obligatorio.")
        @Min(value = 0, message = "El stock no puede ser negativo.")
        @Max(value = 100000, message = "El stock máximo es 100,000 unidades.")
        Integer stock
) {
}
