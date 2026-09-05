package pe.edu.pe.gestion_caja_web.product;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Test
    void createsAProductForTheStore() {
        Product product = new Product("Cafe", "Abarrotes", new BigDecimal("6.50"), 12);
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product result = new ProductService(productRepository).create(
                new ProductRequest("Cafe", "Abarrotes", new BigDecimal("6.50"), 12));

        assertThat(result.getName()).isEqualTo("Cafe");
        assertThat(result.getStock()).isEqualTo(12);
        assertThat(result.getPrice()).isEqualByComparingTo("6.50");
    }

    @Test
    void findsActiveProductsForSale() {
        List<Product> products = List.of(new Product("Cafe", "Abarrotes", new BigDecimal("6.50"), 12));
        when(productRepository.findByActiveTrueOrderByNameAsc()).thenReturn(products);

        assertThat(new ProductService(productRepository).findForSale()).containsExactlyElementsOf(products);
    }

    @Test
    void rejectsInvalidProductData() {
        ProductService service = new ProductService(productRepository);

        assertThatThrownBy(() -> service.create(new ProductRequest(" ", "Abarrotes", BigDecimal.ONE, 1)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    @Test
    void updatesAnExistingProduct() {
        Product product = new Product("Cafe", "Abarrotes", new BigDecimal("6.50"), 12);
        when(productRepository.findById(7L)).thenReturn(java.util.Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        Product result = new ProductService(productRepository).update(
                7L, new ProductRequest("Cafe grande", "Bebidas", new BigDecimal("8.00"), 20));

        assertThat(result.getName()).isEqualTo("Cafe grande");
        assertThat(result.getCategory()).isEqualTo("Bebidas");
        assertThat(result.getPrice()).isEqualByComparingTo("8.00");
        assertThat(result.getStock()).isEqualTo(20);
        verify(productRepository).save(eq(product));
    }
}
