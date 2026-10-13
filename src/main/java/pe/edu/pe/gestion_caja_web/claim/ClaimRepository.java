
package pe.edu.pe.gestion_caja_web.claim;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Proporciona consultas de base de datos para los reclamos de clientes.
 */
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    /**
     * Busca los reclamos de un cliente, del mas reciente al mas antiguo.
     */
    List<Claim> findByOrderCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Comprueba si ya existe un reclamo con el codigo interno indicado.
     */
    boolean existsByInternalCode(String internalCode);
}
