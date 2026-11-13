package pe.edu.pe.gestion_caja_web.sale.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.transaction.Transactional;

import pe.edu.pe.gestion_caja_web.product.model.Product;
import pe.edu.pe.gestion_caja_web.product.service.ProductService;
import pe.edu.pe.gestion_caja_web.sale.dto.DailySales;
import pe.edu.pe.gestion_caja_web.sale.dto.ReceiptResponse;
import pe.edu.pe.gestion_caja_web.sale.dto.SaleRequest;
import pe.edu.pe.gestion_caja_web.sale.dto.SaleSummary;
import pe.edu.pe.gestion_caja_web.sale.model.Sale;
import pe.edu.pe.gestion_caja_web.sale.repository.SaleRepository;

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

    /**
     * Ventas agrupadas por dia en los ultimos N dias (incluye dias sin ventas en cero).
     */
    public List<DailySales> daily(int days) {
        int range = Math.max(1, Math.min(days, 90));
        LocalDate today = LocalDate.now();
        LocalDate from = today.minusDays(range - 1L);

        Map<LocalDate, List<Sale>> byDay = saleRepository
                .findBySoldAtGreaterThanEqualOrderBySoldAtAsc(from.atStartOfDay())
                .stream()
                .collect(Collectors.groupingBy(sale -> sale.getSoldAt().toLocalDate()));

        List<DailySales> result = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            List<Sale> sales = byDay.getOrDefault(day, List.of());
            BigDecimal revenue = sales.stream()
                    .map(Sale::getTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long units = sales.stream().mapToLong(sale -> sale.getQuantity() == null ? 0 : sale.getQuantity()).sum();
            result.add(new DailySales(day, sales.size(), units, revenue));
        }
        return result;
    }

    public List<SaleSummary> summary() {
        return saleRepository.summarizeByProduct();
    }

    public List<Sale> recent() {
        return saleRepository.findTop20ByOrderBySoldAtDesc();
    }

    public ReceiptResponse getReceiptBySaleId(Long saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

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
