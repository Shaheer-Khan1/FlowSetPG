-- ============================================
-- FlowSet IoT Platform - Complete Schema
-- Multi-tenant device management system
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 1. Core Tenant & Identity
-- ============================================

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) CHECK (role IN ('admin', 'tenant_admin', 'user')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    enabled_modules JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON teams(tenant_id);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('member', 'lead')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- External integrations table
CREATE TABLE IF NOT EXISTS external_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allowed_endpoints JSONB DEFAULT '[]'::jsonb,
    endpoint_urls JSONB DEFAULT '{}'::jsonb,
    source_urls JSONB DEFAULT '[]'::jsonb,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_external_integrations_user_id ON external_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_external_integrations_api_key ON external_integrations(api_key);
CREATE INDEX IF NOT EXISTS idx_external_integrations_is_active ON external_integrations(is_active);

-- ============================================
-- 2. Devices & Installation
-- ============================================

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_type VARCHAR(100),
    name VARCHAR(255),
    provisioning_key VARCHAR(255) UNIQUE,
    provisioning_key_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_provisioned BOOLEAN DEFAULT false,
    
    -- Firmware (denormalized)
    firmware_current_version VARCHAR(50),
    firmware_target_version VARCHAR(50),
    firmware_status VARCHAR(50),
    firmware_last_error TEXT,
    firmware_last_update_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    device_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON devices(device_type);
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);
CREATE INDEX IF NOT EXISTS idx_devices_provisioning_key ON devices(provisioning_key);

-- Devices snapshot (read-only mirror)
CREATE TABLE IF NOT EXISTS devices_snapshot (
    tenant_id UUID NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, device_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_devices_snapshot_created_at ON devices_snapshot(created_at);

-- Installations table
CREATE TABLE IF NOT EXISTS installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID UNIQUE NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    installed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    installation_notes TEXT,
    initial_sensor_readings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installations_device_id ON installations(device_id);
CREATE INDEX IF NOT EXISTS idx_installations_installed_by ON installations(installed_by_user_id);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID UNIQUE NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    city VARCHAR(255),
    country VARCHAR(100),
    accuracy DECIMAL,
    source VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_installation_id ON locations(installation_id);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);

-- ============================================
-- 3. Telemetry & Health
-- ============================================

-- Device data (time-series)
CREATE TABLE IF NOT EXISTS device_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_data_device_id ON device_data(device_id);
CREATE INDEX IF NOT EXISTS idx_device_data_timestamp ON device_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_device_data_device_timestamp ON device_data(device_id, timestamp DESC);

-- Device health
CREATE TABLE IF NOT EXISTS device_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID UNIQUE NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    first_seen_at TIMESTAMP WITH TIME ZONE,
    current_status VARCHAR(50),
    connectivity_score DECIMAL(5,2),
    message_count_24h INTEGER DEFAULT 0,
    message_count_7d INTEGER DEFAULT 0,
    last_battery_level DECIMAL(5,2),
    battery_trend VARCHAR(50),
    uptime_24h_percent DECIMAL(5,2),
    uptime_7d_percent DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_health_device_id ON device_health(device_id);
CREATE INDEX IF NOT EXISTS idx_device_health_last_seen ON device_health(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_device_health_current_status ON device_health(current_status);
CREATE INDEX IF NOT EXISTS idx_device_health_calculated_at ON device_health(calculated_at);

-- ============================================
-- 4. Rules & Alerts
-- ============================================

-- Device rules
CREATE TABLE IF NOT EXISTS device_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    rule_type VARCHAR(50) CHECK (rule_type IN ('event', 'scheduled')),
    cron_schedule VARCHAR(255),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_rules_device_id ON device_rules(device_id);
CREATE INDEX IF NOT EXISTS idx_device_rules_priority ON device_rules(priority);
CREATE INDEX IF NOT EXISTS idx_device_rules_is_active ON device_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_device_rules_next_run ON device_rules(next_run_at);

-- Alert rules
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    condition JSONB NOT NULL,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title_template TEXT,
    message_template TEXT,
    notify_email BOOLEAN DEFAULT false,
    notify_sms BOOLEAN DEFAULT false,
    notify_webhook BOOLEAN DEFAULT false,
    webhook_url TEXT,
    escalation_delay_minutes INTEGER,
    aggregation_window_minutes INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_device_id ON alert_rules(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant_id ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_priority ON alert_rules(priority);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON alert_rules(is_active);

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    message TEXT,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
    trigger_data JSONB,
    alert_metadata JSONB DEFAULT '{}'::jsonb,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    escalated BOOLEAN DEFAULT false,
    aggregated_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered_at ON alerts(triggered_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    channel VARCHAR(50) CHECK (channel IN ('email', 'sms', 'webhook', 'push')),
    recipient VARCHAR(500),
    status VARCHAR(50) CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    subject VARCHAR(500),
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- ============================================
-- 5. Firmware (FOTA)
-- ============================================

-- Firmware versions
CREATE TABLE IF NOT EXISTS firmware_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    file_path TEXT,
    checksum VARCHAR(255),
    file_size_bytes BIGINT,
    release_notes TEXT,
    min_hw_version VARCHAR(50),
    is_recommended BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firmware_device_type ON firmware_versions(device_type);
CREATE INDEX IF NOT EXISTS idx_firmware_version ON firmware_versions(version);
CREATE INDEX IF NOT EXISTS idx_firmware_is_recommended ON firmware_versions(is_recommended);
CREATE INDEX IF NOT EXISTS idx_firmware_is_mandatory ON firmware_versions(is_mandatory);

-- FOTA jobs
CREATE TABLE IF NOT EXISTS fota_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    firmware_version_id UUID NOT NULL REFERENCES firmware_versions(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fota_jobs_tenant_id ON fota_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fota_jobs_status ON fota_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fota_jobs_firmware_version ON fota_jobs(firmware_version_id);

-- FOTA job devices
CREATE TABLE IF NOT EXISTS fota_job_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES fota_jobs(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    status VARCHAR(50) CHECK (status IN ('pending', 'downloading', 'installing', 'success', 'failed')),
    last_error TEXT,
    last_update_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_fota_job_devices_job_id ON fota_job_devices(job_id);
CREATE INDEX IF NOT EXISTS idx_fota_job_devices_device_id ON fota_job_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_fota_job_devices_status ON fota_job_devices(status);

-- ============================================
-- 6. Utility & Billing
-- ============================================

-- Utility tariffs
CREATE TABLE IF NOT EXISTS utility_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    utility_kind VARCHAR(100) NOT NULL,
    rate_per_unit DECIMAL(10, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_utility_tariffs_is_active ON utility_tariffs(is_active);
CREATE INDEX IF NOT EXISTS idx_utility_tariffs_utility_kind ON utility_tariffs(utility_kind);

-- Utility records
CREATE TABLE IF NOT EXISTS utility_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    utility_kind VARCHAR(100) NOT NULL,
    
    -- Contract
    tariff_id UUID REFERENCES utility_tariffs(id) ON DELETE SET NULL,
    contract_start TIMESTAMP WITH TIME ZONE,
    contract_end TIMESTAMP WITH TIME ZONE,
    
    -- Consumption
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    start_index DECIMAL(15, 4),
    end_index DECIMAL(15, 4),
    consumption DECIMAL(15, 4),
    unit VARCHAR(50),
    
    -- Invoice
    amount DECIMAL(15, 2),
    currency VARCHAR(10),
    status VARCHAR(50) CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
    tariff_snapshot JSONB,
    
    -- Meta
    record_type VARCHAR(50) CHECK (record_type IN ('contract', 'consumption', 'invoice')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_utility_records_tenant_id ON utility_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_utility_records_device_id ON utility_records(device_id);
CREATE INDEX IF NOT EXISTS idx_utility_records_utility_kind ON utility_records(utility_kind);
CREATE INDEX IF NOT EXISTS idx_utility_records_period_start ON utility_records(period_start);
CREATE INDEX IF NOT EXISTS idx_utility_records_status ON utility_records(status);
CREATE INDEX IF NOT EXISTS idx_utility_records_record_type ON utility_records(record_type);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_rules_updated_at BEFORE UPDATE ON device_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utility_tariffs_updated_at BEFORE UPDATE ON utility_tariffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_utility_records_updated_at BEFORE UPDATE ON utility_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_integrations_updated_at BEFORE UPDATE ON external_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Permissions
-- ============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowset_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowset_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Complete IoT Platform Schema Created Successfully!';
    RAISE NOTICE '   - Core: tenants, users, teams (4 tables)';
    RAISE NOTICE '   - Devices: devices, installations, locations (4 tables)';
    RAISE NOTICE '   - Telemetry: device_data, device_health (2 tables)';
    RAISE NOTICE '   - Rules: device_rules, alert_rules, alerts, notifications (4 tables)';
    RAISE NOTICE '   - FOTA: firmware_versions, fota_jobs, fota_job_devices (3 tables)';
    RAISE NOTICE '   - Utility: utility_tariffs, utility_records (2 tables)';
    RAISE NOTICE '   Total: 19+ tables with full indexing and constraints';
END $$;
