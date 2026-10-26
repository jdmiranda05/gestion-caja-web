package pe.edu.pe.gestion_caja_web.sale.controller;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import pe.edu.pe.gestion_caja_web.sale.dto.SaleRequest;
import pe.edu.pe.gestion_caja_web.sale.model.Sale;
import pe.edu.pe.gestion_caja_web.sale.service.SaleService;

@ExtendWith(MockitoExtension.class)
class SaleControllerTest {

    @Mock
    private SaleService saleService;

    @Test
    void delegatesRecentSales() {
        List<Sale> sales = List.of();
        when(saleService.recent()).thenReturn(sales);

        assertThat(new SaleController(saleService).recent()).isSameAs(sales);
        verify(saleService).recent();
    }

    @Test
    void delegatesSaleRegistration() {
        SaleRequest request = new SaleRequest(1L, 1, "Ana");
        when(saleService.register(request)).thenReturn(null);

        assertThat(new SaleController(saleService).register(request)).isNull();
        verify(saleService).register(request);
    }
}