package pe.edu.pe.gestion_caja_web.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.pe.gestion_caja_web.user.repository.UserRepository;

/**
 * Solo para desarrollo: si app.seed.reset-staff-password=true, al arrancar
 * vuelve a asignar a las cuentas "admin" y "gerente" la contraseña de
 * app.seed.staff-password (variable STAFF_PASSWORD). No borra ni cambia otros datos.
 * Desactívalo después de usarlo.
 */
@Component
@Order(100)
public class StaffPasswordReset implements ApplicationRunner {

    static final List<String> STAFF_USERNAMES = List.of("admin", "gerente");
    private static final Logger log = LoggerFactory.getLogger(StaffPasswordReset.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String staffPassword;

    public StaffPasswordReset(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.reset-staff-password:false}") boolean enabled,
            @Value("${app.seed.staff-password:}") String staffPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.staffPassword = staffPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        if (staffPassword == null || staffPassword.length() < 8) {
            log.warn("Reinicio de contraseñas omitido: app.seed.staff-password debe tener al menos 8 caracteres.");
            return;
        }
        int updated = reset();
        log.warn("Se reinició la contraseña de {} cuenta(s) del personal ({}). "
                + "Desactiva RESET_STAFF_PASSWORD después de iniciar sesión.", updated, STAFF_USERNAMES);
    }

    /**
     * Actualiza la contraseña de las cuentas del personal que existan.
     *
     * @return número de cuentas actualizadas
     */
    @Transactional
    public int reset() {
        int updated = 0;
        for (String username : STAFF_USERNAMES) {
            var user = userRepository.findByUsername(username);
            if (user.isPresent()) {
                user.get().setPassword(passwordEncoder.encode(staffPassword));
                userRepository.save(user.get());
                updated++;
            }
        }
        return updated;
    }
}
