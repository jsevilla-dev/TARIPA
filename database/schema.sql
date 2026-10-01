CREATE DATABASE IF NOT EXISTS taripa_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taripa_db;

CREATE TABLE rooms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_room_capacity CHECK (capacity > 0)
);

CREATE TABLE tenants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30),
    room_id INT UNSIGNED NULL,
    move_in_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tenants_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE utility_rates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    utility_type ENUM('Electricity', 'Water') NOT NULL,
    rate_per_unit DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rate_positive CHECK (rate_per_unit >= 0),
    UNIQUE KEY uq_utility_rate (utility_type, effective_from)
);

CREATE TABLE meter_readings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL,
    billing_month DATE NOT NULL,

    electricity_previous DECIMAL(12,3) NOT NULL,
    electricity_current DECIMAL(12,3) NOT NULL,

    water_previous DECIMAL(12,3) NOT NULL,
    water_current DECIMAL(12,3) NOT NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_meter_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_electricity_reading
        CHECK (electricity_current >= electricity_previous),

    CONSTRAINT chk_water_reading
        CHECK (water_current >= water_previous),

    UNIQUE KEY uq_meter_tenant_month (tenant_id, billing_month)
);

CREATE TABLE billing_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL,
    billing_month DATE NOT NULL,

    electricity_consumption DECIMAL(12,3) NOT NULL,
    electricity_charge DECIMAL(12,2) NOT NULL,

    water_consumption DECIMAL(12,3) NOT NULL,
    water_charge DECIMAL(12,2) NOT NULL,

    total_amount DECIMAL(12,2) NOT NULL,

    status ENUM('Pending', 'Paid', 'Overdue') NOT NULL DEFAULT 'Pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_billing_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_electricity_consumption
        CHECK (electricity_consumption >= 0),

    CONSTRAINT chk_water_consumption
        CHECK (water_consumption >= 0),

    CONSTRAINT chk_electricity_charge
        CHECK (electricity_charge >= 0),

    CONSTRAINT chk_water_charge
        CHECK (water_charge >= 0),

    CONSTRAINT chk_total_amount
        CHECK (total_amount >= 0),

    UNIQUE KEY uq_billing_tenant_month (tenant_id, billing_month)
);

CREATE TABLE tenant_accounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT UNSIGNED NOT NULL UNIQUE,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ta_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);