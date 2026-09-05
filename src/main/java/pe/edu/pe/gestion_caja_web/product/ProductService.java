package pe.edu.pe.gestion_caja_web.product;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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

    public Product create(ProductRequest request) {
        validate(request);
        return productRepository.save(new Product(
                request.name(), request.category(), request.price(), request.stock()));
    }

    public Product update(Long id, ProductRequest request) {
        validate(request);
        Product product = getById(id);
        product.setName(request.name());
        product.setCategory(request.category());
        product.setPrice(request.price());
        product.setStock(request.stock());
        return productRepository.save(product);
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
