package pe.edu.pe.gestion_caja_web.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gestiona las operaciones relacionadas con los usuarios.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Inicializa el servicio con el repositorio y el codificador de contraseñas.
     */
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registra un usuario nuevo con contraseña protegida y rol CUSTOMER.
     */
    @Transactional
    public User register(String username, String email, String rawPassword) {
        String normalizedUsername = username == null ? "" : username.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        String password = rawPassword == null ? "" : rawPassword;

        if (normalizedUsername.isBlank()) {
            throw new IllegalArgumentException("El nombre de usuario es obligatorio.");
        }

        if (normalizedEmail.isBlank() || !normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Ingresa un correo electrónico válido.");
        }

        if (password.length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres.");
        }

        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("El nombre de usuario ya está registrado.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("El correo electrónico ya está registrado.");
        }

        String encodedPassword = passwordEncoder.encode(password);

        User user = new User(
                normalizedUsername,
                normalizedEmail,
                encodedPassword,
                Role.CUSTOMER
        );

        return userRepository.save(user);
    }

    /**
     * Lista todos los usuarios sin exponer sus contraseñas.
     */
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    /**
     * Cambia el rol de un usuario existente.
     */
    @Transactional
    public UserResponse changeRole(Long id, Role role, String currentUsername) {
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rol es obligatorio.");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado."));

        if (user.getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No puedes cambiar tu propio rol.");
        }

        user.setRole(role);
        return UserResponse.from(userRepository.save(user));
    }
}