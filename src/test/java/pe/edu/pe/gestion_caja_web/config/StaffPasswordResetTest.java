package pe.edu.pe.gestion_caja_web.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.pe.gestion_caja_web.user.model.Role;
import pe.edu.pe.gestion_caja_web.user.model.User;
import pe.edu.pe.gestion_caja_web.user.repository.UserRepository;

/**
 * Comprueba que el reinicio de contraseñas del personal solo actúa cuando se activa
 * y que únicamente modifica las cuentas "admin" y "gerente".
 */
@SpringBootTest
@Transactional
class StaffPasswordResetTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User saveUser(String username, Role role, String rawPassword) {
        User user = userRepository.findByUsername(username).orElseGet(() ->
                new User(username, username + "@reset.test", "", role));
        user.setPassword(passwordEncoder.encode(rawPassword));
        return userRepository.saveAndFlush(user);
    }

    @Test
    void activadoReasignaLaContrasenaSoloAlPersonal() {
        saveUser("admin", Role.ADMIN, "ClaveOlvidada1");
        saveUser("gerente", Role.MANAGER, "ClaveOlvidada2");
        saveUser("cliente_reset", Role.CUSTOMER, "ClaveCliente1");

        new StaffPasswordReset(userRepository, passwordEncoder, true, "NuevaClave2026")
                .run(new DefaultApplicationArguments());

        assertTrue(passwordEncoder.matches("NuevaClave2026", userRepository.findByUsername("admin").orElseThrow().getPassword()));
        assertTrue(passwordEncoder.matches("NuevaClave2026", userRepository.findByUsername("gerente").orElseThrow().getPassword()));
        assertTrue(passwordEncoder.matches("ClaveCliente1", userRepository.findByUsername("cliente_reset").orElseThrow().getPassword()));
    }

    @Test
    void desactivadoNoCambiaNada() {
        saveUser("admin", Role.ADMIN, "ClaveOriginal1");

        new StaffPasswordReset(userRepository, passwordEncoder, false, "NuevaClave2026")
                .run(new DefaultApplicationArguments());

        String hash = userRepository.findByUsername("admin").orElseThrow().getPassword();
        assertTrue(passwordEncoder.matches("ClaveOriginal1", hash));
        assertFalse(passwordEncoder.matches("NuevaClave2026", hash));
    }

    @Test
    void contrasenaCortaSeIgnora() {
        saveUser("admin", Role.ADMIN, "ClaveOriginal1");

        StaffPasswordReset reset = new StaffPasswordReset(userRepository, passwordEncoder, true, "corta");
        reset.run(new DefaultApplicationArguments());

        assertTrue(passwordEncoder.matches("ClaveOriginal1", userRepository.findByUsername("admin").orElseThrow().getPassword()));
        assertEquals(2, StaffPasswordReset.STAFF_USERNAMES.size());
    }
}
