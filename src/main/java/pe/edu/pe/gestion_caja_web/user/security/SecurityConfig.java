package pe.edu.pe.gestion_caja_web.user.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

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
                // Páginas y archivos estáticos de la tienda y de las cuentas.
                .requestMatchers(
                    "/", "/index.html",
                    "/login", "/login.html",
                    "/registro", "/registro.html",
                    "/css/**", "/js/**",
                    "/favicon.ico"
                ).permitAll()

                // Catálogo público y búsqueda con JPQL.
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/search").permitAll()

                // Preparación de CSRF, registro e inicio de sesión.
                .requestMatchers(HttpMethod.GET, "/api/users/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/login").permitAll()

                // Consola H2 durante el desarrollo.
                .requestMatchers("/h2-console/**").permitAll()

                // Gestión de productos: solo gerente y administrador.
                .requestMatchers(HttpMethod.GET, "/api/products/inactive", "/api/products/low-stock")
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

                // El resto de las rutas exige autenticación.
                .anyRequest().authenticated()
            )
            // Usa la página de acceso propia de la tienda.
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error")
                .permitAll()
            )
            // Cierra la sesión y vuelve al formulario de acceso.
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            )
            // Mantiene CSRF activo, salvo en la consola H2 y en el inicio de sesión con JWT.
            .csrf(csrf -> csrf
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/h2-console/**")
                .ignoringRequestMatchers(
                    PathPatternRequestMatcher.withDefaults()
                        .matcher(HttpMethod.POST, "/api/users/login")
                )
            )
            // Acepta tokens JWT en la cabecera Authorization: Bearer.
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            // Devuelve HTTP 401 a las solicitudes de la API sin autenticar.
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                )
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
