package pe.edu.pe.gestion_caja_web.user;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/approvals/deactivation-requests")
public class DeactivationApprovalController {

    private final AdminUserService adminUserService;
    private final UserDeactivationRequestRepository requestRepository;
    private final UserAdminAuditRepository auditRepository;

    public DeactivationApprovalController(
            AdminUserService adminUserService,
            UserDeactivationRequestRepository requestRepository,
            UserAdminAuditRepository auditRepository) {

        this.adminUserService = adminUserService;
        this.requestRepository = requestRepository;
        this.auditRepository = auditRepository;
    }

    @GetMapping
    public List<UserDeactivationRequest> list(
            @RequestParam(required = false) DeactivationStatus status) {

        if (status != null) {
            return requestRepository
                    .findByStatusOrderByRequestedAtDescIdDesc(status);
        }

        return requestRepository.findAllByOrderByRequestedAtDescIdDesc();
    }

    @GetMapping("/{id}/history")
    public List<UserAdminAudit> history(@PathVariable Long id) {

        if (!requestRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "No se encontro la solicitud."
            );
        }

        return auditRepository
                .findByRequestIdOrderByCreatedAtDescIdDesc(id);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<UserDeactivationRequest> approve(
            Principal principal,
            @PathVariable Long id) {

        UserDeactivationRequest request =
                adminUserService.approveDeactivation(
                        principal.getName(),
                        id
                );

        return ResponseEntity.ok(request);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<UserDeactivationRequest> reject(
            Principal principal,
            @PathVariable Long id) {

        UserDeactivationRequest request =
                adminUserService.rejectDeactivation(
                        principal.getName(),
                        id
                );

        return ResponseEntity.ok(request);
    }
}