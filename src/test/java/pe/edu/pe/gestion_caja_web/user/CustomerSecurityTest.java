package pe.edu.pe.gestion_caja_web.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
class CustomerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    private String customerToken() {

        User customer = userService.register(
                "customer_test",
                "customer_test@example.com",
                "Password123!"
        );

        return "Bearer " + jwtService.generateToken(
                customer.getUsername(),
                customer.getRole()
        );
    }

    @Test
    void visitanteNoPuedeConsultarSuPerfil() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerAutenticadoPuedeConsultarSuPerfil() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, customerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("customer_test"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void customerNoPuedeAccederAVentas() throws Exception {
        mockMvc.perform(get("/api/sales")
                .header(HttpHeaders.AUTHORIZATION, customerToken()))
                .andExpect(status().isForbidden());
    }
}