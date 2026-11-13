package pe.edu.pe.gestion_caja_web.user.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import pe.edu.pe.gestion_caja_web.common.ApiErrorResponse;
import pe.edu.pe.gestion_caja_web.user.dto.LoginRequest;
import pe.edu.pe.gestion_caja_web.user.dto.LoginResponse;
import pe.edu.pe.gestion_caja_web.user.dto.RegisterRequest;
import pe.edu.pe.gestion_caja_web.user.dto.RoleRequest;
import pe.edu.pe.gestion_caja_web.user.dto.UserResponse;
import pe.edu.pe.gestion_caja_web.user.model.User;
import pe.edu.pe.gestion_caja_web.user.repository.UserRepository;
import pe.edu.pe.gestion_caja_web.user.security.JwtService;
import pe.edu.pe.gestion_caja_web.user.service.UserService;

/**
 * Registro, inicio de sesión con JWT y consulta de usuarios.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

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
     * Registra una cuenta de cliente. Los errores de validación los
     * convierte GlobalExceptionHandler en un 400 con detalle por campo.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword());

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    /**
     * Valida las credenciales contra la base de datos y emite un JWT firmado (HS256).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() -> new IllegalStateException("No se encontró el usuario autenticado."));

            Instant expiresAt = jwtService.expirationFromNow();
            String token = jwtService.generateToken(user.getUsername(), user.getRole());

            return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole(), expiresAt));

        } catch (DisabledException exception) {
            return unauthorized("Tu cuenta está desactivada. Comunícate con el administrador.", http);
        } catch (BadCredentialsException exception) {
            return unauthorized("Usuario o contraseña incorrectos.", http);
        } catch (AuthenticationException exception) {
            return unauthorized("No se pudo iniciar sesión.", http);
        }
    }

    /**
     * Lista los usuarios registrados (solo ADMIN).
     */
    @GetMapping
    public List<UserResponse> list() {
        return userService.findAll();
    }

    /**
     * Cambia el rol de un usuario (solo ADMIN).
     */
    @PutMapping("/{id}/role")
    public UserResponse changeRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleRequest request,
            Authentication authentication) {
        return userService.changeRole(id, request.role(), authentication.getName());
    }

    /**
     * Devuelve los datos públicos de la cuenta que inició sesión.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("No se encontró el usuario autenticado."));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    private ResponseEntity<ApiErrorResponse> unauthorized(String message, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiErrorResponse.of(401, "Unauthorized", message, http.getRequestURI()));
    }
}
