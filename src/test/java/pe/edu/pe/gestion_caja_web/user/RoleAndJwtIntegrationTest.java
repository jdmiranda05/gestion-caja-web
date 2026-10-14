package pe.edu.pe.gestion_caja_web.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Comprueba el login con JWT, los endpoints protegidos y la autorización por rol.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RoleAndJwtIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    private String bearer(String username, Role role) {
        return "Bearer " + jwtService.generateToken(username, role);
    }

    @Test
    void loginDevuelveJwtYElTokenPermiteConsultarElPerfil() throws Exception {
        userService.register("jwt_user", "jwt_user@example.com", "Password123!");

        String body = mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"jwt_user\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn().getResponse().getContentAsString();

        String token = body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("jwt_user"));
    }

    @Test
    void loginConCredencialesIncorrectasDevuelve401() throws Exception {
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nadie\",\"password\":\"incorrecta\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenInvalidoEsRechazado() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer token.invalido.firma"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rutaProtegidaSinTokenDevuelve401() throws Exception {
        mockMvc.perform(get("/api/sales/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerNoPuedeCrearProductosNiVerStockBajo() throws Exception {
        String token = bearer("cliente", Role.CUSTOMER);

        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\",\"price\":1,\"stock\":1}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/products/low-stock")
                .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerPuedeHacerCrudYConsultasJpql() throws Exception {
        String token = bearer("gerente", Role.MANAGER);

        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Producto JPQL\",\"category\":\"Pruebas\",\"price\":2.50,\"stock\":1}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/products/search").param("q", "jpql"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Producto JPQL"));

        mockMvc.perform(get("/api/products/low-stock").param("limit", "1")
                .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='Producto JPQL')]").exists());

        String created = mockMvc.perform(get("/api/products/search").param("q", "jpql"))
                .andReturn().getResponse().getContentAsString();
        String id = created.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(patch("/api/products/" + id + "/stock")
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"units\":9}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(10));

        mockMvc.perform(get("/api/sales/summary")
                .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
    }

    @Test
    void soloAdminAdministraUsuarios() throws Exception {
        User target = userService.register("objetivo", "objetivo@example.com", "Password123!");

        mockMvc.perform(get("/api/users")
                .header(HttpHeaders.AUTHORIZATION, bearer("gerente", Role.MANAGER)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users")
                .header(HttpHeaders.AUTHORIZATION, bearer("admin", Role.ADMIN)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/users/" + target.getId() + "/role")
                .header(HttpHeaders.AUTHORIZATION, bearer("admin", Role.ADMIN))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"MANAGER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));
    }
}
