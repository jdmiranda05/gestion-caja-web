
package pe.edu.pe.gestion_caja_web.user;

/**
 * Representa la respuesta de una autenticacion JWT exitosa.
 */
public class LoginResponse {

    private final String token;
    private final String tokenType;

    public LoginResponse(String token) {
        this.token = token;
        this.tokenType = "Bearer";
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }
}
