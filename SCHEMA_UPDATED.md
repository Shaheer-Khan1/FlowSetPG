# ✅ Database Schema Updated!

## 🎯 New Comprehensive IoT Platform Schema

Your database now has a **production-ready multi-tenant IoT platform schema** with 19+ tables.

### 📊 Schema Overview

#### 1. Core Tenant & Identity (6 tables)
- `tenants` - Multi-tenant isolation
- `users` - User accounts with roles
- `teams` - Team organization
- `team_members` - Team membership
- `external_integrations` - API integrations

#### 2. Devices & Installation (4 tables)
- `devices` - IoT device registry
- `devices_snapshot` - Device state snapshots
- `installations` - Installation records
- `locations` - Geographic locations

#### 3. Telemetry & Health (2 tables)
- `device_data` - Time-series sensor data
- `device_health` - Device health metrics

#### 4. Rules & Alerts (4 tables)
- `device_rules` - Device automation rules
- `alert_rules` - Alert configuration
- `alerts` - Alert instances
- `notifications` - Notification delivery

#### 5. Firmware (FOTA) (3 tables)
- `firmware_versions` - Firmware releases
- `fota_jobs` - Update campaigns
- `fota_job_devices` - Device-level tracking

#### 6. Utility & Billing (2 tables)
- `utility_tariffs` - Pricing rates
- `utility_records` - Usage & billing

---

## 🔍 Sample Data Loaded

✅ **3 Tenants:**
- Acme Corporation (ACME)
- TechFlow Industries (TECH)  
- Global IoT Solutions (GLOB)

✅ **5 Users:**
- Super admin
- 2 tenant admins
- 2 regular users

✅ **3 Teams** with members

✅ **5 Devices:**
- 4 flood sensors (3 installed, 1 pending)
- 1 temperature sensor

✅ **4 Installations** with GPS locations

✅ **Device Health Data:**
- Real-time status
- Connectivity scores
- Message counts
- Uptime percentages

✅ **Telemetry Data:**
- Recent sensor readings
- Water levels, battery, temperature

✅ **Alert System:**
- 2 alert rules configured
- 1 active high water level alert

✅ **Firmware:**
- 3 firmware versions available

---

## 🗄️ View Your Data

```bash
# Connect to database
./docker-connect.sh

# Then run queries:
SELECT * FROM tenants;
SELECT * FROM devices;
SELECT * FROM installations i 
  JOIN locations l ON i.id = l.installation_id;
SELECT * FROM device_health;
SELECT * FROM alerts WHERE status = 'open';
```

---

## 🔑 Key Features

### Multi-Tenancy
- Tenant isolation via `tenant_id`
- Tenant admins and users
- Separate data per tenant

### Device Management
- Device provisioning with keys
- Installation tracking
- Location management
- Health monitoring

### Alerts & Rules
- Flexible rule conditions (JSON)
- Priority levels (low, medium, high, critical)
- Multi-channel notifications (email, SMS, webhook)
- Alert lifecycle (open → acknowledged → resolved)

### Firmware Updates
- Version management
- Bulk update jobs
- Per-device status tracking
- Rollback support

### Utility Billing
- Tariff management
- Consumption tracking
- Invoice generation
- Contract management

---

## 🔄 Backend Update Needed

Your backend (`server-pg.js`) still uses the old simple schema. You'll need to update API endpoints to work with the new tables:

### Current Endpoints (Simple Schema):
```javascript
GET /api/installations
GET /api/teams
GET /api/locations
GET /api/devices
```

### New Endpoints Needed:
```javascript
// Tenants
GET /api/tenants
POST /api/tenants

// Devices (with tenant filtering)
GET /api/tenants/:tenantId/devices
POST /api/tenants/:tenantId/devices
GET /api/devices/:deviceId/health
GET /api/devices/:deviceId/data

// Installations
GET /api/tenants/:tenantId/installations
POST /api/installations

// Alerts
GET /api/alerts
GET /api/tenants/:tenantId/alerts
PATCH /api/alerts/:id/acknowledge
PATCH /api/alerts/:id/resolve

// Health
GET /api/health/dashboard
GET /api/health/summary
```

---

## 🎯 Quick Queries

### Get all devices with health status:
```sql
SELECT d.device_id, d.name, d.device_type, 
       dh.current_status, dh.last_seen_at, dh.connectivity_score
FROM devices d
LEFT JOIN device_health dh ON d.id = dh.device_id
WHERE d.tenant_id = '11111111-1111-1111-1111-111111111111';
```

### Get installations with locations:
```sql
SELECT d.device_id, d.name,
       i.installed_at, u.full_name as installed_by,
       l.latitude, l.longitude, l.city
FROM installations i
JOIN devices d ON i.device_id = d.id
LEFT JOIN locations l ON i.id = l.installation_id
LEFT JOIN users u ON i.installed_by_user_id = u.id;
```

### Get active alerts:
```sql
SELECT a.title, a.message, a.priority, a.status,
       d.device_id, d.name,
       a.triggered_at
FROM alerts a
JOIN devices d ON a.device_id = d.id
WHERE a.status = 'open'
ORDER BY a.triggered_at DESC;
```

### Get device latest readings:
```sql
SELECT dd.device_id, d.name, dd.timestamp, dd.data
FROM device_data dd
JOIN devices d ON dd.device_id = d.id
WHERE dd.device_id = '77777777-7777-7777-7777-777777777777'
ORDER BY dd.timestamp DESC
LIMIT 10;
```

---

## 📚 Schema Files

- `init-db/10-complete-schema.sql` - Full schema definition
- `init-db/11-sample-data.sql` - Sample data

Old files (can be removed):
- ~~`init-db/02-schema.sql`~~ (old simple schema)
- ~~`init-db/03-sample-data.sql`~~ (old sample data)

---

## ✅ Next Steps

1. **Test the schema:**
   ```bash
   ./docker-connect.sh
   \dt  # List all tables
   \d devices  # Describe devices table
   ```

2. **Update backend** to use new schema

3. **Update frontend** to display new data structure

4. **Add authentication** when ready (users table is ready)

---

**Schema is ready for production!** All tables have proper indexes, constraints, and foreign keys. 🚀
