package pe.edu.pe.gestion_caja_web.purchase;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pe.edu.pe.gestion_caja_web.product.Product;
import pe.edu.pe.gestion_caja_web.product.ProductRepository;
import pe.edu.pe.gestion_caja_web.user.User;
import pe.edu.pe.gestion_caja_web.user.UserRepository;

/**
 * Gestiona las compras de clientes y la actualización transaccional del stock.
 */
@Service
public class PurchaseService {

    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Inicializa el servicio con los repositorios de pedidos, productos y usuarios.
     */
    public PurchaseService(
            CustomerOrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /**
     * Valida el carrito, calcula los importes y registra la compra del usuario autenticado.
     */
    @Transactional
    public PurchaseResponse placeOrder(String username, PurchaseRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El carrito no contiene productos.");
        }

        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "No se encontró la cuenta autenticada."));

        // Agrupa los productos repetidos para validar correctamente las cantidades totales.
        Map<Long, Integer> quantities = new LinkedHashMap<>();

        for (PurchaseRequest.Item item : request.items()) {
            if (item == null || item.productId() == null
                    || item.quantity() == null || item.quantity() < 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cada producto debe tener un identificador y una cantidad válida.");
            }

            try {
                // Suma las cantidades repetidas y evita desbordamientos numéricos.
                quantities.merge(item.productId(), item.quantity(), (current, added) -> {
                    return Math.addExact(current, added);
                });
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La cantidad solicitada es demasiado grande.");
            }
        }

        // Crea el pedido del cliente después de validar todas las cantidades.
        CustomerOrder order = new CustomerOrder(customer);

        // Bloquea cada producto y calcula los importes usando datos de la base de datos.
        for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
            Product product = productRepository.findByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Uno de los productos no existe."));

            Integer quantity = entry.getValue();

            if (!Boolean.TRUE.equals(product.getActive())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Uno de los productos ya no está disponible.");
            }

            if (product.getPrice() == null || product.getPrice().signum() < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Uno de los productos tiene un precio inválido.");
            }

            if (product.getStock() == null || product.getStock() < quantity) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Stock insuficiente para el producto: " + product.getName());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

            // Descuenta las existencias dentro de la misma transacción del pedido.
            product.setStock(product.getStock() - quantity);

            // Conserva el nombre y el precio aplicados en el momento de la compra.
            order.addItem(new OrderItem(
                    product.getId(),
                    product.getName(),
                    quantity,
                    unitPrice,
                    lineTotal));
        }

        // Guarda el pedido y sus artículos mediante la relación en cascada.
        CustomerOrder savedOrder = orderRepository.save(order);

        return toResponse(savedOrder);
    }

    /**
     * Convierte el pedido en una respuesta segura para el navegador.
     */
    private PurchaseResponse toResponse(CustomerOrder order) {
        List<PurchaseResponse.Item> items = new ArrayList<>();

        for (OrderItem item : order.getItems()) {
            items.add(new PurchaseResponse.Item(
                    item.getId(),
                    item.getProductId(),
                    item.getProductName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getLineTotal()));
        }

        return new PurchaseResponse(
                order.getId(),
                order.getCreatedAt(),
                order.getTotal(),
                List.copyOf(items));
    }

    /**
     * Devuelve los pedidos pertenecientes exclusivamente al cliente indicado.
     */
    @Transactional(readOnly = true)
    public List<PurchaseResponse> findMyOrders(String username) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "No se encontró la cuenta autenticada."));

        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }
}