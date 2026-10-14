
package pe.edu.pe.gestion_caja_web.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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
    * Lista los productos retirados del catálogo.
    */
    List<Product> findByActiveFalseOrderByNameAsc();

    /**
     * Busca un producto y bloquea su fila mientras se procesa la transacción.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    /**
     * Busca productos activos por texto en el nombre y por categoría opcional (JPQL).
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (:text IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :text, '%')))
              AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
            ORDER BY p.name ASC
            """)
    List<Product> searchActive(@Param("text") String text, @Param("category") String category);

    /**
     * Lista los productos activos cuyo stock es igual o menor al límite indicado (JPQL).
     */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.stock <= :limit ORDER BY p.stock ASC, p.name ASC")
    List<Product> findLowStock(@Param("limit") Integer limit);

    /**
     * Suma unidades al stock de un producto activo con una sola sentencia JPQL.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Product p SET p.stock = p.stock + :units WHERE p.id = :id AND p.active = true")
    int addStock(@Param("id") Long id, @Param("units") Integer units);
}