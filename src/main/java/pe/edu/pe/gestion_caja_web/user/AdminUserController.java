package pe.edu.pe.gestion_caja_web.user;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    public record DeactivationRequestBody(
            Long targetUserId,
            String reason
    ) {}

    @PostMapping("/deactivation-requests")
    public ResponseEntity<UserDeactivationRequest> requestDeactivation(
            Principal principal,
            @RequestBody DeactivationRequestBody body) {

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        principal.getName(),
                        body.targetUserId(),
                        body.reason()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(request);
    }

    @PostMapping("/deactivation-requests/{id}/execute")
    public ResponseEntity<UserDeactivationRequest> executeDeactivation(
            Principal principal,
            @PathVariable Long id) {

        UserDeactivationRequest request =
                adminUserService.executeDeactivation(
                        principal.getName(),
                        id
                );

        return ResponseEntity.ok(request);
    }
}