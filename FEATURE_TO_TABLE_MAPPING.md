# 🔗 Feature to Database Table Mapping

Complete guide showing which database tables support each software feature.

---

## 📱 Frontend Features → Database Tables

### 1. User Authentication & Management

**Features:**
- Login / Signup
- User Profile
- Role Management
- Team Assignment

**Tables Used:**
```
┌─────────────────┐
│ users           │ ← Primary user data, authentication
├─────────────────┤
│ tenants         │ ← User's organization/tenant
├─────────────────┤
│ teams           │ ← Teams user belongs to
├─────────────────┤
│ team_members    │ ← User-to-team relationships
└─────────────────┘
```

**Workflows:**

**Login Flow:**
```
1. User enters email/password → Query users table
2. Check hashed_password match
3. Update last_login_at in users
4. Load tenant data from tenants
5. Load teams from team_members JOIN teams
6. Return user profile with permissions
```

**User Profile View:**
```sql
SELECT u.*, t.name as tenant_name, t.code as tenant_code
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.id = :user_id;

-- Get user's teams
SELECT tm.role, te.name, te.description
FROM team_members tm
JOIN teams te ON tm.team_id = te.id
WHERE tm.user_id = :user_id;
```

---

### 2. Device Management

**Features:**
- Device List/Grid
- Device Details
- Device Provisioning
- Device Status/Health

**Tables Used:**
```
┌──────────────────┐
│ devices          │ ← Device registry, metadata
├──────────────────┤
│ device_health    │ ← Real-time status, connectivity
├──────────────────┤
│ device_data      │ ← Sensor readings, telemetry
├──────────────────┤
│ installations    │ ← Installation info
├──────────────────┤
│ locations        │ ← GPS coordinates
├──────────────────┤
│ tenants          │ ← Multi-tenant filtering
└──────────────────┘
```

**Workflows:**

**Device List (Tenant Admin):**
```sql
SELECT 
    d.*,
    dh.current_status,
    dh.last_seen_at,
    dh.connectivity_score,
    i.installed_at,
    l.city,
    l.latitude,
    l.longitude
FROM devices d
LEFT JOIN device_health dh ON d.id = dh.device_id
LEFT JOIN installations i ON d.id = i.device_id
LEFT JOIN locations l ON i.id = l.installation_id
WHERE d.tenant_id = :tenant_id
  AND d.is_active = true
ORDER BY d.created_at DESC;
```

**Device Details Page:**
```sql
-- Basic info
SELECT d.*, t.name as tenant_name
FROM devices d
JOIN tenants t ON d.tenant_id = t.id
WHERE d.id = :device_id;

-- Health metrics
SELECT * FROM device_health WHERE device_id = :device_id;

-- Latest 100 readings
SELECT timestamp, data
FROM device_data
WHERE device_id = :device_id
ORDER BY timestamp DESC
LIMIT 100;

-- Installation info
SELECT i.*, l.*, u.full_name as installed_by_name
FROM installations i
LEFT JOIN locations l ON i.id = l.installation_id
LEFT JOIN users u ON i.installed_by_user_id = u.id
WHERE i.device_id = :device_id;
```

**Device Provisioning:**
```sql
-- Create new device
INSERT INTO devices (device_id, tenant_id, device_type, provisioning_key, provisioning_key_expires_at)
VALUES (:device_id, :tenant_id, :type, :key, NOW() + INTERVAL '7 days')
RETURNING *;

-- Initialize health record
INSERT INTO device_health (device_id, current_status)
VALUES (:device_id, 'provisioned');
```

---

### 3. Installation Management

**Features:**
- New Installation Form
- Installation History
- Location Mapping
- Installation Verification

**Tables Used:**
```
┌──────────────────┐
│ installations    │ ← Installation records
├──────────────────┤
│ locations        │ ← GPS, address data
├──────────────────┤
│ devices          │ ← Device being installed
├──────────────────┤
│ users            │ ← Installer information
├──────────────────┤
│ teams            │ ← Installation team
└──────────────────┘
```

**Workflows:**

**Create Installation:**
```sql
-- Step 1: Create installation record
INSERT INTO installations (
    device_id,
    installed_by_user_id,
    installation_notes,
    initial_sensor_readings
) VALUES (
    :device_id,
    :user_id,
    :notes,
    :initial_readings
) RETURNING id;

-- Step 2: Add location
INSERT INTO locations (
    installation_id,
    latitude,
    longitude,
    address,
    city,
    country,
    source
) VALUES (
    :installation_id,
    :lat,
    :lng,
    :address,
    :city,
    :country,
    'gps'
);

-- Step 3: Update device status
UPDATE devices
SET is_provisioned = true
WHERE id = :device_id;
```

**Installation Map View:**
```sql
SELECT 
    d.device_id,
    d.name,
    d.device_type,
    i.installed_at,
    l.latitude,
    l.longitude,
    l.city,
    l.address,
    dh.current_status
FROM installations i
JOIN devices d ON i.device_id = d.id
JOIN locations l ON i.id = l.installation_id
LEFT JOIN device_health dh ON d.id = dh.device_id
WHERE d.tenant_id = :tenant_id
  AND l.latitude IS NOT NULL
  AND l.longitude IS NOT NULL;
```

---

### 4. Alerts & Notifications

**Features:**
- Alert Dashboard
- Alert Rules Configuration
- Alert Acknowledgment
- Notification History

**Tables Used:**
```
┌──────────────────┐
│ alerts           │ ← Alert instances
├──────────────────┤
│ alert_rules      │ ← Alert configuration
├──────────────────┤
│ notifications    │ ← Notification delivery
├──────────────────┤
│ devices          │ ← Source device
├──────────────────┤
│ device_data      │ ← Trigger data
├──────────────────┤
│ users            │ ← Alert handlers
└──────────────────┘
```

**Workflows:**

**Alert Dashboard (Active Alerts):**
```sql
SELECT 
    a.*,
    d.device_id,
    d.name as device_name,
    ar.name as rule_name,
    u_ack.full_name as acknowledged_by_name,
    u_res.full_name as resolved_by_name
FROM alerts a
JOIN devices d ON a.device_id = d.id
LEFT JOIN alert_rules ar ON a.rule_id = ar.id
LEFT JOIN users u_ack ON a.acknowledged_by = u_ack.id
LEFT JOIN users u_res ON a.resolved_by = u_res.id
WHERE a.tenant_id = :tenant_id
  AND a.status IN ('open', 'acknowledged')
ORDER BY 
    CASE a.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    a.triggered_at DESC;
```

**Create Alert (Automated):**
```sql
-- Triggered by device data meeting rule condition
INSERT INTO alerts (
    rule_id,
    device_id,
    tenant_id,
    title,
    message,
    priority,
    status,
    trigger_data
) VALUES (
    :rule_id,
    :device_id,
    :tenant_id,
    :title,
    :message,
    :priority,
    'open',
    :trigger_data
) RETURNING id;

-- Create notification records
INSERT INTO notifications (alert_id, channel, recipient, status)
VALUES 
    (:alert_id, 'email', :email, 'pending'),
    (:alert_id, 'sms', :phone, 'pending'),
    (:alert_id, 'webhook', :webhook_url, 'pending');
```

**Acknowledge Alert:**
```sql
UPDATE alerts
SET 
    status = 'acknowledged',
    acknowledged_at = NOW(),
    acknowledged_by = :user_id
WHERE id = :alert_id
RETURNING *;
```

---

### 5. Real-Time Monitoring

**Features:**
- Live Dashboard
- Device Status Grid
- Telemetry Charts
- Health Metrics

**Tables Used:**
```
┌──────────────────┐
│ device_data      │ ← Time-series sensor data
├──────────────────┤
│ device_health    │ ← Aggregated health metrics
├──────────────────┤
│ devices          │ ← Device metadata
├──────────────────┤
│ alerts           │ ← Active alerts
└──────────────────┘
```

**Workflows:**

**Dashboard Overview:**
```sql
-- Total devices by status
SELECT 
    dh.current_status,
    COUNT(*) as count
FROM devices d
JOIN device_health dh ON d.id = dh.device_id
WHERE d.tenant_id = :tenant_id
GROUP BY dh.current_status;

-- Recent alerts
SELECT COUNT(*) as alert_count
FROM alerts
WHERE tenant_id = :tenant_id
  AND triggered_at > NOW() - INTERVAL '24 hours'
  AND status = 'open';

-- Devices needing attention
SELECT d.device_id, d.name, dh.current_status, dh.last_seen_at
FROM devices d
JOIN device_health dh ON d.id = dh.device_id
WHERE d.tenant_id = :tenant_id
  AND (
    dh.current_status IN ('offline', 'degraded') OR
    dh.last_seen_at < NOW() - INTERVAL '1 hour'
  );
```

**Live Telemetry (Last 24 Hours):**
```sql
SELECT 
    timestamp,
    data->>'water_level' as water_level,
    data->>'battery' as battery,
    data->>'temperature' as temperature
FROM device_data
WHERE device_id = :device_id
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp ASC;
```

---

### 6. Firmware Management (FOTA)

**Features:**
- Firmware Version List
- Upload New Firmware
- Create Update Job
- Track Update Progress

**Tables Used:**
```
┌──────────────────┐
│ firmware_versions│ ← Available firmware
├──────────────────┤
│ fota_jobs        │ ← Update campaigns
├──────────────────┤
│ fota_job_devices │ ← Per-device status
├──────────────────┤
│ devices          │ ← Target devices, current version
└──────────────────┘
```

**Workflows:**

**Firmware List:**
```sql
SELECT 
    fv.*,
    COUNT(d.id) as installed_count
FROM firmware_versions fv
LEFT JOIN devices d ON d.firmware_current_version = fv.version
  AND d.device_type = fv.device_type
WHERE fv.device_type = :device_type
GROUP BY fv.id
ORDER BY fv.created_at DESC;
```

**Create Update Job:**
```sql
-- Create job
INSERT INTO fota_jobs (
    name,
    tenant_id,
    firmware_version_id,
    status,
    created_by_user_id
) VALUES (
    :name,
    :tenant_id,
    :firmware_version_id,
    'pending',
    :user_id
) RETURNING id;

-- Add devices to job
INSERT INTO fota_job_devices (job_id, device_id, status)
SELECT :job_id, id, 'pending'
FROM devices
WHERE tenant_id = :tenant_id
  AND device_type = :device_type
  AND firmware_current_version != :target_version;
```

**Job Progress Dashboard:**
```sql
SELECT 
    fj.*,
    fv.version as target_version,
    COUNT(fjd.id) as total_devices,
    COUNT(CASE WHEN fjd.status = 'success' THEN 1 END) as completed,
    COUNT(CASE WHEN fjd.status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN fjd.status IN ('pending', 'downloading', 'installing') THEN 1 END) as in_progress
FROM fota_jobs fj
JOIN firmware_versions fv ON fj.firmware_version_id = fv.id
LEFT JOIN fota_job_devices fjd ON fj.id = fjd.job_id
WHERE fj.tenant_id = :tenant_id
GROUP BY fj.id, fv.version
ORDER BY fj.created_at DESC;
```

---

### 7. Utility & Billing

**Features:**
- Consumption Tracking
- Invoice Generation
- Tariff Management
- Usage Reports

**Tables Used:**
```
┌──────────────────┐
│ utility_records  │ ← Contracts, consumption, invoices
├──────────────────┤
│ utility_tariffs  │ ← Pricing rates
├──────────────────┤
│ devices          │ ← Metering devices
├──────────────────┤
│ device_data      │ ← Usage readings
└──────────────────┘
```

**Workflows:**

**Monthly Consumption Report:**
```sql
SELECT 
    d.device_id,
    d.name,
    ur.period_start,
    ur.period_end,
    ur.consumption,
    ur.unit,
    ur.amount,
    ur.currency,
    ut.name as tariff_name
FROM utility_records ur
JOIN devices d ON ur.device_id = d.id
LEFT JOIN utility_tariffs ut ON ur.tariff_id = ut.id
WHERE ur.tenant_id = :tenant_id
  AND ur.record_type = 'consumption'
  AND ur.period_start >= :month_start
  AND ur.period_end <= :month_end;
```

**Generate Invoice:**
```sql
-- Calculate consumption from device data
WITH consumption_calc AS (
    SELECT 
        device_id,
        MAX((data->>'meter_reading')::decimal) - MIN((data->>'meter_reading')::decimal) as consumption
    FROM device_data
    WHERE device_id = :device_id
      AND timestamp BETWEEN :period_start AND :period_end
    GROUP BY device_id
)
-- Create invoice record
INSERT INTO utility_records (
    tenant_id,
    device_id,
    utility_kind,
    tariff_id,
    period_start,
    period_end,
    consumption,
    unit,
    amount,
    currency,
    status,
    record_type
)
SELECT 
    :tenant_id,
    cc.device_id,
    ut.utility_kind,
    ut.id,
    :period_start,
    :period_end,
    cc.consumption,
    'kWh',
    cc.consumption * ut.rate_per_unit,
    ut.currency,
    'pending',
    'invoice'
FROM consumption_calc cc
CROSS JOIN utility_tariffs ut
WHERE ut.id = :tariff_id;
```

---

### 8. Reports & Analytics

**Features:**
- Device Performance Reports
- Alert Trend Analysis
- Team Performance
- Usage Statistics

**Tables Used:**
```
All tables are used for analytics:
┌──────────────────┐
│ device_data      │ ← Trends, patterns
├──────────────────┤
│ device_health    │ ← Uptime, reliability
├──────────────────┤
│ alerts           │ ← Alert frequency, response time
├──────────────────┤
│ installations    │ ← Installation metrics
├──────────────────┤
│ users            │ ← User activity
├──────────────────┤
│ teams            │ ← Team performance
└──────────────────┘
```

**Example Queries:**

**Device Uptime Report:**
```sql
SELECT 
    d.device_id,
    d.name,
    dh.uptime_24h_percent,
    dh.uptime_7d_percent,
    dh.message_count_24h,
    dh.message_count_7d,
    dh.connectivity_score
FROM devices d
JOIN device_health dh ON d.id = dh.device_id
WHERE d.tenant_id = :tenant_id
ORDER BY dh.uptime_7d_percent DESC;
```

**Alert Response Time:**
```sql
SELECT 
    AVG(EXTRACT(EPOCH FROM (acknowledged_at - triggered_at))/60) as avg_response_minutes,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM alerts
WHERE tenant_id = :tenant_id
  AND triggered_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', triggered_at)
ORDER BY DATE_TRUNC('day', triggered_at);
```

---

## 🔄 Common Query Patterns

### Multi-Tenant Filtering
```sql
-- Always filter by tenant_id for tenant-scoped data
WHERE tenant_id = :current_user_tenant_id
```

### Joining Device Data
```sql
-- Standard device query with all related data
SELECT 
    d.*,                          -- Device info
    dh.current_status,            -- Health status
    i.installed_at,               -- Installation
    l.latitude, l.longitude,      -- Location
    t.name as tenant_name         -- Tenant
FROM devices d
LEFT JOIN device_health dh ON d.id = dh.device_id
LEFT JOIN installations i ON d.id = i.device_id
LEFT JOIN locations l ON i.id = l.installation_id
JOIN tenants t ON d.tenant_id = t.id
WHERE d.tenant_id = :tenant_id;
```

### Time-Series Aggregation
```sql
-- Hourly averages from device_data
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG((data->>'water_level')::decimal) as avg_water_level,
    MIN((data->>'battery')::decimal) as min_battery
FROM device_data
WHERE device_id = :device_id
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour;
```

---

## 📋 Table Usage Summary

| Table | Primary Use Cases | Accessed By |
|-------|------------------|-------------|
| `tenants` | Multi-tenancy, org management | All features |
| `users` | Auth, permissions, activity | Login, Profiles, Teams |
| `teams` | Organization, collaboration | User mgmt, Installations |
| `devices` | Device registry, metadata | All device features |
| `device_health` | Status monitoring | Dashboard, Monitoring |
| `device_data` | Telemetry, time-series | Charts, Analytics, Alerts |
| `installations` | Installation tracking | Installation features |
| `locations` | GPS, mapping | Maps, Installation |
| `alerts` | Alert management | Alert dashboard, Rules |
| `alert_rules` | Alert configuration | Alert setup |
| `notifications` | Message delivery | Alert notifications |
| `firmware_versions` | Firmware catalog | FOTA features |
| `fota_jobs` | Update campaigns | FOTA management |
| `utility_records` | Billing, consumption | Billing features |

---

## 🎯 Quick Reference by User Role

### Super Admin
**Full access to all tables:**
- Manage all tenants
- Access all devices across tenants
- System-wide analytics
- User management across tenants

### Tenant Admin
**Tenant-scoped access:**
- `devices WHERE tenant_id = :their_tenant`
- `users WHERE tenant_id = :their_tenant`
- `alerts WHERE tenant_id = :their_tenant`
- All related installation, health, data

### Regular User
**Team-scoped or assigned devices:**
- `devices` via team membership
- Own user profile
- Alerts for their devices
- Installation create/view

---

This mapping document shows exactly which tables support each feature. Use it to:
1. Design API endpoints
2. Build database queries
3. Optimize indexes
4. Plan data access patterns
5. Implement role-based access control
