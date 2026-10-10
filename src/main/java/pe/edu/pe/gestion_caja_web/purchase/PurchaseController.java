package pe.edu.pe.gestion_caja_web.purchase;

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
 * Expone los endpoints para registrar compras y consultar pedidos del cliente autenticado.
 */
@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    /**
     * Inicializa el controlador con el servicio encargado de procesar las compras.
     */
    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    /**
     * Registra la compra del cliente que inició sesión.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse placeOrder(
            @RequestBody PurchaseRequest request,
            Authentication authentication) {
        return purchaseService.placeOrder(authentication.getName(), request);
    }

    /**
     * Devuelve únicamente los pedidos del cliente que inició sesión.
     */
    @GetMapping("/my-orders")
    public List<PurchaseResponse> findMyOrders(Authentication authentication) {
        return purchaseService.findMyOrders(authentication.getName());
    }
}