-- Sample data for IoT Platform

-- Insert sample tenants
INSERT INTO tenants (id, name, code, country, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'ACME', 'USA', true),
    ('22222222-2222-2222-2222-222222222222', 'TechFlow Industries', 'TECH', 'Canada', true),
    ('33333333-3333-3333-3333-333333333333', 'Global IoT Solutions', 'GLOB', 'UK', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample users (no passwords in dev mode)
INSERT INTO users (id, email, full_name, role, tenant_id, is_active) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@acme.com', 'Admin User', 'admin', NULL, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant1@acme.com', 'Acme Admin', 'tenant_admin', '11111111-1111-1111-1111-111111111111', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'tenant2@techflow.com', 'TechFlow Admin', 'tenant_admin', '22222222-2222-2222-2222-222222222222', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'user1@acme.com', 'John Doe', 'user', '11111111-1111-1111-1111-111111111111', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'user2@acme.com', 'Jane Smith', 'user', '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample teams
INSERT INTO teams (id, tenant_id, name, description) VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Installation Team Alpha', 'Primary installation team'),
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Monitoring Team Beta', 'Device monitoring team'),
    ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'TechFlow Operations', 'Operations team')
ON CONFLICT (id) DO NOTHING;

-- Insert team members
INSERT INTO team_members (team_id, user_id, role) VALUES
    ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'lead'),
    ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'member'),
    ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'lead')
ON CONFLICT DO NOTHING;

-- Insert sample devices
INSERT INTO devices (id, device_id, tenant_id, device_type, name, is_active, is_provisioned, firmware_current_version) VALUES
    ('77777777-7777-7777-7777-777777777777', 'SENSOR-001', '11111111-1111-1111-1111-111111111111', 'flood_sensor', 'Downtown Sensor #1', true, true, '1.2.3'),
    ('88888888-8888-8888-8888-888888888888', 'SENSOR-002', '11111111-1111-1111-1111-111111111111', 'flood_sensor', 'Riverside Sensor #2', true, true, '1.2.3'),
    ('99999999-9999-9999-9999-999999999999', 'SENSOR-003', '11111111-1111-1111-1111-111111111111', 'flood_sensor', 'Industrial Zone #3', true, true, '1.2.2'),
    ('10101010-1010-1010-1010-101010101010', 'SENSOR-004', '22222222-2222-2222-2222-222222222222', 'temperature_sensor', 'TechFlow Temp #1', true, true, '2.0.1'),
    ('20202020-2020-2020-2020-202020202020', 'SENSOR-005', '11111111-1111-1111-1111-111111111111', 'flood_sensor', 'Pending Installation', true, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert installations
INSERT INTO installations (id, device_id, installed_by_user_id, installation_notes, initial_sensor_readings) VALUES
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Installed on main street', '{"water_level": 25.5, "battery": 98}'),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Installed near river', '{"water_level": 30.2, "battery": 100}'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Industrial area installation', '{"water_level": 22.0, "battery": 95}'),
    ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '10101010-1010-1010-1010-101010101010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Temperature monitoring', '{"temperature": 22.5, "humidity": 65}')
ON CONFLICT (id) DO NOTHING;

-- Insert locations
INSERT INTO locations (installation_id, latitude, longitude, address, city, country, source) VALUES
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 14.5995, 120.9842, '123 Main Street', 'Metro City', 'Philippines', 'gps'),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 14.6091, 121.0223, '456 Riverside Ave', 'Metro City', 'Philippines', 'gps'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 14.5500, 121.0500, '789 Industrial Rd', 'Tech Valley', 'Philippines', 'gps'),
    ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 43.6532, -79.3832, '100 Tech Street', 'Toronto', 'Canada', 'gps')
ON CONFLICT (installation_id) DO NOTHING;

-- Insert device health data
INSERT INTO device_health (device_id, last_seen_at, first_seen_at, current_status, connectivity_score, message_count_24h, uptime_24h_percent) VALUES
    ('77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '30 days', 'online', 98.5, 144, 99.2),
    ('88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '25 days', 'online', 99.1, 143, 99.8),
    ('99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '20 days', 'degraded', 85.2, 120, 92.5),
    ('10101010-1010-1010-1010-101010101010', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '15 days', 'online', 97.3, 142, 98.5)
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample device data (recent readings)
INSERT INTO device_data (device_id, timestamp, data) VALUES
    ('77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '5 minutes', '{"water_level": 26.3, "battery": 97, "temperature": 25}'),
    ('77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '15 minutes', '{"water_level": 26.1, "battery": 97, "temperature": 25}'),
    ('88888888-8888-8888-8888-888888888888', NOW() - INTERVAL '2 minutes', '{"water_level": 31.5, "battery": 99, "temperature": 24}'),
    ('99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '1 hour', '{"water_level": 45.2, "battery": 94, "temperature": 26}'),
    ('10101010-1010-1010-1010-101010101010', NOW() - INTERVAL '10 minutes', '{"temperature": 23.1, "humidity": 67}')
ON CONFLICT DO NOTHING;

-- Insert sample alert rules
INSERT INTO alert_rules (id, name, description, tenant_id, condition, priority, title_template, is_active) VALUES
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'High Water Level', 'Alert when water level exceeds threshold', '11111111-1111-1111-1111-111111111111', '{"field": "water_level", "operator": ">", "value": 40}', 'high', 'High Water Level Detected', true),
    ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Low Battery', 'Alert when battery drops below 20%', '11111111-1111-1111-1111-111111111111', '{"field": "battery", "operator": "<", "value": 20}', 'medium', 'Low Battery Warning', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample alert
INSERT INTO alerts (rule_id, device_id, tenant_id, title, message, priority, status, trigger_data) VALUES
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 
     'High Water Level Detected', 'Water level at 45.2cm exceeds threshold of 40cm', 'high', 'open', 
     '{"water_level": 45.2, "threshold": 40}')
ON CONFLICT DO NOTHING;

-- Insert firmware versions
INSERT INTO firmware_versions (device_type, name, version, release_notes, is_recommended) VALUES
    ('flood_sensor', 'Flood Sensor Firmware v1.2.3', '1.2.3', 'Bug fixes and performance improvements', true),
    ('flood_sensor', 'Flood Sensor Firmware v1.2.4', '1.2.4', 'New features: battery optimization', false),
    ('temperature_sensor', 'Temperature Sensor v2.0.1', '2.0.1', 'Initial release', true)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Sample data inserted successfully!';
    RAISE NOTICE '   - 3 tenants';
    RAISE NOTICE '   - 5 users (admin, tenant admins, users)';
    RAISE NOTICE '   - 3 teams with members';
    RAISE NOTICE '   - 5 devices (4 installed, 1 pending)';
    RAISE NOTICE '   - 4 installations with locations';
    RAISE NOTICE '   - Device health & telemetry data';
    RAISE NOTICE '   - Alert rules and 1 active alert';
    RAISE NOTICE '   - Firmware versions';
END $$;
