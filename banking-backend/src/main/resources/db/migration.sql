CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255),
    account_type VARCHAR(255),
    balance DOUBLE PRECISION,
    status VARCHAR(255),
    created_at TIMESTAMP,
    customer_id BIGINT REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id BIGSERIAL PRIMARY KEY,
    amount DOUBLE PRECISION,
    type VARCHAR(255),
    counterparty_account VARCHAR(255),
    reference_id VARCHAR(255),
    description VARCHAR(2000),
    created_at TIMESTAMP,
    balance_after DOUBLE PRECISION,
    account_id BIGINT REFERENCES bank_accounts(id)
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    account_number VARCHAR(255),
    bank_name VARCHAR(255),
    customer_id BIGINT REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS account_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    account_type VARCHAR(255) NOT NULL,
    remarks VARCHAR(2000),
    status VARCHAR(64) NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    requested_by VARCHAR(255),
    requested_by_name VARCHAR(255),
    reviewed_by_maker VARCHAR(255),
    reviewed_at TIMESTAMP,
    approved_by_checker VARCHAR(255),
    approved_at TIMESTAMP,
    rejection_reason VARCHAR(2000),
    account_id BIGINT REFERENCES bank_accounts(id)
);

CREATE TABLE IF NOT EXISTS consent_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    account_id BIGINT NOT NULL REFERENCES bank_accounts(id),
    beneficiary_id BIGINT REFERENCES beneficiaries(id),
    consent_type VARCHAR(128) NOT NULL,
    status VARCHAR(64) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    requested_by_name VARCHAR(255),
    reviewed_by VARCHAR(255),
    rejection_reason VARCHAR(2000),
    requested_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    expires_at TIMESTAMP
);
ALTER TABLE consent_requests ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION;

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

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(128),
    entity_id BIGINT,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS requested_by VARCHAR(255);
ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS requested_by_name VARCHAR(255);
ALTER TABLE account_requests ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES bank_accounts(id);
UPDATE account_requests SET requested_by = COALESCE(requested_by, reviewed_by_maker, 'legacy') WHERE requested_by IS NULL;
UPDATE account_requests SET requested_by_name = COALESCE(requested_by_name, requested_by, 'Maker') WHERE requested_by_name IS NULL;
ALTER TABLE account_requests ALTER COLUMN requested_by SET NOT NULL;

CREATE TABLE IF NOT EXISTS transfers (
    id BIGSERIAL PRIMARY KEY,
    reference_number VARCHAR(64) NOT NULL UNIQUE,
    source_account_id BIGINT NOT NULL REFERENCES bank_accounts(id),
    destination_account_id BIGINT NOT NULL REFERENCES bank_accounts(id),
    amount DOUBLE PRECISION NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(64) NOT NULL,
    initiated_by VARCHAR(255) NOT NULL,
    initiated_by_name VARCHAR(255),
    approved_by VARCHAR(255),
    created_at TIMESTAMP,
    completed_at TIMESTAMP,
    rejection_reason VARCHAR(2000)
);

ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS ifsc VARCHAR(32);

CREATE TABLE IF NOT EXISTS transaction_requests (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES bank_accounts(id),
    amount DOUBLE PRECISION NOT NULL,
    type VARCHAR(32) NOT NULL,
    description VARCHAR(2000),
    reference_number VARCHAR(96) NOT NULL UNIQUE,
    status VARCHAR(64) NOT NULL,
    requested_by VARCHAR(255) NOT NULL,
    requested_by_name VARCHAR(255),
    approved_by VARCHAR(255),
    rejection_reason VARCHAR(2000),
    created_at TIMESTAMP NOT NULL,
    reviewed_at TIMESTAMP,
    transaction_id BIGINT REFERENCES bank_transactions(id)
);
