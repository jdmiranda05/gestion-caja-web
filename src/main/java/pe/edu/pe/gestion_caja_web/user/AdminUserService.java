package pe.edu.pe.gestion_caja_web.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserDeactivationRequestRepository requestRepository;
    private final UserAdminAuditRepository auditRepository;
    private final AdminDeactivationLock adminDeactivationLock;

    public AdminUserService(
            UserRepository userRepository,
            UserDeactivationRequestRepository requestRepository,
            UserAdminAuditRepository auditRepository,
            AdminDeactivationLock adminDeactivationLock) {

        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.auditRepository = auditRepository;
        this.adminDeactivationLock = adminDeactivationLock;
    }

    /**
     * Solo un ADMIN puede solicitar la desactivacion de una cuenta.
     */
    @Transactional
    public UserDeactivationRequest requestDeactivation(
            String username,
            Long targetUserId,
            String reason) {

        User requester = findActiveUser(username);

        if (requester.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo ADMIN puede solicitar desactivaciones.");
        }

        if (targetUserId == null || targetUserId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El usuario seleccionado no es valido.");
        }

        if (reason == null || reason.isBlank()
                || reason.trim().length() > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El motivo es obligatorio y no debe superar 1000 caracteres.");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontro el usuario."));

        if (!target.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La cuenta ya esta desactivada.");
        }

        if (requester.getId().equals(target.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No puedes solicitar tu propia desactivacion.");
        }

        boolean alreadyRequested =
                requestRepository.existsByTargetUserIdAndStatusIn(
                        targetUserId,
                        List.of(
                                DeactivationStatus.PENDING,
                                DeactivationStatus.APPROVED
                        )
                );

        if (alreadyRequested) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una solicitud pendiente o aprobada.");
        }

        UserDeactivationRequest request =
                requestRepository.save(
                        new UserDeactivationRequest(
                                targetUserId,
                                requester.getId(),
                                reason.trim()
                        )
                );

        auditRepository.save(new UserAdminAudit(
                request.getId(),
                requester.getId(),
                "REQUEST_DEACTIVATION",
                "Se solicito la desactivacion del usuario."
        ));

        return request;
    }

    /**
     * Busca un usuario autenticado y verifica que este activo.
     */
    /**
     * Un MANAGER o ADMIN puede aprobar una solicitud,
     * siempre que no sea quien la solicito.
     */
    @Transactional
    public UserDeactivationRequest approveDeactivation(
            String username,
            Long requestId) {

        User approver = findActiveUser(username);
        validateApprover(approver);

        UserDeactivationRequest request =
                requestRepository.findByIdForUpdate(requestId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No se encontro la solicitud."));

        validateDecision(request, approver);

        request.approve(approver.getId());

        auditRepository.save(new UserAdminAudit(
                request.getId(),
                approver.getId(),
                "APPROVE_DEACTIVATION",
                "Se aprobo la solicitud de desactivacion."
        ));

        return request;
    }

    /**
     * Un MANAGER o ADMIN puede rechazar una solicitud,
     * siempre que no sea quien la solicito.
     */
    @Transactional
    public UserDeactivationRequest rejectDeactivation(
            String username,
            Long requestId) {

        User approver = findActiveUser(username);
        validateApprover(approver);

        UserDeactivationRequest request =
                requestRepository.findByIdForUpdate(requestId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No se encontro la solicitud."));

        validateDecision(request, approver);

        request.reject(approver.getId());

        auditRepository.save(new UserAdminAudit(
                request.getId(),
                approver.getId(),
                "REJECT_DEACTIVATION",
                "Se rechazo la solicitud de desactivacion."
        ));

        return request;
    }

    /**
     * Solo MANAGER y ADMIN pueden decidir solicitudes.
     */
    private void validateApprover(User approver) {

        if (approver.getRole() != Role.MANAGER
                && approver.getRole() != Role.ADMIN) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo MANAGER o ADMIN pueden aprobar o rechazar.");
        }
    }

    /**
     * Impide decisiones propias y cambios de estado invalidos.
     */
    private void validateDecision(
            UserDeactivationRequest request,
            User approver) {

        if (request.getRequestedByUserId()
                .equals(approver.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No puedes aprobar ni rechazar tu propia solicitud.");
        }

        if (request.getStatus() != DeactivationStatus.PENDING) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La solicitud ya fue procesada.");
        }
    }
    /**
     * Ejecuta una desactivacion previamente aprobada.
     * Solo un ADMIN puede realizar esta operacion.
     */
    @Transactional
    public UserDeactivationRequest executeDeactivation(
            String username,
            Long requestId) {

        User executor = findActiveUser(username);

        if (executor.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo ADMIN puede ejecutar desactivaciones.");
        }

        if (requestId == null || requestId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La solicitud no es valida.");
        }

        // Coordina las ejecuciones para evitar desactivaciones simultaneas
        // que puedan dejar al sistema sin administradores activos.
        adminDeactivationLock.acquire();

        UserDeactivationRequest request =
                requestRepository.findByIdForUpdate(requestId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No se encontro la solicitud."));

        if (request.getStatus() != DeactivationStatus.APPROVED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La solicitud debe estar aprobada.");
        }

        User target = userRepository.findByIdForUpdate(
                request.getTargetUserId()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontro el usuario seleccionado."));

        if (!target.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La cuenta ya esta desactivada.");
        }

        if (executor.getId().equals(target.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No puedes desactivar tu propia cuenta.");
        }

        if (target.getRole() == Role.ADMIN) {
            long activeAdmins =
                    userRepository.countByRoleAndActiveTrue(Role.ADMIN);

            if (activeAdmins <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se puede desactivar al ultimo ADMIN activo.");
            }
        }

        target.setActive(false);
        userRepository.save(target);

        request.markExecuted();

        auditRepository.save(new UserAdminAudit(
                request.getId(),
                executor.getId(),
                "EXECUTE_DEACTIVATION",
                "Se desactivo la cuenta del usuario ID "
                        + target.getId()
        ));

        return request;
    }
    private User findActiveUser(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "No se encontro la cuenta autenticada."));

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La cuenta esta desactivada.");
        }

        return user;
    }
}