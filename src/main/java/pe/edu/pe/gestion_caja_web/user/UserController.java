
package pe.edu.pe.gestion_caja_web.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;

/**
 * Gestiona el registro de usuarios y la consulta de la cuenta autenticada.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * Inicializa el controlador con los servicios y el repositorio de usuarios.
     */
    public UserController(
        UserService userService,
        UserRepository userRepository,
        AuthenticationManager authenticationManager,
        JwtService jwtService) {

    this.userService = userService;
    this.userRepository = userRepository;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
}

    /**
     * Registra una cuenta nueva y devuelve sus datos públicos.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword()
            );

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(UserResponse.from(user));

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                .badRequest()
                .body(new ApiError(exception.getMessage()));
        }
    }
    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {

    try {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new IllegalStateException(
                "No se encontro el usuario autenticado."
            ));

        String token = jwtService.generateToken(
            user.getUsername(),
            user.getRole()
        );

        return ResponseEntity.ok(new LoginResponse(token));

    } catch (BadCredentialsException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiError("Usuario o contrasena incorrectos."));
    }
}

    /**
     * Devuelve los datos públicos de la cuenta que inició sesión.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
            .orElseThrow(() -> new IllegalStateException(
                "No se encontró el usuario autenticado."
            ));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Genera y devuelve el token CSRF que debe enviarse en las solicitudes protegidas.
     */
    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return csrfToken;
    }

    /**
     * Representa un mensaje de error que se devuelve al cliente.
     */
    public record ApiError(String message) {
    }
}