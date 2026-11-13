package pe.edu.pe.gestion_caja_web.user.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;

import pe.edu.pe.gestion_caja_web.common.JsonSecurityHandlers;

/**
 * Configura las reglas de acceso, la autenticación y la protección de la aplicación.
 */
@Configuration
public class SecurityConfig {

    /**
     * Proporciona BCrypt para proteger las contraseñas almacenadas.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Expone el administrador de autenticación que usa el inicio de sesión con JWT.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Define las rutas públicas y las restricciones de acceso por rol.
     * El orden de las reglas importa: Spring aplica la primera que coincide.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                // Catálogo público y búsqueda con JPQL.
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/search").permitAll()

                // Registro e inicio de sesión (emite el JWT).
                .requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/login").permitAll()

                // Consola H2 y salud de la aplicación durante el desarrollo.
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Gestión de productos: solo gerente y administrador.
                .requestMatchers(HttpMethod.GET, "/api/products/inactive", "/api/products/low-stock",
                        "/api/products/*")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/products")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Usuarios: el listado y el cambio de rol son exclusivos del administrador.
                .requestMatchers("/api/users", "/api/users/*/role")
                    .hasRole("ADMIN")
                .requestMatchers("/api/users/me").authenticated()

                // Caja: gerente o administrador.
                .requestMatchers("/api/sales/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Reclamos: el cliente registra y consulta los suyos.
                .requestMatchers(HttpMethod.POST, "/api/claims").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/claims/my-claims").hasRole("CUSTOMER")

                // Reclamos: el personal los consulta y gestiona.
                .requestMatchers("/api/claims/staff", "/api/claims/staff/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/claims")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Cualquier otra ruta de reclamos queda bloqueada.
                .requestMatchers("/api/claims", "/api/claims/**")
                    .denyAll()

                // Aprobaciones, administración y operaciones propias del gerente.
                .requestMatchers("/api/approvals/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                .requestMatchers("/api/manager/**")
                    .hasRole("MANAGER")

                // Compras: solo clientes.
                .requestMatchers("/api/purchases/**")
                    .hasRole("CUSTOMER")

                // Toda otra ruta de la API exige un JWT válido.
                .requestMatchers("/api/**", "/actuator/**").authenticated()

                // El resto son los archivos de la SPA Angular (index.html, JS, CSS);
                // las rutas del cliente se protegen con guards y los datos con la API.
                .anyRequest().permitAll()
            )
            // API sin estado: cada solicitud se autentica solo con el JWT.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // El token viaja en la cabecera Authorization, no en cookies, por lo que
            // la API no es vulnerable a CSRF. Se mantiene CSRF fuera de /api y H2.
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/h2-console/**"))
            // Acepta tokens JWT en la cabecera Authorization: Bearer.
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(JsonSecurityHandlers.unauthorized())
                .accessDeniedHandler(JsonSecurityHandlers.forbidden())
            )
            // 401 y 403 en JSON para que el frontend muestre mensajes claros.
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(JsonSecurityHandlers.unauthorized())
                .accessDeniedHandler(JsonSecurityHandlers.forbidden())
            )
            // Permite mostrar la consola H2 dentro de un marco del mismo origen.
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }

    /**
     * Convierte el claim "role" del JWT en la autoridad ROLE_xxx de Spring Security.
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(token -> {
            String role = token.getClaimAsString("role");

            if (role == null || role.isBlank()) {
                return List.of();
            }

            return List.of(new SimpleGrantedAuthority("ROLE_" + role));
        });

        return converter;
    }
}
