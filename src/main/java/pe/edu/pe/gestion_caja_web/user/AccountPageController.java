
package pe.edu.pe.gestion_caja_web.user;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Gestiona la navegación hacia las páginas públicas de cuenta.
 */
@Controller
public class AccountPageController {

    /**
     * Muestra la página personalizada de inicio de sesión.
     */
    @GetMapping("/login")
    public String loginPage() {
        return "forward:/login.html";
    }

    /**
     * Muestra la página de registro de clientes.
     */
    @GetMapping("/registro")
    public String registerPage() {
        return "forward:/registro.html";
    }
}