package pe.edu.pe.gestion_caja_web.claim;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pe.edu.pe.gestion_caja_web.purchase.CustomerOrder;
import pe.edu.pe.gestion_caja_web.purchase.CustomerOrderRepository;
import pe.edu.pe.gestion_caja_web.purchase.OrderItem;
import pe.edu.pe.gestion_caja_web.user.User;
import pe.edu.pe.gestion_caja_web.user.UserRepository;

/**
 * Gestiona el registro y la consulta de reclamos de clientes.
 */
@Service
public class ClaimService {
        private static final String CODE_CHARACTERS =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ClaimRepository claimRepository;
    private final ClaimAuditRepository claimAuditRepository;
    private final CustomerOrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Inicializa el servicio con los repositorios necesarios.
     */
    public ClaimService(
        ClaimRepository claimRepository,
        ClaimAuditRepository claimAuditRepository,
        CustomerOrderRepository orderRepository,
        UserRepository userRepository) {

    this.claimRepository = claimRepository;
    this.claimAuditRepository = claimAuditRepository;
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
}

    /**
     * Registra un reclamo si el pedido y el artículo pertenecen al cliente.
     */
    @Transactional
    public ClaimResponse createClaim(String username, ClaimRequest request) {
        if (request == null
                || request.orderId() == null
                || request.orderItemId() == null
                || isBlank(request.reason())
                || isBlank(request.description())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes indicar el pedido, el producto, el motivo y la descripción.");
        }

        String reason = request.reason().trim();
        String description = request.description().trim();

        if (reason.length() > 80 || description.length() > 2000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo admite hasta 80 caracteres y la descripción hasta 2000.");
        }

        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "No se encontró la cuenta autenticada."));

        CustomerOrder order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró el pedido indicado."));

        // Verifica la propiedad del pedido usando la identidad autenticada.
        if (!order.getCustomer().getId().equals(customer.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No puedes registrar reclamos sobre pedidos de otro cliente.");
        }

        // Busca el artículo dentro del pedido validado, no solo por su identificador.
        OrderItem orderItem = order.getItems().stream()
                .filter(item -> item.getId().equals(request.orderItemId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El producto indicado no pertenece a ese pedido."));

                Claim claim = new Claim(order, orderItem, reason, description);
                claim.setInternalCode(generateInternalCode());

                Claim savedClaim = claimRepository.save(claim);

        return toResponse(savedClaim);
    }

    /**
     * Devuelve exclusivamente los reclamos del cliente autenticado.
     */
    @Transactional(readOnly = true)
    public List<ClaimResponse> findMyClaims(String username) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "No se encontró la cuenta autenticada."));

        return claimRepository
                .findByOrderCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }
    /**
 * Lista todos los reclamos para el personal autorizado.
 */
@Transactional(readOnly = true)
public List<StaffClaimResponse> findAllForStaff(ClaimStatus status) {
    List<Claim> claims = status == null
            ? claimRepository.findAllByOrderByCreatedAtDesc()
            : claimRepository.findByStatusOrderByCreatedAtDesc(status);

    return claims.stream()
            .map(this::toStaffResponse)
            .toList();
}

/**
 * Convierte un reclamo a su respuesta administrativa.
 */
private StaffClaimResponse toStaffResponse(Claim claim) {
    return new StaffClaimResponse(
            claim.getId(),
            claim.getInternalCode(),
            claim.getOrder().getId(),
            claim.getOrderItem().getId(),
            claim.getOrderItem().getProductName(),
            claim.getReason(),
            claim.getDescription(),
            claim.getStatus(),
            claim.getCreatedAt(),
            claim.getUpdatedAt());
}

    /**
     * Convierte la entidad a una respuesta segura para la API.
     */
    private ClaimResponse toResponse(Claim claim) {
        return new ClaimResponse(
                claim.getId(),
                claim.getOrder().getId(),
                claim.getOrderItem().getId(),
                claim.getOrderItem().getProductName(),
                claim.getReason(),
                claim.getDescription(),
                claim.getStatus(),
                claim.getCreatedAt(),
                claim.getUpdatedAt(),
                claim.getStaffResponse(),
                claim.getRespondedAt()
        );
    }
    /**
 * Permite al personal autorizado iniciar la revision de un reclamo.
 */
@Transactional
public StaffClaimResponse startReview(Long claimId, String username) {

    User reviewer = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No se encontro la cuenta autenticada."));

    Claim claim = claimRepository.findByIdForUpdate(claimId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontro el reclamo."));

    if (claim.getStatus() != ClaimStatus.PENDING) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Solo se pueden revisar reclamos pendientes.");
    }

    ClaimStatus previousStatus = claim.getStatus();

    claim.startReview(reviewer.getId());

    claimAuditRepository.save(new ClaimAudit(
            claim.getId(),
            reviewer.getId(),
            previousStatus,
            ClaimStatus.IN_REVIEW,
            "START_REVIEW",
            "Se inicio la revision del reclamo."
    ));

    return toStaffResponse(claim);
}
/**
 * Permite resolver o rechazar un reclamo en revision.
 * Registra la respuesta y la auditoria en una misma transaccion.
 */
@Transactional
public StaffClaimResponse resolveClaim(
        Long claimId,
        String username,
        ClaimResolutionRequest request) {

    if (request == null
            || request.status() == null
            || (request.status() != ClaimStatus.RESOLVED
                && request.status() != ClaimStatus.REJECTED)
            || isBlank(request.response())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debes indicar RESOLVED o REJECTED y una respuesta.");
    }

    String response = request.response().trim();

    if (response.length() > 2000) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La respuesta no puede superar los 2000 caracteres.");
    }

    User reviewer = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No se encontro la cuenta autenticada."));

    Claim claim = claimRepository.findByIdForUpdate(claimId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontro el reclamo."));

    if (claim.getStatus() != ClaimStatus.IN_REVIEW) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Solo se pueden finalizar reclamos en revision.");
    }

    ClaimStatus previousStatus = claim.getStatus();

    claim.respond(response, request.status());

    claimAuditRepository.save(new ClaimAudit(
            claim.getId(),
            reviewer.getId(),
            previousStatus,
            request.status(),
            "RESOLVE_CLAIM",
            "Se registro una respuesta y se finalizo el reclamo."
    ));

    return toStaffResponse(claim);
}
/**
 * Consulta el historial de auditoria de un reclamo.
 * Solo debe exponerse al personal autorizado.
 */
@Transactional(readOnly = true)
public List<ClaimAuditResponse> findClaimHistory(Long claimId) {

    if (claimId == null || claimId <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El identificador del reclamo no es valido.");
    }

    if (!claimRepository.existsById(claimId)) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontro el reclamo.");
    }

    return claimAuditRepository
            .findByClaimIdOrderByCreatedAtDescIdDesc(claimId)
            .stream()
            .map(audit -> new ClaimAuditResponse(
                    audit.getId(),
                    audit.getActorUserId(),
                    audit.getPreviousStatus(),
                    audit.getNewStatus(),
                    audit.getAction(),
                    audit.getDetails(),
                    audit.getCreatedAt()
            ))
            .toList();
}



    /**
     * Genera un codigo interno de seguimiento para el reclamo.
     */
    private String generateInternalCode() {
        String code;

        do {
            StringBuilder builder = new StringBuilder("REC-");

            for (int i = 0; i < 6; i++) {
                int index = SECURE_RANDOM.nextInt(CODE_CHARACTERS.length());
                builder.append(CODE_CHARACTERS.charAt(index));
            }

            code = builder.toString();

        } while (claimRepository.existsByInternalCode(code));

        return code;
    }

    /**
     * Comprueba si un texto esta vacio.
     */
    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}