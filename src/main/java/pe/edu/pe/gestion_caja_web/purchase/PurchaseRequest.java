
package pe.edu.pe.gestion_caja_web.purchase;

import java.util.List;

/**
 * Representa los productos y las cantidades solicitadas en una compra.
 */
public record PurchaseRequest(List<Item> items) {

    /**
     * Representa un producto solicitado y su cantidad.
     */
    public record Item(Long productId, Integer quantity) {
    }
}