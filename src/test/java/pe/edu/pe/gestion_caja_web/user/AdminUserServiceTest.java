package pe.edu.pe.gestion_caja_web.user;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@Transactional
class AdminUserServiceTest {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private UserRepository userRepository;

    private User createUser(String username, Role role) {

        return userRepository.saveAndFlush(
                new User(
                        username,
                        username + "@example.com",
                        "Password123!",
                        role
                )
        );
    }

    @Test
    void adminPuedeSolicitarDesactivacion() {

        User admin = createUser("admin_request_test", Role.ADMIN);
        User target = createUser("target_request_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Cuenta que debe desactivarse."
                );

        assertNotNull(request.getId());
        assertEquals(DeactivationStatus.PENDING, request.getStatus());
        assertEquals(target.getId(), request.getTargetUserId());
    }

    @Test
    void adminNoPuedeAprobarSuPropiaSolicitud() {

        User admin = createUser("admin_self_test", Role.ADMIN);
        User target = createUser("target_self_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Solicitud de prueba."
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.approveDeactivation(
                        admin.getUsername(),
                        request.getId()
                )
        );

        assertEquals(409, error.getStatusCode().value());
    }

    @Test
    void gerentePuedeAprobarSolicitudDeOtroAdmin() {

        User admin = createUser("admin_approval_test", Role.ADMIN);
        User manager = createUser("manager_approval_test", Role.MANAGER);
        User target = createUser("target_approval_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Solicitud para aprobar."
                );

        UserDeactivationRequest approved =
                adminUserService.approveDeactivation(
                        manager.getUsername(),
                        request.getId()
                );

        assertEquals(DeactivationStatus.APPROVED, approved.getStatus());
        assertEquals(manager.getId(), approved.getApprovedByUserId());
    }

    @Test
    void clienteNoPuedeAprobarSolicitud() {

        User admin = createUser("admin_customer_test", Role.ADMIN);
        User customer = createUser("customer_approval_test", Role.CUSTOMER);
        User target = createUser("target_customer_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Solicitud de prueba."
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.approveDeactivation(
                        customer.getUsername(),
                        request.getId()
                )
        );

        assertEquals(403, error.getStatusCode().value());
    }

    @Test
    void noSePuedeEjecutarSolicitudSinAprobar() {

        User admin = createUser("admin_execute_test", Role.ADMIN);
        User target = createUser("target_execute_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Solicitud pendiente."
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.executeDeactivation(
                        admin.getUsername(),
                        request.getId()
                )
        );

        assertEquals(409, error.getStatusCode().value());
        assertTrue(userRepository.findById(target.getId())
                .orElseThrow().isActive());
    }

    @Test
    void adminEjecutaDesactivacionAprobada() {

        User admin = createUser("admin_full_test", Role.ADMIN);
        User manager = createUser("manager_full_test", Role.MANAGER);
        User target = createUser("target_full_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Desactivacion autorizada."
                );

        adminUserService.approveDeactivation(
                manager.getUsername(),
                request.getId()
        );

        UserDeactivationRequest executed =
                adminUserService.executeDeactivation(
                        admin.getUsername(),
                        request.getId()
                );

        assertEquals(
                DeactivationStatus.EXECUTED,
                executed.getStatus()
        );

        assertFalse(
                userRepository.findById(target.getId())
                        .orElseThrow()
                        .isActive()
        );
    }

    @Test
    void puedeDesactivarAdminSiQuedaOtroActivo() {

        User adminA = createUser("admin_a_test", Role.ADMIN);
        User adminB = createUser("admin_b_test", Role.ADMIN);
        User manager = createUser("manager_admin_test", Role.MANAGER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        adminA.getUsername(),
                        adminB.getId(),
                        "Cambio de personal administrativo."
                );

        adminUserService.approveDeactivation(
                manager.getUsername(),
                request.getId()
        );

        UserDeactivationRequest executed =
                adminUserService.executeDeactivation(
                        adminA.getUsername(),
                        request.getId()
                );

        assertEquals(
                DeactivationStatus.EXECUTED,
                executed.getStatus()
        );

        assertFalse(
                userRepository.findById(adminB.getId())
                        .orElseThrow()
                        .isActive()
        );

        assertTrue(
                userRepository.findById(adminA.getId())
                        .orElseThrow()
                        .isActive()
        );
    }

    @Test
    void noPuedeDesactivarAlUltimoAdmin() {

        User adminA = createUser("admin_last_a_test", Role.ADMIN);
        User adminB = createUser("admin_last_b_test", Role.ADMIN);
        User manager = createUser("manager_last_test", Role.MANAGER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        adminA.getUsername(),
                        adminB.getId(),
                        "Solicitud para comprobar el ultimo administrador."
                );

        adminUserService.approveDeactivation(
                manager.getUsername(),
                request.getId()
        );

        // Simulamos que el administrador solicitante
        // deja de estar activo antes de la ejecucion.
        adminA.setActive(false);
        userRepository.saveAndFlush(adminA);

        // El solicitante inactivo no debe poder ejecutar.
        assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.executeDeactivation(
                        adminA.getUsername(),
                        request.getId()
                )
        );

        // El ultimo administrador debe seguir activo.
        assertTrue(
                userRepository.findById(adminB.getId())
                        .orElseThrow()
                        .isActive()
        );
    }

    @Test
    void noPuedeEjecutarDosVecesLaMismaSolicitud() {

        User admin = createUser("admin_double_test", Role.ADMIN);
        User manager = createUser("manager_double_test", Role.MANAGER);
        User target = createUser("target_double_test", Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Comprobar ejecucion duplicada."
                );

        adminUserService.approveDeactivation(
                manager.getUsername(),
                request.getId()
        );

        // Primera ejecucion: debe funcionar.
        adminUserService.executeDeactivation(
                admin.getUsername(),
                request.getId()
        );

        assertFalse(
                userRepository.findById(target.getId())
                        .orElseThrow()
                        .isActive()
        );

        // Segunda ejecucion: debe ser rechazada.
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.executeDeactivation(
                        admin.getUsername(),
                        request.getId()
                )
        );

        assertEquals(409, error.getStatusCode().value());

        // La solicitud debe conservar su estado final.
        assertEquals(
                DeactivationStatus.EXECUTED,
                request.getStatus()
        );
    }

    @Test
    void noPermiteDesactivarAlUltimoAdminActivo() {

        String adminPrincipal =
                "admin-principal-" + java.util.UUID.randomUUID();

        String adminObjetivo =
                "admin-objetivo-" + java.util.UUID.randomUUID();

        String gerente =
                "gerente-proteccion-" + java.util.UUID.randomUUID();

        User principal = createUser(adminPrincipal, Role.ADMIN);
        User objetivo = createUser(adminObjetivo, Role.ADMIN);
        createUser(gerente, Role.MANAGER);

        UserDeactivationRequest solicitud =
                adminUserService.requestDeactivation(
                        adminPrincipal,
                        objetivo.getId(),
                        "Prueba de proteccion del ultimo administrador"
                );

        adminUserService.approveDeactivation(
                gerente,
                solicitud.getId()
        );

        // Desactivamos otros administradores activos de prueba
        // para dejar solamente al administrador objetivo.
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .filter(u -> !u.getId().equals(objetivo.getId()))
                .forEach(u -> u.setActive(false));

        userRepository.flush();

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> adminUserService.executeDeactivation(
                        adminPrincipal,
                        solicitud.getId()
                )
        );

        org.junit.jupiter.api.Assertions.assertTrue(
                userRepository.findById(objetivo.getId())
                        .orElseThrow()
                        .isActive()
        );
    }

    @Test
    void permiteDesactivarAdminCuandoQuedaOtroActivo() {

        String adminEjecutor =
                "admin-ejecutor-" + java.util.UUID.randomUUID();

        String adminObjetivo =
                "admin-objetivo-activo-" + java.util.UUID.randomUUID();

        String gerente =
                "gerente-activo-" + java.util.UUID.randomUUID();

        User ejecutor = createUser(adminEjecutor, Role.ADMIN);
        User objetivo = createUser(adminObjetivo, Role.ADMIN);
        createUser(gerente, Role.MANAGER);

        UserDeactivationRequest solicitud =
                adminUserService.requestDeactivation(
                        adminEjecutor,
                        objetivo.getId(),
                        "Prueba de desactivacion segura de administrador"
                );

        adminUserService.approveDeactivation(
                gerente,
                solicitud.getId()
        );

        UserDeactivationRequest resultado =
                adminUserService.executeDeactivation(
                        adminEjecutor,
                        solicitud.getId()
                );

        org.junit.jupiter.api.Assertions.assertEquals(
                DeactivationStatus.EXECUTED,
                resultado.getStatus()
        );

        org.junit.jupiter.api.Assertions.assertFalse(
                userRepository.findById(objetivo.getId())
                        .orElseThrow()
                        .isActive()
        );

        org.junit.jupiter.api.Assertions.assertTrue(
                userRepository.findById(ejecutor.getId())
                        .orElseThrow()
                        .isActive()
        );
    }
}