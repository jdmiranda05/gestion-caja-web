package pe.edu.pe.gestion_caja_web;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import pe.edu.pe.gestion_caja_web.product.Product;
import pe.edu.pe.gestion_caja_web.product.ProductRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedProducts(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                productRepository.save(new Product("Arroz 1 kg", "Abarrotes", new BigDecimal("4.50"), 24));
                productRepository.save(new Product("Leche evaporada", "Lacteos", new BigDecimal("4.20"), 18));
                productRepository.save(new Product("Gaseosa personal", "Bebidas", new BigDecimal("2.50"), 30));
                productRepository.save(new Product("Pan de molde", "Panaderia", new BigDecimal("8.90"), 10));
            }
        };
    }
}
