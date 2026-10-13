-- V4: Asignar codigos internos a reclamos historicos.
-- El codigo se genera a partir del ID de cada reclamo.
-- Los reclamos con codigo existente no se modifican.

UPDATE customer_claims
SET internal_code = 'REC-' ||
    REPEAT('0', 6 - LENGTH(CAST(id AS VARCHAR))) ||
    CAST(id AS VARCHAR)
WHERE internal_code IS NULL
  AND id BETWEEN 1 AND 999999;
