package pe.edu.pe.gestion_caja_web.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface UserDeactivationRequestRepository
        extends JpaRepository<UserDeactivationRequest, Long> {

    List<UserDeactivationRequest> findAllByOrderByRequestedAtDescIdDesc();

    List<UserDeactivationRequest> findByStatusOrderByRequestedAtDescIdDesc(
            DeactivationStatus status);

    boolean existsByTargetUserIdAndStatusIn(
            Long targetUserId,
            List<DeactivationStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM UserDeactivationRequest r WHERE r.id = :id")
    Optional<UserDeactivationRequest> findByIdForUpdate(
            @Param("id") Long id);
}