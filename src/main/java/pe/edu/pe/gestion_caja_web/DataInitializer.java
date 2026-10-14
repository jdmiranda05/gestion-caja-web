
package pe.edu.pe.gestion_caja_web;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import pe.edu.pe.gestion_caja_web.product.Product;
import pe.edu.pe.gestion_caja_web.product.ProductRepository;
import pe.edu.pe.gestion_caja_web.user.Role;
import pe.edu.pe.gestion_caja_web.user.User;
import pe.edu.pe.gestion_caja_web.user.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedProducts(ProductRepository productRepository) {
        return args -> {
            // Conserva todos los productos existentes y evita duplicados por nombre.
            Set<String> existingNames = new HashSet<>();

            for (Product product : productRepository.findAll()) {
                existingNames.add(normalizeName(product.getName()));
            }

            // Catálogo inicial de ejemplo para una tienda de barrio.
            // Los precios y el stock son valores de demostración que puedes ajustar.
            List<Product> catalog = List.of(
                // Lácteos
                new Product("Yogur natural", "Lacteos", new BigDecimal("3.50"), 20),
                new Product("Yogur de fresa", "Lacteos", new BigDecimal("3.80"), 18),
                new Product("Leche entera", "Lacteos", new BigDecimal("4.00"), 24),
                new Product("Leche deslactosada", "Lacteos", new BigDecimal("4.80"), 12),
                new Product("Queso fresco", "Lacteos", new BigDecimal("8.50"), 10),
                new Product("Mantequilla", "Lacteos", new BigDecimal("5.20"), 12),
                new Product("Crema de leche", "Lacteos", new BigDecimal("6.50"), 8),

                // Golosinas
                new Product("Chocolate con leche", "Golosinas", new BigDecimal("2.50"), 30),
                new Product("Caramelos surtidos", "Golosinas", new BigDecimal("0.20"), 100),
                new Product("Chupetines", "Golosinas", new BigDecimal("0.50"), 60),
                new Product("Gomitas dulces", "Golosinas", new BigDecimal("1.50"), 35),
                new Product("Chicle en paquete", "Golosinas", new BigDecimal("1.00"), 40),
                new Product("Barra de chocolate", "Golosinas", new BigDecimal("3.00"), 25),
                new Product("Malvaviscos", "Golosinas", new BigDecimal("2.80"), 15),

                // Bebidas
                new Product("Agua mineral 625 ml", "Bebidas", new BigDecimal("1.50"), 40),
                new Product("Agua mineral 2 litros", "Bebidas", new BigDecimal("3.00"), 24),
                new Product("Gaseosa familiar", "Bebidas", new BigDecimal("8.50"), 18),
                new Product("Jugo de naranja", "Bebidas", new BigDecimal("3.20"), 20),
                new Product("Bebida energizante", "Bebidas", new BigDecimal("5.00"), 12),
                new Product("Té helado", "Bebidas", new BigDecimal("3.50"), 16),
                new Product("Refresco de durazno", "Bebidas", new BigDecimal("2.80"), 20),

                // Snacks
                new Product("Papas fritas clásicas", "Snacks", new BigDecimal("2.00"), 30),
                new Product("Papas fritas picantes", "Snacks", new BigDecimal("2.20"), 25),
                new Product("Chizitos", "Snacks", new BigDecimal("1.50"), 30),
                new Product("Maní salado", "Snacks", new BigDecimal("2.50"), 20),
                new Product("Galletas de soda", "Snacks", new BigDecimal("2.80"), 20),
                new Product("Palitos salados", "Snacks", new BigDecimal("1.80"), 20),

                // Abarrotes
                new Product("Azúcar rubia 1 kg", "Abarrotes", new BigDecimal("4.00"), 25),
                new Product("Fideos spaghetti", "Abarrotes", new BigDecimal("3.20"), 25),
                new Product("Aceite vegetal 1 litro", "Abarrotes", new BigDecimal("7.50"), 18),
                new Product("Sal de mesa 1 kg", "Abarrotes", new BigDecimal("2.00"), 20),
                new Product("Lentejas 500 g", "Abarrotes", new BigDecimal("4.20"), 15),
                new Product("Atún en conserva", "Abarrotes", new BigDecimal("5.50"), 20),
                new Product("Avena tradicional", "Abarrotes", new BigDecimal("4.50"), 18),
                new Product("Harina sin preparar 1 kg", "Abarrotes", new BigDecimal("4.20"), 12),

                // Panadería
                new Product("Pan francés por unidad", "Panaderia", new BigDecimal("0.30"), 100),
                new Product("Pan integral", "Panaderia", new BigDecimal("7.50"), 10),
                new Product("Bizcochos", "Panaderia", new BigDecimal("3.50"), 15),
                new Product("Queque marmoleado", "Panaderia", new BigDecimal("6.00"), 8),

                // Limpieza
                new Product("Detergente en polvo", "Limpieza", new BigDecimal("5.50"), 15),
                new Product("Lavavajilla líquido", "Limpieza", new BigDecimal("4.80"), 12),
                new Product("Lejía 1 litro", "Limpieza", new BigDecimal("3.00"), 15),
                new Product("Limpiador multiusos", "Limpieza", new BigDecimal("5.00"), 10),
                new Product("Esponja de cocina", "Limpieza", new BigDecimal("1.50"), 20),
                new Product("Bolsas para basura", "Limpieza", new BigDecimal("4.00"), 12),

                // Higiene personal
                new Product("Jabón de tocador", "Higiene personal", new BigDecimal("2.50"), 25),
                new Product("Champú familiar", "Higiene personal", new BigDecimal("9.50"), 10),
                new Product("Pasta dental", "Higiene personal", new BigDecimal("5.50"), 15),
                new Product("Papel higiénico paquete", "Higiene personal", new BigDecimal("8.00"), 15),
                new Product("Desodorante", "Higiene personal", new BigDecimal("7.50"), 10),
                new Product("Cepillo dental", "Higiene personal", new BigDecimal("3.50"), 15)
            );

            List<Product> newProducts = catalog.stream()
                .filter(product ->
                    existingNames.add(normalizeName(product.getName())))
                .toList();

            if (!newProducts.isEmpty()) {
                productRepository.saveAll(newProducts);
                System.out.println(
                    "Catálogo: se añadieron " + newProducts.size()
                    + " productos nuevos.");
            } else {
                System.out.println(
                    "Catálogo: no hay productos nuevos que añadir.");
            }
        };
    }

    /**
     * Crea un gerente y un administrador de demostración si aún no existen.
     * La contraseña se lee de app.seed.staff-password; si está vacía no se crea nada.
     */
    @Bean
    CommandLineRunner seedStaffUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.staff-password:}") String staffPassword) {
        return args -> {
            if (staffPassword.isBlank()) {
                return;
            }

            createStaffUser(userRepository, passwordEncoder, staffPassword,
                    "gerente", "gerente@alondralu.local", Role.MANAGER);
            createStaffUser(userRepository, passwordEncoder, staffPassword,
                    "admin", "admin@alondralu.local", Role.ADMIN);
        };
    }

    private void createStaffUser(
            UserRepository userRepository, PasswordEncoder passwordEncoder,
            String rawPassword, String username, String email, Role role) {
        if (!userRepository.existsByUsername(username) && !userRepository.existsByEmail(email)) {
            userRepository.save(new User(
                    username, email, passwordEncoder.encode(rawPassword), role));
        }
    }

    private String normalizeName(String name) {
        if (name == null) {
            return "";
        }

        return Normalizer.normalize(name.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT);
    }
}