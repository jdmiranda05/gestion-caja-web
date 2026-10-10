package pe.edu.pe.gestion_caja_web.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Provides database access operations for users.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by username.
     */
    Optional<User> findByUsername(String username);

    /**
     * Checks whether a username already exists.
     */
    boolean existsByUsername(String username);

    /**
     * Checks whether an email already exists.
     */
    boolean existsByEmail(String email);
}