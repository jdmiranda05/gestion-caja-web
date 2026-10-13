-- V3: Evitar codigos internos duplicados en los reclamos.
-- Los reclamos antiguos pueden conservar NULL temporalmente.

ALTER TABLE customer_claims
ADD CONSTRAINT uq_customer_claims_internal_code
UNIQUE (internal_code);
