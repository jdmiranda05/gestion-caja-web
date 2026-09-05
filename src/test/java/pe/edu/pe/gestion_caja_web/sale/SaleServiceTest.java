package pe.edu.pe.gestion_caja_web.sale;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import pe.edu.pe.gestion_caja_web.product.Product;
import pe.edu.pe.gestion_caja_web.product.ProductService;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductService productService;

    @Test
    void registersSaleAndDecreasesStock() {
        Product product = new Product("Arroz", "Abarrotes", new BigDecimal("4.50"), 10);
        when(productService.getById(1L)).thenReturn(product);
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Sale result = new SaleService(saleRepository, productService)
                .register(new SaleRequest(1L, 2, "Ana"));

        assertThat(product.getStock()).isEqualTo(8);
        assertThat(result.getProductName()).isEqualTo("Arroz");
        assertThat(result.getTotal()).isEqualByComparingTo("9.00");
        verify(saleRepository).save(any(Sale.class));
    }

    @Test
    void rejectsMissingProductOrInvalidQuantity() {
        SaleService service = new SaleService(saleRepository, productService);

        assertThatThrownBy(() -> service.register(new SaleRequest(null, 1, null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
        assertThatThrownBy(() -> service.register(new SaleRequest(1L, 0, null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    @Test
    void rejectsSaleWhenStockIsInsufficient() {
        when(productService.getById(1L))
                .thenReturn(new Product("Arroz", "Abarrotes", new BigDecimal("4.50"), 1));

        assertThatThrownBy(() -> new SaleService(saleRepository, productService)
                .register(new SaleRequest(1L, 2, null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT");
    }

    @Test
    void returnsRecentSales() {
        List<Sale> sales = List.of();
        when(saleRepository.findTop20ByOrderBySoldAtDesc()).thenReturn(sales);

        assertThat(new SaleService(saleRepository, productService).recent()).isSameAs(sales);
    }
}