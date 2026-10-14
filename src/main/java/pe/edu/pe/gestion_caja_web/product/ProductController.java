package pe.edu.pe.gestion_caja_web.product;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

        @GetMapping
    public List<Product> list() {
        return productService.findForSale();
    }

    /**
     * Consulta los productos retirados.
     */
    @GetMapping("/inactive")
    public List<Product> inactive() {
        return productService.findInactive();
    }

    /**
     * Restaura un producto retirado.
     */
    @PatchMapping("/{id}/restore")
    public Product restore(@PathVariable Long id) {
        return productService.restore(id);
    }

    @GetMapping("/search")
    public List<Product> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category) {
        return productService.search(q, category);
    }

    @GetMapping("/low-stock")
    public List<Product> lowStock(@RequestParam(required = false) Integer limit) {
        return productService.lowStock(limit);
    }

    @PatchMapping("/{id}/stock")
    public Product restock(@PathVariable Long id, @RequestBody StockRequest request) {
        return productService.restock(id, request.units());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
     productService.delete(id);
    }
}
