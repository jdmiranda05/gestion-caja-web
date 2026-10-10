
package pe.edu.pe.gestion_caja_web.purchase;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import pe.edu.pe.gestion_caja_web.user.User;

/**
 * Representa un pedido realizado por un cliente autenticado.
 */
@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    private LocalDateTime createdAt;

    private BigDecimal total = BigDecimal.ZERO;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    /**
     * Constructor requerido por JPA para recuperar pedidos de la base de datos.
     */
    protected CustomerOrder() {
    }

    /**
     * Crea un pedido asociado al cliente autenticado y registra su fecha.
     */
    public CustomerOrder(User customer) {
        this.customer = customer;
        this.createdAt = LocalDateTime.now();
        this.total = BigDecimal.ZERO;
    }

    /**
     * Agrega un artículo al pedido y actualiza el total acumulado.
     */
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
        total = total.add(item.getLineTotal());
    }

    /**
     * Devuelve el identificador único del pedido.
     */
    public Long getId() {
        return id;
    }

    /**
     * Devuelve el cliente propietario del pedido.
     */
    public User getCustomer() {
        return customer;
    }

    /**
     * Devuelve la fecha y hora de creación del pedido.
     */
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    /**
     * Devuelve el importe total del pedido.
     */
    public BigDecimal getTotal() {
        return total;
    }

    /**
     * Devuelve los artículos incluidos en el pedido.
     */
    public List<OrderItem> getItems() {
        return items;
    }
}