package pe.edu.pe.gestion_caja_web.user.admin.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.edu.pe.gestion_caja_web.user.admin.model.UserAdminAudit;

public interface UserAdminAuditRepository
        extends JpaRepository<UserAdminAudit, Long> {

    List<UserAdminAudit> findByRequestIdOrderByCreatedAtDescIdDesc(
            Long requestId);
}