package pe.edu.pe.gestion_caja_web.sale;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findTop20ByOrderBySoldAtDesc();
}
