
package pe.edu.pe.gestion_caja_web.purchase.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.pe.gestion_caja_web.purchase.model.CustomerOrder;

/**
 * Proporciona operaciones de base de datos para los pedidos de clientes.
 */
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    /**
     * Busca los pedidos de un cliente por su identificador, del más reciente al más antiguo.
     */
    List<CustomerOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}