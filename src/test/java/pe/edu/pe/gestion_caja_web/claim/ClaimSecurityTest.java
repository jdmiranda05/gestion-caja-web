package pe.edu.pe.gestion_caja_web.claim;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.pe.gestion_caja_web.user.JwtService;
import pe.edu.pe.gestion_caja_web.user.Role;
import pe.edu.pe.gestion_caja_web.user.User;
import pe.edu.pe.gestion_caja_web.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClaimSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    private String token(Role role) {

        String username = "security_test_" + role.name().toLowerCase();

        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(
                        new User(
                                username,
                                username + "@example.com",
                                "Password123!",
                                role
                        )
                ));

        return "Bearer " + jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );
    }

    @Test
    void visitanteNoPuedeConsultarReclamosAdministrativos() throws Exception {
        mockMvc.perform(get("/api/claims/staff"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerNoPuedeConsultarReclamosAdministrativos() throws Exception {
        mockMvc.perform(get("/api/claims/staff")
                .header(HttpHeaders.AUTHORIZATION, token(Role.CUSTOMER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerPuedeConsultarReclamosAdministrativos() throws Exception {
        mockMvc.perform(get("/api/claims/staff")
                .header(HttpHeaders.AUTHORIZATION, token(Role.MANAGER)))
                .andExpect(status().isOk());
    }

    @Test
    void adminPuedeConsultarReclamosAdministrativos() throws Exception {
        mockMvc.perform(get("/api/claims/staff")
                .header(HttpHeaders.AUTHORIZATION, token(Role.ADMIN)))
                .andExpect(status().isOk());
    }

    @Test
    void customerNoPuedeIniciarRevision() throws Exception {
        mockMvc.perform(post("/api/claims/staff/1/review")
                .header(HttpHeaders.AUTHORIZATION, token(Role.CUSTOMER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerNoPuedeResolverReclamos() throws Exception {
        mockMvc.perform(post("/api/claims/staff/1/resolve")
                .header(HttpHeaders.AUTHORIZATION, token(Role.CUSTOMER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "status": "RESOLVED",
                          "response": "Respuesta de prueba"
                        }
                        """))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerNoPuedeConsultarHistorial() throws Exception {
        mockMvc.perform(get("/api/claims/staff/1/history")
                .header(HttpHeaders.AUTHORIZATION, token(Role.CUSTOMER)))
                .andExpect(status().isForbidden());
    }
}