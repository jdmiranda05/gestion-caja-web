package pe.edu.pe.gestion_caja_web.sale.controller;

import jakarta.validation.Valid;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.pe.gestion_caja_web.sale.dto.DailySales;
import pe.edu.pe.gestion_caja_web.sale.dto.ReceiptResponse;
import pe.edu.pe.gestion_caja_web.sale.dto.SaleRequest;
import pe.edu.pe.gestion_caja_web.sale.dto.SaleSummary;
import pe.edu.pe.gestion_caja_web.sale.model.Sale;
import pe.edu.pe.gestion_caja_web.sale.service.SaleService;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @GetMapping
    public List<Sale> recent() {
        return saleService.recent();
    }

    @GetMapping("/summary")
    public List<SaleSummary> summary() {
        return saleService.summary();
    }

    /**
     * Serie diaria de ventas para el grafico del panel (por defecto 14 dias).
     */
    @GetMapping("/daily")
    public List<DailySales> daily(@RequestParam(defaultValue = "14") int days) {
        return saleService.daily(days);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sale register(@Valid @RequestBody SaleRequest request) {
        return saleService.register(request);
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<ReceiptResponse> getReceipt(@PathVariable Long id) {
        ReceiptResponse receipt = saleService.getReceiptBySaleId(id);
        return ResponseEntity.ok(receipt);
    }
}
