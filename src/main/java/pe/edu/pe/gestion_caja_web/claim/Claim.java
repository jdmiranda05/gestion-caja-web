package pe.edu.pe.gestion_caja_web.claim;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import pe.edu.pe.gestion_caja_web.purchase.CustomerOrder;
import pe.edu.pe.gestion_caja_web.purchase.OrderItem;

/**
 * Representa un reclamo asociado a un pedido y a un artículo comprado.
 */
@Entity
@Table(name = "customer_claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
    * Código interno del reclamo, visible solo para MANAGER y ADMIN.
    */
    @Column(name = "internal_code", length = 20, unique = true)
    private String internalCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(nullable = false, length = 80)
    private String reason;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClaimStatus status = ClaimStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Constructor requerido por JPA.
     */
    protected Claim() {
    }

    /**
     * Crea un reclamo pendiente para un artículo de un pedido.
     */
    public Claim(
            CustomerOrder order,
            OrderItem orderItem,
            String reason,
            String description) {
        this.order = order;
        this.orderItem = orderItem;
        this.reason = reason;
        this.description = description;
        this.status = ClaimStatus.PENDING;
    }

    /**
     * Registra las fechas al crear el reclamo.
     */
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        this.createdAt = now;
        this.updatedAt = now;
    }

    /**
     * Actualiza la fecha cuando cambia el reclamo.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }
    /**
    * Devuelve el codigo interno de seguimiento del reclamo.
    */
    public String getInternalCode() {
        return internalCode;
    }

/**
 * Asigna el codigo interno generado por el servidor.
 */
    public void setInternalCode(String internalCode) {
        if (internalCode == null || !internalCode.matches("REC-[A-Z0-9]{6}")) {
            throw new IllegalArgumentException(
                "El codigo interno del reclamo no tiene un formato valido.");
        }

        this.internalCode = internalCode;
    }

    public CustomerOrder getOrder() {
        return order;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public String getReason() {
        return reason;
    }

    public String getDescription() {
        return description;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Permite actualizar el estado desde la lógica interna del servidor.
     */
    public void setStatus(ClaimStatus status) {
        this.status = status;
    }
}