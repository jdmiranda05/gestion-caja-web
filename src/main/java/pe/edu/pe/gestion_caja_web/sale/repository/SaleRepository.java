package pe.edu.pe.gestion_caja_web.sale.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import pe.edu.pe.gestion_caja_web.sale.dto.SaleSummary;
import pe.edu.pe.gestion_caja_web.sale.model.Sale;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findTop20ByOrderBySoldAtDesc();

    /**
     * Agrupa las ventas por producto y calcula unidades e ingresos (JPQL).
     */
    @Query("""
            SELECT new pe.edu.pe.gestion_caja_web.sale.dto.SaleSummary(
                s.productName, SUM(s.quantity), SUM(s.total))
            FROM Sale s
            GROUP BY s.productName
            ORDER BY SUM(s.total) DESC
            """)
    List<SaleSummary> summarizeByProduct();
}
