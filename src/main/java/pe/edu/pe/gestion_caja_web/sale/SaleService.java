package pe.edu.pe.gestion_caja_web.sale;

import java.math.BigDecimal;
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
}
