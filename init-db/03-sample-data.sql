-- Sample data for FlowSet application

-- Insert sample teams
INSERT INTO teams (id, name, description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Team Alpha', 'Main installation team'),
    ('22222222-2222-2222-2222-222222222222', 'Team Beta', 'Secondary installation team'),
    ('33333333-3333-3333-3333-333333333333', 'Team Gamma', 'Special projects team')
ON CONFLICT DO NOTHING;

-- Insert sample locations
INSERT INTO locations (id, location_id, name, municipality_name, latitude, longitude) VALUES
    ('44444444-4444-4444-4444-444444444444', 'LOC001', 'Downtown District', 'Metro City', 14.5995, 120.9842),
    ('55555555-5555-5555-5555-555555555555', 'LOC002', 'Riverside Area', 'Metro City', 14.6091, 121.0223),
    ('66666666-6666-6666-6666-666666666666', 'LOC003', 'Industrial Zone', 'Tech Valley', 14.5500, 121.0500)
ON CONFLICT DO NOTHING;

-- Insert sample devices
INSERT INTO devices (device_id, status, device_type) VALUES
    ('DEV001', 'active', 'flood_sensor'),
    ('DEV002', 'active', 'flood_sensor'),
    ('DEV003', 'active', 'flood_sensor'),
    ('DEV004', 'active', 'flood_sensor'),
    ('DEV005', 'inactive', 'flood_sensor')
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample installations
INSERT INTO installations (
    device_id, team_id, location_id, installer_name,
    status, latitude, longitude, user_reading, server_reading,
    system_pre_verified, notes
) VALUES
    (
        'DEV001',
        '11111111-1111-1111-1111-111111111111',
        '44444444-4444-4444-4444-444444444444',
        'John Doe',
        'verified',
        14.5995,
        120.9842,
        25.5,
        24.8,
        true,
        'Installation completed successfully'
    ),
    (
        'DEV002',
        '11111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        'Jane Smith',
        'verified',
        14.6091,
        121.0223,
        30.2,
        29.9,
        true,
        'Good signal strength'
    ),
    (
        'DEV003',
        '22222222-2222-2222-2222-222222222222',
        '66666666-6666-6666-6666-666666666666',
        'Bob Johnson',
        'pending',
        14.5500,
        121.0500,
        22.0,
        NULL,
        false,
        'Awaiting verification'
    ),
    (
        'DEV004',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        'Alice Williams',
        'flagged',
        14.5995,
        120.9842,
        15.5,
        35.2,
        false,
        'Large discrepancy between readings'
    )
ON CONFLICT DO NOTHING;

-- Update device statuses based on installations
UPDATE devices d
SET status = 'installed'
WHERE device_id IN (SELECT DISTINCT device_id FROM installations);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data inserted successfully!';
    RAISE NOTICE '- 3 teams created';
    RAISE NOTICE '- 3 locations created';
    RAISE NOTICE '- 5 devices created';
    RAISE NOTICE '- 4 sample installations created';
END $$;
