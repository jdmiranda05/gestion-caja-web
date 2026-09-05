package pe.edu.pe.gestion_caja_web.sale;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.transaction.Transactional;
import pe.edu.pe.gestion_caja_web.product.Product;
import pe.edu.pe.gestion_caja_web.product.ProductService;


@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductService productService;

    public SaleService(SaleRepository saleRepository, ProductService productService) {
        this.saleRepository = saleRepository;
        this.productService = productService;
    }

    @Transactional
    public Sale register(SaleRequest request) {
        if (request.productId() == null || request.quantity() == null || request.quantity() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Producto y cantidad son obligatorios");
        }

        Product product = productService.getById(request.productId());
        if (product.getStock() < request.quantity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay stock suficiente");
        }

        product.setStock(product.getStock() - request.quantity());
        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
        return saleRepository.save(new Sale(
                product.getId(), product.getName(), request.quantity(), product.getPrice(),
                total, request.customerName()));
    }

    public List<Sale> recent() {
        return saleRepository.findTop20ByOrderBySoldAtDesc();
    }

    public ReceiptResponse getReceiptBySaleId(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con ID: " + saleId));

        // Formato correlativo tipo boleta: B001-000001
        String receiptNumber = String.format("B001-%06d", sale.getId());

        // Calculamos precio unitario = Total / Cantidad
        BigDecimal unitPrice = BigDecimal.ZERO;
        if (sale.getQuantity() != null && sale.getQuantity() > 0 && sale.getTotal() != null) {
            unitPrice = sale.getTotal().divide(BigDecimal.valueOf(sale.getQuantity()), 2, RoundingMode.HALF_UP);
        }

        String productName = (sale.getProductName() != null) ? sale.getProductName() : "Producto sin nombre";
        int quantity = (sale.getQuantity() != null) ? sale.getQuantity() : 0;
        BigDecimal total = (sale.getTotal() != null) ? sale.getTotal() : BigDecimal.ZERO;

        // Fecha de emision
        LocalDateTime issueDate = LocalDateTime.now();
        if (sale.getSoldAt() != null) {
            issueDate = sale.getSoldAt();
        }

        return new ReceiptResponse(
                receiptNumber,
                issueDate,
                productName,
                quantity,
                unitPrice,
                total
        );
    }
}
