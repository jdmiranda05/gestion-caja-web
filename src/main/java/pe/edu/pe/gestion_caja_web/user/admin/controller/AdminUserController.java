package pe.edu.pe.gestion_caja_web.user.admin.controller;

import jakarta.validation.Valid;
import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import pe.edu.pe.gestion_caja_web.user.admin.model.UserDeactivationRequest;
import pe.edu.pe.gestion_caja_web.user.admin.service.AdminUserService;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    public record DeactivationRequestBody(
            @jakarta.validation.constraints.NotNull(message = "Selecciona el usuario.")
            Long targetUserId,
            @jakarta.validation.constraints.NotBlank(message = "Indica el motivo de la desactivacion.")
            @jakarta.validation.constraints.Size(max = 255, message = "El motivo admite como maximo 255 caracteres.")
            String reason
    ) {}

    @PostMapping("/deactivation-requests")
    public ResponseEntity<UserDeactivationRequest> requestDeactivation(
            Principal principal,
            @Valid @RequestBody DeactivationRequestBody body) {

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