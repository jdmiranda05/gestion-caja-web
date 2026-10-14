-- V8: Registro comun para coordinar desactivaciones de ADMIN.

CREATE TABLE admin_deactivation_lock (
    id BIGINT PRIMARY KEY
);

-- Todas las operaciones utilizaran este mismo registro.
INSERT INTO admin_deactivation_lock (id) VALUES (1);