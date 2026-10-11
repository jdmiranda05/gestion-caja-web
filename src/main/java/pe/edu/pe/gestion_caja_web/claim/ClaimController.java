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
}