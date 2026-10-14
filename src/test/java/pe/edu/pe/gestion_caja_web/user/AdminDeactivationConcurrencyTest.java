package pe.edu.pe.gestion_caja_web.user;

import static org.junit.jupiter.api.Assertions.*;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
class AdminDeactivationConcurrencyTest {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDeactivationRequestRepository requestRepository;

    private User createUser(String username, Role role) {
        return userRepository.saveAndFlush(
                new User(
                        username,
                        username + "@example.com",
                        "Password123!",
                        role
                )
        );
    }

    @Test
    void dosEjecucionesSimultaneasNoDuplicanDesactivacion()
            throws Exception {

        String suffix = java.util.UUID.randomUUID().toString();

        User admin = createUser("admin_concurrent_" + suffix, Role.ADMIN);
        User manager = createUser("manager_concurrent_" + suffix, Role.MANAGER);
        User target = createUser("target_concurrent_" + suffix, Role.CUSTOMER);

        UserDeactivationRequest request =
                adminUserService.requestDeactivation(
                        admin.getUsername(),
                        target.getId(),
                        "Prueba de ejecucion concurrente."
                );

        adminUserService.approveDeactivation(
                manager.getUsername(),
                request.getId()
        );

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);

        try {
            java.util.concurrent.Callable<Boolean> task = () -> {
                start.await();

                try {
                    adminUserService.executeDeactivation(
                            admin.getUsername(),
                            request.getId()
                    );
                    return true;
                } catch (ResponseStatusException ex) {
                    return false;
                } catch (org.springframework.dao.DataAccessException ex) {
                    return false;
                }
            };

            Future<Boolean> first = executor.submit(task);
            Future<Boolean> second = executor.submit(task);

            start.countDown();

            boolean firstResult = first.get(30, TimeUnit.SECONDS);
            boolean secondResult = second.get(30, TimeUnit.SECONDS);

            assertNotEquals(
                    firstResult,
                    secondResult,
                    "Solo una ejecucion debe completarse correctamente."
            );

            assertFalse(
                    userRepository.findById(target.getId())
                            .orElseThrow()
                            .isActive()
            );

            assertEquals(
                    DeactivationStatus.EXECUTED,
                    requestRepository.findById(request.getId())
                            .orElseThrow()
                            .getStatus()
            );

        } finally {
            executor.shutdownNow();
        }
    }
}