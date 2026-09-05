package pe.edu.pe.gestion_caja_web.sale;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Sale register(@RequestBody SaleRequest request) {
        return saleService.register(request);
    }
}
