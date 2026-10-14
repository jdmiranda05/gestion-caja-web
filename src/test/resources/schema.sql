CREATE TABLE IF NOT EXISTS admin_deactivation_lock (
    id BIGINT PRIMARY KEY
);

MERGE INTO admin_deactivation_lock (id)
KEY (id) VALUES (1);