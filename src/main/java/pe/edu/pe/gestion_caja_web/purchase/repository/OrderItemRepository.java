
package pe.edu.pe.gestion_caja_web.purchase.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.pe.gestion_caja_web.purchase.model.OrderItem;

/**
 * Proporciona operaciones de base de datos para los artículos de los pedidos.
 */
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}