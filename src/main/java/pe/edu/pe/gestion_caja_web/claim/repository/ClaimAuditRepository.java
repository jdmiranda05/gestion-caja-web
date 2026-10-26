package pe.edu.pe.gestion_caja_web.claim.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.pe.gestion_caja_web.claim.model.ClaimAudit;

/**
 * Permite guardar y consultar el historial de los reclamos.
 */
public interface ClaimAuditRepository
        extends JpaRepository<ClaimAudit, Long> {

    /**
     * Consulta el historial de un reclamo, del mas reciente al mas antiguo.
     */
    List<ClaimAudit> findByClaimIdOrderByCreatedAtDescIdDesc(Long claimId);
}