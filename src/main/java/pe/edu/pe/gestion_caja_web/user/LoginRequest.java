
package pe.edu.pe.gestion_caja_web.user;

/**
 * Representa las credenciales enviadas por un usuario
 * para iniciar sesion mediante la API.
 */
public class LoginRequest {

    private String username;
    private String password;

    public LoginRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
