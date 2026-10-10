
package pe.edu.pe.gestion_caja_web.purchase;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Proporciona operaciones de base de datos para los artículos de los pedidos.
 */
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}