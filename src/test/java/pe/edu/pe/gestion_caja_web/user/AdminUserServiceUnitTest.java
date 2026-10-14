package pe.edu.pe.gestion_caja_web.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserDeactivationRequestRepository requestRepository;

    @Mock
    private UserAdminAuditRepository auditRepository;

    @Mock
    private AdminDeactivationLock adminDeactivationLock;

    @InjectMocks
    private AdminUserService adminUserService;

    @Test
    void rechazaDesactivarUltimoAdminActivo() {

        User executor = new User(
                "admin_ejecutor_unit",
                "admin_ejecutor_unit@example.com",
                "Password123!",
                Role.ADMIN
        );

        User target = new User(
                "admin_objetivo_unit",
                "admin_objetivo_unit@example.com",
                "Password123!",
                Role.ADMIN
        );

        // Asignamos IDs para simular usuarios diferentes.
        // Mockito no necesita persistirlos en una base de datos.
        org.springframework.test.util.ReflectionTestUtils.setField(
                executor, "id", 101L
        );

        org.springframework.test.util.ReflectionTestUtils.setField(
                target, "id", 102L
        );

        UserDeactivationRequest request =
                new UserDeactivationRequest(
                        102L,
                        101L,
                        "Verificar proteccion del ultimo ADMIN."
                );

        request.approve(103L);

        when(userRepository.findByUsername("admin_ejecutor_unit"))
                .thenReturn(Optional.of(executor));

        when(requestRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(request));

        when(userRepository.findByIdForUpdate(102L))
                .thenReturn(Optional.of(target));

        when(userRepository.countByRoleAndActiveTrue(Role.ADMIN))
                .thenReturn(1L);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.executeDeactivation(
                        "admin_ejecutor_unit",
                        1L
                )
        );

        assertEquals(409, error.getStatusCode().value());

        assertTrue(target.isActive());

        assertEquals(
                DeactivationStatus.APPROVED,
                request.getStatus()
        );

        verify(userRepository, never()).save(target);

        verifyNoInteractions(auditRepository);

        verify(adminDeactivationLock).acquire();
    }
}