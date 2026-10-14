package pe.edu.pe.gestion_caja_web.user;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class AdminDeactivationLock {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Bloquea el registro comun de coordinacion.
     * Debe ejecutarse dentro de una transaccion existente.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void acquire() {

        int rows = entityManager.createNativeQuery(
                "UPDATE admin_deactivation_lock SET id = id WHERE id = 1"
        ).executeUpdate();

        if (rows != 1) {
            throw new IllegalStateException(
                    "No existe el registro de bloqueo administrativo.");
        }
    }
}