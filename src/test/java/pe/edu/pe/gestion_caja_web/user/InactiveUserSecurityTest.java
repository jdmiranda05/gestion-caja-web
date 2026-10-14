package pe.edu.pe.gestion_caja_web.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InactiveUserSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void jwtDeUsuarioDesactivadoEsRechazado() throws Exception {

        User user = userRepository.saveAndFlush(
                new User(
                        "inactive_jwt_test",
                        "inactive_jwt_test@example.com",
                        "Password123!",
                        Role.CUSTOMER
                )
        );

        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );

        // La cuenta activa puede usar su JWT.
        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());

        // Se desactiva la cuenta.
        user.setActive(false);
        userRepository.saveAndFlush(user);

        // El mismo JWT debe dejar de funcionar.
        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}