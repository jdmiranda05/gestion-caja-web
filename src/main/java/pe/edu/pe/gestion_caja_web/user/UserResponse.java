package pe.edu.pe.gestion_caja_web.user;

/**
 * Representa los datos públicos de un usuario.
 */
public class UserResponse {

    private final Long id;
    private final String username;
    private final String email;
    private final Role role;

    /**
     * Construye una respuesta sin exponer la contraseña del usuario.
     */
    public UserResponse(Long id, String username, String email, Role role) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    /**
     * Obtiene el identificador del usuario.
     */
    public Long getId() {
        return id;
    }

    /**
     * Obtiene el nombre de usuario.
     */
    public String getUsername() {
        return username;
    }

    /**
     * Obtiene el correo electrónico.
     */
    public String getEmail() {
        return email;
    }

    /**
     * Obtiene el rol asignado por el servidor.
     */
    public Role getRole() {
        return role;
    }

    /**
     * Convierte una entidad de usuario en una respuesta pública.
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }
}