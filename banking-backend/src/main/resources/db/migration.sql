CREATE TABLE IF NOT EXISTS customer_creation_requests (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    status VARCHAR(64) NOT NULL,
    reviewed_by VARCHAR(255),
    rejection_reason VARCHAR(2000),
    created_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    customer_id BIGINT REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    recipient_role VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    type VARCHAR(128) NOT NULL,
    reference_type VARCHAR(128),
    reference_id BIGINT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS requested_by VARCHAR(255);
ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(255);
ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES bank_accounts(id);
UPDATE account_requests SET requested_by = COALESCE(requested_by, reviewed_by_maker, 'legacy') WHERE requested_by IS NULL;
UPDATE account_requests SET requested_by_name = COALESCE(requested_by_name, requested_by, 'Maker') WHERE requested_by_name IS NULL;
ALTER TABLE account_requests ALTER COLUMN requested_by SET NOT NULL;
