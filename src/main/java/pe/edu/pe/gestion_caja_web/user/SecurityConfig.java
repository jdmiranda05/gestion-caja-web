
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

/**
 * Configura las reglas de acceso, autenticación y protección de la aplicación.
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
     * Define las rutas públicas y las restricciones de acceso por rol.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                // Permite cargar la tienda y las páginas de cuenta.
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
                    "/favicon.ico"
                ).permitAll()

                // Permite consultar el catálogo público.
                .requestMatchers(HttpMethod.GET, "/api/products").permitAll()

                // Permite preparar la protección CSRF.
                .requestMatchers(HttpMethod.GET, "/api/users/csrf").permitAll()

                // Permite crear cuentas nuevas.
                .requestMatchers(HttpMethod.POST, "/api/users/register").permitAll()

                // Permite la consola H2 durante el desarrollo.
                .requestMatchers("/h2-console/**").permitAll()

                // Restringe la administración de productos al personal autorizado.
                .requestMatchers(HttpMethod.POST, "/api/products")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Exige sesión para consultar los datos del usuario actual.
                .requestMatchers("/api/users/me").authenticated()

                // Restringe las operaciones de caja al gerente o administrador.
                .requestMatchers("/api/sales/**")
                    .hasAnyRole("MANAGER", "ADMIN")

                // Limita las compras al rol de cliente.
                .requestMatchers("/api/purchases/**")
                    .hasRole("CUSTOMER")

                // Exige autenticación para las demás rutas.
                .anyRequest().authenticated()
            )
            // Utiliza nuestra página de acceso sin cambiar el procesamiento del servidor.
            .formLogin(form -> form
                .loginPage("/login")
                .defaultSuccessUrl("/", true)
                .failureUrl("/login?error")
                .permitAll()
            )
            // Cierra la sesión y regresa al formulario de acceso.
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout")
                .permitAll()
            )
            // Mantiene CSRF activo, excepto para la consola H2.
            .csrf(csrf -> csrf
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/h2-console/**")
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