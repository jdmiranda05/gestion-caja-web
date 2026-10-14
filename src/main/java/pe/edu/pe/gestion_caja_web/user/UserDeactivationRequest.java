package pe.edu.pe.gestion_caja_web.user;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_deactivation_requests")
public class UserDeactivationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_user_id", nullable = false)
    private Long targetUserId;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Column(name = "approved_by_user_id")
    private Long approvedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeactivationStatus status = DeactivationStatus.PENDING;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    protected UserDeactivationRequest() {
    }

    public UserDeactivationRequest(
            Long targetUserId,
            Long requestedByUserId,
            String reason) {

        this.targetUserId = targetUserId;
        this.requestedByUserId = requestedByUserId;
        this.reason = reason;
    }

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    public void approve(Long approverId) {
        this.approvedByUserId = approverId;
        this.status = DeactivationStatus.APPROVED;
        this.decidedAt = LocalDateTime.now();
    }

    public void reject(Long approverId) {
        this.approvedByUserId = approverId;
        this.status = DeactivationStatus.REJECTED;
        this.decidedAt = LocalDateTime.now();
    }

    public void markExecuted() {
        this.status = DeactivationStatus.EXECUTED;
        this.executedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getTargetUserId() {
        return targetUserId;
    }

    public Long getRequestedByUserId() {
        return requestedByUserId;
    }

    public Long getApprovedByUserId() {
        return approvedByUserId;
    }

    public DeactivationStatus getStatus() {
        return status;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public LocalDateTime getExecutedAt() {
        return executedAt;
    }
}