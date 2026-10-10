
package pe.edu.pe.gestion_caja_web.purchase;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Representa un producto y sus importes dentro de un pedido.
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    private Long productId;

    private String productName;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal lineTotal;

    /**
     * Constructor requerido por JPA para recuperar artículos guardados.
     */
    protected OrderItem() {
    }

    /**
     * Crea una línea con una copia del nombre y precio del producto comprado.
     */
    public OrderItem(
            Long productId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
    }

    /**
     * Asocia este artículo con su pedido.
     */
    public void setOrder(CustomerOrder order) {
        this.order = order;
    }

    /**
     * Devuelve el identificador del artículo.
     */
    public Long getId() {
        return id;
    }

    /**
     * Devuelve el identificador del producto comprado.
     */
    public Long getProductId() {
        return productId;
    }

    /**
     * Devuelve el nombre del producto al momento de la compra.
     */
    public String getProductName() {
        return productName;
    }

    /**
     * Devuelve la cantidad comprada.
     */
    public Integer getQuantity() {
        return quantity;
    }

    /**
     * Devuelve el precio unitario aplicado a la compra.
     */
    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    /**
     * Devuelve el importe total de esta línea.
     */
    public BigDecimal getLineTotal() {
        return lineTotal;
    }
}