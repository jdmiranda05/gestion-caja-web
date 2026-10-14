package pe.edu.pe.gestion_caja_web.claim;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import pe.edu.pe.gestion_caja_web.user.User;
import pe.edu.pe.gestion_caja_web.user.UserRepository;
import pe.edu.pe.gestion_caja_web.purchase.CustomerOrderRepository;

class ClaimServiceTest {

    private ClaimRepository claimRepository;
    private ClaimAuditRepository auditRepository;
    private CustomerOrderRepository orderRepository;
    private UserRepository userRepository;
    private ClaimService service;

    @BeforeEach
    void setUp() {
        claimRepository = mock(ClaimRepository.class);
        auditRepository = mock(ClaimAuditRepository.class);
        orderRepository = mock(CustomerOrderRepository.class);
        userRepository = mock(UserRepository.class);

        service = new ClaimService(
                claimRepository,
                auditRepository,
                orderRepository,
                userRepository
        );
    }

    @Test
    void noPermiteResolverReclamoPendiente() {
        Claim claim = mock(Claim.class);

        when(claim.getStatus()).thenReturn(ClaimStatus.PENDING);
        when(claimRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(claim));
        when(userRepository.findByUsername("manager"))
                .thenReturn(Optional.of(mock(User.class)));

        assertThrows(ResponseStatusException.class, () ->
                service.resolveClaim(
                        1L,
                        "manager",
                        new ClaimResolutionRequest(
                                ClaimStatus.RESOLVED,
                                "Respuesta de prueba"
                        )
                )
        );

        verify(auditRepository, never()).save(any());
    }

    @Test
    void noPermiteRespuestaVacia() {
        assertThrows(ResponseStatusException.class, () ->
                service.resolveClaim(
                        1L,
                        "manager",
                        new ClaimResolutionRequest(
                                ClaimStatus.RESOLVED,
                                "   "
                        )
                )
        );

        verify(auditRepository, never()).save(any());
    }

    @Test
    void noPermiteEstadoFinalInvalido() {
        assertThrows(ResponseStatusException.class, () ->
                service.resolveClaim(
                        1L,
                        "manager",
                        new ClaimResolutionRequest(
                                ClaimStatus.IN_REVIEW,
                                "Respuesta de prueba"
                        )
                )
        );

        verify(auditRepository, never()).save(any());
    }
    @Test
void iniciaRevisionYRegistraAuditoria() {
    User reviewer = mock(User.class);
    Claim claim = mock(Claim.class);

    when(reviewer.getId()).thenReturn(5L);
    when(userRepository.findByUsername("manager"))
            .thenReturn(Optional.of(reviewer));

    when(claimRepository.findByIdForUpdate(10L))
            .thenReturn(Optional.of(claim));

    when(claim.getStatus()).thenReturn(ClaimStatus.PENDING);
    when(claim.getId()).thenReturn(10L);

    // Los datos relacionados se simulan para construir la respuesta.
    var order = mock(pe.edu.pe.gestion_caja_web.purchase.CustomerOrder.class);
    var item = mock(pe.edu.pe.gestion_caja_web.purchase.OrderItem.class);

    when(claim.getOrder()).thenReturn(order);
    when(claim.getOrderItem()).thenReturn(item);

    service.startReview(10L, "manager");

    verify(claim).startReview(5L);
    verify(auditRepository).save(argThat(audit ->
            audit.getClaimId().equals(10L)
            && audit.getActorUserId().equals(5L)
            && audit.getPreviousStatus().equals("PENDING")
            && audit.getNewStatus().equals("IN_REVIEW")
            && audit.getAction().equals("START_REVIEW")
    ));
}

@Test
void resuelveReclamoYRegistraAuditoria() {
    User reviewer = mock(User.class);
    Claim claim = mock(Claim.class);

    when(reviewer.getId()).thenReturn(5L);
    when(userRepository.findByUsername("manager"))
            .thenReturn(Optional.of(reviewer));

    when(claimRepository.findByIdForUpdate(10L))
            .thenReturn(Optional.of(claim));

    when(claim.getStatus()).thenReturn(ClaimStatus.IN_REVIEW);
    when(claim.getId()).thenReturn(10L);

    var order = mock(pe.edu.pe.gestion_caja_web.purchase.CustomerOrder.class);
    var item = mock(pe.edu.pe.gestion_caja_web.purchase.OrderItem.class);

    when(claim.getOrder()).thenReturn(order);
    when(claim.getOrderItem()).thenReturn(item);

    service.resolveClaim(
            10L,
            "manager",
            new ClaimResolutionRequest(
                    ClaimStatus.RESOLVED,
                    "Se aprobo la solucion solicitada."
            )
    );

    verify(claim).respond(
            "Se aprobo la solucion solicitada.",
            ClaimStatus.RESOLVED
    );

    verify(auditRepository).save(argThat(audit ->
            audit.getClaimId().equals(10L)
            && audit.getActorUserId().equals(5L)
            && audit.getPreviousStatus().equals("IN_REVIEW")
            && audit.getNewStatus().equals("RESOLVED")
            && audit.getAction().equals("RESOLVE_CLAIM")
    ));
}
}