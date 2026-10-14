package pe.edu.pe.gestion_caja_web.product;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> findForSale() {
        return productRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional
    public Product create(ProductRequest request) {
        validate(request);
        return productRepository.save(new Product(
                request.name(), request.category(), request.price(), request.stock()));
    }

    @Transactional
    public Product update(Long id, ProductRequest request) {
        validate(request);
        Product product = getById(id);
        product.setName(request.name());
        product.setCategory(request.category());
        product.setPrice(request.price());
        product.setStock(request.stock());
        return productRepository.save(product);
    }
    @Transactional
    public void delete(Long id) {
        Product product = getById(id);
        product.setActive(false);
        productRepository.save(product);
    }


    public List<Product> search(String text, String category) {
        return productRepository.searchActive(blankToNull(text), blankToNull(category));
    }

    public List<Product> lowStock(Integer limit) {
        return productRepository.findLowStock(limit == null || limit < 0 ? 5 : limit);
    }

    /**
     * Repone stock dentro de una transacción; si el producto no existe se revierte todo.
     */
    @Transactional
    public Product restock(Long id, Integer units) {
        if (units == null || units < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las unidades deben ser mayores que cero");
        }
        if (productRepository.addStock(id, units) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }
        return getById(id);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private void validate(ProductRequest request) {
        if (request.name() == null || request.name().isBlank()
                || request.price() == null || request.price().signum() < 0
                || request.stock() == null || request.stock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nombre, precio y stock deben tener valores validos");
        }
    }
}
