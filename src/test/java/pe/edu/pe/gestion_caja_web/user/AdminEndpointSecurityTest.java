package pe.edu.pe.gestion_caja_web.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminEndpointSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    private String createToken(String username, Role role) {

        User user = userRepository.saveAndFlush(
                new User(
                        username,
                        username + "@example.com",
                        "Password123!",
                        role
                )
        );

        return jwtService.generateToken(
                user.getUsername(),
                user.getRole()
        );
    }

    @Test
    void clienteNoPuedeAprobarDesactivaciones() throws Exception {

        String token = createToken(
                "customer_endpoint_test",
                Role.CUSTOMER
        );

        mockMvc.perform(
                post("/api/approvals/deactivation-requests/1/approve")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
                        .with(
                                SecurityMockMvcRequestPostProcessors.csrf()
                        )
        ).andExpect(status().isForbidden());
    }

    @Test
    void clienteNoPuedeSolicitarDesactivaciones() throws Exception {

        String token = createToken(
                "customer_admin_endpoint_test",
                Role.CUSTOMER
        );

        mockMvc.perform(
                post("/api/admin/users/deactivation-requests")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
                        .with(
                                SecurityMockMvcRequestPostProcessors.csrf()
                        )
                        .contentType("application/json")
                        .content("""
                                {
                                  "targetUserId": 1,
                                  "reason": "Intento no autorizado"
                                }
                                """)
        ).andExpect(status().isForbidden());
    }

    @Autowired
    private AdminUserService adminUserService;

    @Test
    void gerentePuedeAprobarSolicitudPorHttp() throws Exception {

        String adminToken = createToken(
                "admin_http_approval_test",
                Role.ADMIN
        );

        String managerToken = createToken(
                "manager_http_approval_test",
                Role.MANAGER
        );

        User target = userRepository.saveAndFlush(
                new User(
                        "target_http_approval_test",
                        "target_http_approval_test@example.com",
                        "Password123!",
                        Role.CUSTOMER
                )
        );

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        "admin_http_approval_test",
                        target.getId(),
                        "Solicitud para comprobar la aprobacion HTTP."
                );

        mockMvc.perform(
                post("/api/approvals/deactivation-requests/"
                        + request.getId() + "/approve")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + managerToken
                        )
                        .with(
                                SecurityMockMvcRequestPostProcessors.csrf()
                        )
        )
        .andExpect(status().isOk())
        .andExpect(
                org.springframework.test.web.servlet.result
                        .MockMvcResultMatchers.jsonPath("$.status")
                        .value("APPROVED")
        );
    }

    @Test
    void gerentePuedeRechazarSolicitudPorHttp() throws Exception {

        createToken(
                "admin_http_reject_test",
                Role.ADMIN
        );

        String managerToken = createToken(
                "manager_http_reject_test",
                Role.MANAGER
        );

        User target = userRepository.saveAndFlush(
                new User(
                        "target_http_reject_test",
                        "target_http_reject_test@example.com",
                        "Password123!",
                        Role.CUSTOMER
                )
        );

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        "admin_http_reject_test",
                        target.getId(),
                        "Solicitud para comprobar el rechazo HTTP."
                );

        mockMvc.perform(
                post("/api/approvals/deactivation-requests/"
                        + request.getId() + "/reject")
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + managerToken
                        )
                        .with(
                                SecurityMockMvcRequestPostProcessors.csrf()
                        )
        )
        .andExpect(status().isOk())
        .andExpect(
                org.springframework.test.web.servlet.result
                        .MockMvcResultMatchers.jsonPath("$.status")
                        .value("REJECTED")
        );

        // Rechazar una solicitud no debe desactivar al usuario.
        org.junit.jupiter.api.Assertions.assertTrue(
                userRepository.findById(target.getId())
                        .orElseThrow()
                        .isActive()
        );
    }

    @Test
    void clienteNoPuedeConsultarSolicitudesDeDesactivacion() throws Exception {

        String clienteToken = createToken(
                "cliente-consulta-" + java.util.UUID.randomUUID(),
                Role.CUSTOMER
        );

        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/approvals/deactivation-requests")
                        .header("Authorization", "Bearer " + clienteToken)
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isForbidden()
        );
    }

    @Test
    void gerentePuedeConsultarSolicitudesPendientes() throws Exception {

        String gerenteToken = createToken(
                "gerente-consulta-" + java.util.UUID.randomUUID(),
                Role.MANAGER
        );

        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/approvals/deactivation-requests")
                        .param("status", "PENDING")
                        .header("Authorization", "Bearer " + gerenteToken)
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isOk()
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .content().contentTypeCompatibleWith(
                                org.springframework.http.MediaType.APPLICATION_JSON
                        )
        );
    }

    @Test
    void gerentePuedeConsultarHistorialDeDesactivacion() throws Exception {

        String adminUsername =
                "admin-historial-" + java.util.UUID.randomUUID();

        String gerenteUsername =
                "gerente-historial-" + java.util.UUID.randomUUID();

        createToken(adminUsername, Role.ADMIN);

        String gerenteToken = createToken(
                gerenteUsername,
                Role.MANAGER
        );

        String clienteUsername =
                "cliente-historial-" + java.util.UUID.randomUUID();

        createToken(clienteUsername, Role.CUSTOMER);

        Long clienteId = userRepository
                .findByUsername(clienteUsername)
                .orElseThrow()
                .getId();

        UserDeactivationRequest solicitud =
                adminUserService.requestDeactivation(
                        adminUsername,
                        clienteId,
                        "Prueba de historial de auditoria"
                );

        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get(
                                "/api/approvals/deactivation-requests/{id}/history",
                                solicitud.getId()
                        )
                        .header(
                                "Authorization",
                                "Bearer " + gerenteToken
                        )
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isOk()
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$[0].action")
                        .value("REQUEST_DEACTIVATION")
        );
    }

    @Test
    void clienteNoPuedeConsultarHistorialAdministrativo() throws Exception {

        String clienteToken = createToken(
                "cliente-auditoria-" + java.util.UUID.randomUUID(),
                Role.CUSTOMER
        );

        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get(
                                "/api/approvals/deactivation-requests/{id}/history",
                                1L
                        )
                        .header(
                                "Authorization",
                                "Bearer " + clienteToken
                        )
        )
        .andExpect(
                org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .status().isForbidden()
        );
    }
}