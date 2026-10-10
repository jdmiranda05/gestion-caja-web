
package pe.edu.pe.gestion_caja_web.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

/**
 * Proporciona operaciones de base de datos para los productos.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Lista los productos activos ordenados alfabéticamente por nombre.
     */
    List<Product> findByActiveTrueOrderByNameAsc();

    /**
     * Busca un producto y bloquea su fila mientras se procesa la transacción.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}