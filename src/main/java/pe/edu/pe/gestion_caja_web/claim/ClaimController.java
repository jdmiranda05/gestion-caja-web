package pe.edu.pe.gestion_caja_web.claim;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expone los endpoints para registrar y consultar reclamos propios.
 */
@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    /**
     * Inicializa el controlador con el servicio de reclamos.
     */
    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    /**
     * Registra un reclamo para el cliente que inició sesión.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimResponse createClaim(
            @RequestBody ClaimRequest request,
            Authentication authentication) {
        return claimService.createClaim(authentication.getName(), request);
    }

    /**
     * Devuelve únicamente los reclamos del cliente autenticado.
     */
    @GetMapping("/my-claims")
    public List<ClaimResponse> findMyClaims(Authentication authentication) {
        return claimService.findMyClaims(authentication.getName());
    }
    /**
 * Permite al personal consultar reclamos y filtrarlos por estado.
 */
@GetMapping("/staff")
public List<StaffClaimResponse> findAllForStaff(
        @org.springframework.web.bind.annotation.RequestParam(required = false)
        ClaimStatus status) {

    return claimService.findAllForStaff(status);
}
/**
 * Permite al personal autorizado iniciar la revision de un reclamo.
 */
@PostMapping("/staff/{claimId}/review")
public StaffClaimResponse startReview(
        @org.springframework.web.bind.annotation.PathVariable Long claimId,
        Authentication authentication) {

    return claimService.startReview(claimId, authentication.getName());
}
/**
 * Permite al personal resolver o rechazar un reclamo en revision.
 */
@PostMapping("/staff/{claimId}/resolve")
public StaffClaimResponse resolveClaim(
        @org.springframework.web.bind.annotation.PathVariable Long claimId,
        @RequestBody ClaimResolutionRequest request,
        Authentication authentication) {

    return claimService.resolveClaim(
            claimId,
            authentication.getName(),
            request);
}
/**
 * Consulta el historial de auditoria de un reclamo.
 * Disponible para MANAGER y ADMIN.
 */
@GetMapping("/staff/{claimId}/history")
public List<ClaimAuditResponse> findClaimHistory(
        @org.springframework.web.bind.annotation.PathVariable Long claimId) {

    return claimService.findClaimHistory(claimId);
}
}