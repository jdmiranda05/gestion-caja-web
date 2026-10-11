package pe.edu.pe.gestion_caja_web.claim;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Proporciona consultas de base de datos para los reclamos de clientes.
 */
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    /**
     * Busca los reclamos de un cliente, del más reciente al más antiguo.
     */
    List<Claim> findByOrderCustomerIdOrderByCreatedAtDesc(Long customerId);
}