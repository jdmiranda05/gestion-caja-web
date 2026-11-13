package pe.edu.pe.gestion_caja_web.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

import pe.edu.pe.gestion_caja_web.user.model.Role;
import pe.edu.pe.gestion_caja_web.user.model.User;
import pe.edu.pe.gestion_caja_web.user.repository.UserRepository;
import pe.edu.pe.gestion_caja_web.user.security.JwtService;
import pe.edu.pe.gestion_caja_web.user.service.UserService;

/**
 * Verifica el contrato de errores que consume el frontend Angular:
 * 400 con detalle por campo, 401 y 403 en JSON, y el CRUD completo de productos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApiErrorContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    private String bearer(String username, Role role) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.saveAndFlush(new User(username, username + "@example.com", "x", role));
        }
        return "Bearer " + jwtService.generateToken(username, role);
    }

    @Test
    void productoInvalidoDevuelve400ConErroresPorCampo() throws Exception {
        mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, bearer("gerente_val", Role.MANAGER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"category\":\"\",\"price\":-1,\"stock\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.category").exists())
                .andExpect(jsonPath("$.fieldErrors.price").exists())
                .andExpect(jsonPath("$.fieldErrors.stock").exists());
    }

    @Test
    void registroInvalidoDevuelve400ConErroresPorCampo() throws Exception {
        mockMvc.perform(post("/api/users/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"a\",\"email\":\"no-es-correo\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void sinTokenDevuelve401EnJson() throws Exception {
        mockMvc.perform(get("/api/sales"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.WWW_AUTHENTICATE, "Bearer"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void tokenAlteradoDevuelve401() throws Exception {
        mockMvc.perform(get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer token.invalido.firma"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void clienteEnRutaDeGerenteDevuelve403EnJson() throws Exception {
        mockMvc.perform(get("/api/sales")
                .header(HttpHeaders.AUTHORIZATION, bearer("cliente_403", Role.CUSTOMER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void loginDevuelveUsuarioRolYExpiracion() throws Exception {
        userService.register("login_info", "login_info@example.com", "Password123!");

        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"login_info\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("login_info"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    void crudCompletoDeProductoConPersistencia() throws Exception {
        String token = bearer("gerente_crud", Role.MANAGER);

        String body = mockMvc.perform(post("/api/products")
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Pan de molde\",\"category\":\"Panaderia\",\"price\":6.50,\"stock\":12}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String id = body.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(get("/api/products/" + id).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pan de molde"));

        mockMvc.perform(put("/api/products/" + id)
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Pan integral\",\"category\":\"Panaderia\",\"price\":7.00,\"stock\":8}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pan integral"))
                .andExpect(jsonPath("$.stock").value(8));

        mockMvc.perform(delete("/api/products/" + id).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/" + id).header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void productoInexistenteDevuelve404() throws Exception {
        mockMvc.perform(get("/api/products/999999")
                .header(HttpHeaders.AUTHORIZATION, bearer("gerente_404", Role.MANAGER)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Producto no encontrado"));
    }

    @Test
    void ventasDiariasDevuelveSerieCompleta() throws Exception {
        mockMvc.perform(get("/api/sales/daily?days=7")
                .header(HttpHeaders.AUTHORIZATION, bearer("gerente_daily", Role.MANAGER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));
    }
}
