package pe.edu.pe.gestion_caja_web.claim;

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

    private final ClaimRepository claimRepository;
    private final CustomerOrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Inicializa el servicio con los repositorios necesarios.
     */
    public ClaimService(
            ClaimRepository claimRepository,
            CustomerOrderRepository orderRepository,
            UserRepository userRepository) {
        this.claimRepository = claimRepository;
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
                claim.getUpdatedAt());
    }

    /**
     * Comprueba si un texto está vacío o contiene únicamente espacios.
     */
    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}