package pe.edu.pe.gestion_caja_web.user;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

/**
 * Configura las reglas de acceso, autenticaciÃ³n y protecciÃ³n de la aplicaciÃ³n.
 */
@Configuration
public class SecurityConfig {

    /**
     * Proporciona BCrypt para proteger las contraseÃ±as almacenadas.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
public AuthenticationManager authenticationManager(
        AuthenticationConfiguration configuration) throws Exception {
    return configuration.getAuthenticationManager();
}

    /**
     * Define las rutas pÃºblicas y las restricciones de acceso por rol.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                // Permite cargar la tienda y las pÃ¡ginas de cuenta.
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/login",
                    "/login.html",
                    "/registro",
                    "/registro.html",
                    "/styles.css",
                    "/app.js",
                    "/account.js",
                    "/theme.js",
                    "/jwt.js",
                    "/gestion.js",
                    "/favicon.ico"
                ).permitAll()

                // Permite consultar el catÃ¡logo pÃºblico.
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll()

                // Permite preparar la protecciÃ³n CSRF.
                .requestMatchers(HttpMethod.GET, "/api/users/csrf").permitAll()

                // Permite crear cuentas nuevas.
                .requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()

                .requestMatchers(HttpMethod.POST, "/api/users/login").permitAll()

                // Permite la consola H2 durante el desarrollo.
                .requestMatchers("/h2-console/**").permitAll()
                // Solo GERENCIA y ADMIN pueden consultar productos retirados.
                .requestMatchers(HttpMethod.GET, "/api/products/inactive")
                .hasAnyRole("MANAGER", "ADMIN")

                // Restringe la administraciÃ³n de productos al personal autorizado.
                .requestMatchers(HttpMethod.POST, "/api/products")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products/low-stock")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Permite buscar en el catálogo público con JPQL.
                .requestMatchers(HttpMethod.GET, "/api/products/search").permitAll()

                // La administración de usuarios es exclusiva del rol ADMIN.
                .requestMatchers("/api/users", "/api/users/*/role")
                    .hasRole("ADMIN")

                // Exige sesiÃ³n para consultar los datos del usuario actual.
                .requestMatchers("/api/users/me").authenticated()

                // Restringe las operaciones de caja al gerente o administrador.
                .requestMatchers("/api/sales/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Los clientes pueden registrar y consultar sus propios reclamos.
.requestMatchers(HttpMethod.POST, "/api/claims").hasRole("CUSTOMER")
.requestMatchers(HttpMethod.GET, "/api/claims/my-claims").hasRole("CUSTOMER")

// El personal autorizado puede consultar y gestionar reclamos.
.requestMatchers("/api/claims/staff", "/api/claims/staff/**")
    .hasAnyRole("MANAGER", "ADMIN")

// Compatibilidad con la consulta administrativa existente.
.requestMatchers(HttpMethod.GET, "/api/claims")
    .hasAnyRole("MANAGER", "ADMIN")

// Cualquier otra ruta de reclamos queda bloqueada.
.requestMatchers("/api/claims", "/api/claims/**")
    .denyAll()

                // Reserva la gestion administrativa de usuarios al administrador.
                .requestMatchers("/api/approvals/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")

                // Reserva las operaciones propias del gerente.
                .requestMatchers("/api/manager/**")
                    .hasRole("MANAGER")

                // Limita las compras al rol de cliente.
                .requestMatchers("/api/purchases/**")
                    .hasRole("CUSTOMER")

                // Exige autenticaciÃ³n para las demÃ¡s rutas.
                .anyRequest().authenticated()
            )
            // Utiliza nuestra pÃ¡gina de acceso sin cambiar el procesamiento del servidor.
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error")
                .permitAll()
            )
            // Cierra la sesiÃ³n y regresa al formulario de acceso.
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            )
            // Mantiene CSRF activo, excepto para la consola H2.

            .csrf(csrf -> csrf
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/h2-console/**")
                .ignoringRequestMatchers(
                    PathPatternRequestMatcher.withDefaults()
                        .matcher(HttpMethod.POST, "/api/users/login")
                )
            )
            .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> {
            JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

            converter.setJwtGrantedAuthoritiesConverter(token -> {
                String role = token.getClaimAsString("role");

                if (role == null || role.isBlank()) {
                    return java.util.List.of();
                }

                return java.util.List.of(
                    new org.springframework.security.core.authority.SimpleGrantedAuthority(
                        "ROLE_" + role
                    )
                );
            });

                jwt.jwtAuthenticationConverter(converter);
            })
        )

            // Devuelve HTTP 401 para las solicitudes API no autenticadas.
            .exceptionHandling(exceptions -> exceptions
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    PathPatternRequestMatcher.withDefaults().matcher("/api/**")
                )
            )
            // Permite mostrar la consola H2 dentro de un marco.
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            );

        return http.build();
    }
}