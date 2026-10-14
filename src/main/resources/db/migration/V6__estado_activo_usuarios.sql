-- V6: Estado de activacion de las cuentas de usuario.
-- Las cuentas existentes permanecen activas.

ALTER TABLE users
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;