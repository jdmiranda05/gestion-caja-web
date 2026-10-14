package pe.edu.pe.gestion_caja_web.user;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAdminAuditRepository
        extends JpaRepository<UserAdminAudit, Long> {

    List<UserAdminAudit> findByRequestIdOrderByCreatedAtDescIdDesc(
            Long requestId);
}