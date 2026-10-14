package pe.edu.pe.gestion_caja_web.claim;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Proporciona consultas de base de datos para los reclamos.
 */
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    @org.springframework.data.jpa.repository.Lock(
        jakarta.persistence.LockModeType.PESSIMISTIC_WRITE
)
@org.springframework.data.jpa.repository.Query(
        "SELECT c FROM Claim c WHERE c.id = :id"
)
java.util.Optional<Claim> findByIdForUpdate(
        @org.springframework.data.repository.query.Param("id") Long id
);

    /**
     * Busca los reclamos de un cliente.
     */
    List<Claim> findByOrderCustomerIdOrderByCreatedAtDesc(Long customerId);

    /**
     * Comprueba si existe un codigo interno.
     */
    boolean existsByInternalCode(String internalCode);

    /**
     * Lista todos los reclamos, del mas reciente al mas antiguo.
     */
    List<Claim> findAllByOrderByCreatedAtDesc();

    /**
     * Filtra reclamos por estado, del mas reciente al mas antiguo.
     */
    List<Claim> findByStatusOrderByCreatedAtDesc(ClaimStatus status);
}