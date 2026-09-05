package pe.edu.pe.gestion_caja_web.product;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @Test
    void delegatesProductListing() {
        List<Product> products = List.of(new Product("Cafe", "Abarrotes", BigDecimal.ONE, 2));
        when(productService.findForSale()).thenReturn(products);

        assertThat(new ProductController(productService).list()).isSameAs(products);
        verify(productService).findForSale();
    }

    @Test
    void delegatesProductCreation() {
        ProductRequest request = new ProductRequest("Cafe", "Abarrotes", BigDecimal.ONE, 2);
        Product product = new Product("Cafe", "Abarrotes", BigDecimal.ONE, 2);
        when(productService.create(request)).thenReturn(product);

        assertThat(new ProductController(productService).create(request)).isSameAs(product);
        verify(productService).create(request);
    }
    @Test
    void delegatesProductDeletion() {
        new ProductController(productService).delete(7L);

        verify(productService).delete(7L);
    }
}