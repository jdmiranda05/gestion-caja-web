package pe.edu.pe.gestion_caja_web.claim;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Registra el historial de acciones administrativas sobre reclamos.
 */
@Entity
@Table(name = "claim_audit_history")
public class ClaimAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_id", nullable = false)
    private Long claimId;

    @Column(name = "actor_user_id", nullable = false)
    private Long actorUserId;

    @Column(name = "previous_status", nullable = false, length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(length = 2000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ClaimAudit() {
    }

    public ClaimAudit(
            Long claimId,
            Long actorUserId,
            ClaimStatus previousStatus,
            ClaimStatus newStatus,
            String action,
            String details) {

        this.claimId = claimId;
        this.actorUserId = actorUserId;
        this.previousStatus = previousStatus.name();
        this.newStatus = newStatus.name();
        this.action = action;
        this.details = details;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public String getAction() {
        return action;
    }

    public String getDetails() {
        return details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}