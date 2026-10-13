-- V2: Agregar codigo interno de seguimiento a los reclamos.
-- Se permiten valores NULL para conservar los reclamos existentes.

ALTER TABLE customer_claims
ADD COLUMN internal_code VARCHAR(20);
