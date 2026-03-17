# 🌐 API Endpoint Design

Complete API structure mapped to database tables.

---

## 🔐 Authentication & Users

### `/api/auth`

```javascript
POST   /api/auth/login
  Body: { email, password }
  Returns: { token, user, tenant }
  Tables: users, tenants

POST   /api/auth/register
  Body: { email, password, full_name, tenant_code }
  Returns: { user }
  Tables: users, tenants

POST   /api/auth/logout
  Returns: { success }
  Tables: users (update last_login_at)

GET    /api/auth/me
  Returns: { user, tenant, teams }
  Tables: users, tenants, teams, team_members
```

### `/api/users`

```javascript
GET    /api/users
  Query: ?tenant_id=xxx&role=xxx&is_active=true
  Returns: { users[], total }
  Tables: users, tenants

GET    /api/users/:id
  Returns: { user, tenant, teams }
  Tables: users, tenants, teams, team_members

PATCH  /api/users/:id
  Body: { full_name, role, is_active, enabled_modules }
  Returns: { user }
  Tables: users

POST   /api/users/:id/teams
  Body: { team_id, role }
  Returns: { team_member }
  Tables: team_members

DELETE /api/users/:id/teams/:team_id
  Returns: { success }
  Tables: team_members
```

---

## 🏢 Tenants & Teams

### `/api/tenants`

```javascript
GET    /api/tenants
  Returns: { tenants[], total }
  Tables: tenants
  Access: Super admin only

GET    /api/tenants/:id
  Returns: { tenant, stats }
  Tables: tenants, devices (count), users (count)

POST   /api/tenants
  Body: { name, code, country }
  Returns: { tenant }
  Tables: tenants
  Access: Super admin only

PATCH  /api/tenants/:id
  Body: { name, is_active }
  Returns: { tenant }
  Tables: tenants

GET    /api/tenants/:id/stats
  Returns: { device_count, user_count, alert_count }
  Tables: devices, users, alerts
```

### `/api/teams`

```javascript
GET    /api/teams
  Query: ?tenant_id=xxx
  Returns: { teams[], total }
  Tables: teams

GET    /api/teams/:id
  Returns: { team, members }
  Tables: teams, team_members, users

POST   /api/teams
  Body: { tenant_id, name, description }
  Returns: { team }
  Tables: teams

PATCH  /api/teams/:id
  Body: { name, description }
  Returns: { team }
  Tables: teams

GET    /api/teams/:id/members
  Returns: { members[] }
  Tables: team_members, users
```

---

## 🔧 Device Management

### `/api/devices`

```javascript
GET    /api/devices
  Query: ?tenant_id=xxx&device_type=xxx&is_active=true
         &status=xxx&page=1&limit=50
  Returns: { devices[], total, page, limit }
  Tables: devices, device_health, installations, locations

GET    /api/devices/:id
  Returns: { 
    device,
    health,
    installation,
    location,
    latest_data,
    firmware_info
  }
  Tables: devices, device_health, installations, locations,
          device_data, firmware_versions

POST   /api/devices
  Body: { 
    device_id, tenant_id, device_type, name,
    provisioning_key (auto-generated if not provided)
  }
  Returns: { device }
  Tables: devices, device_health

PATCH  /api/devices/:id
  Body: { name, is_active, device_metadata }
  Returns: { device }
  Tables: devices

DELETE /api/devices/:id
  Returns: { success }
  Tables: devices (CASCADE to installations, device_data, etc.)

GET    /api/devices/:id/provision
  Returns: { 
    provisioning_key,
    expires_at,
    provisioning_url 
  }
  Tables: devices

POST   /api/devices/:id/provision/complete
  Body: { initial_data }
  Returns: { device }
  Tables: devices (update is_provisioned)
```

---

## 📊 Device Health & Telemetry

### `/api/devices/:device_id/health`

```javascript
GET    /api/devices/:device_id/health
  Returns: { 
    current_status,
    last_seen_at,
    connectivity_score,
    uptime_metrics,
    battery_info
  }
  Tables: device_health

PATCH  /api/devices/:device_id/health
  Body: { current_status, last_battery_level }
  Returns: { health }
  Tables: device_health (auto-updated by system)
```

### `/api/devices/:device_id/data`

```javascript
GET    /api/devices/:device_id/data
  Query: ?start_time=xxx&end_time=xxx&limit=1000
  Returns: { data[], total }
  Tables: device_data

POST   /api/devices/:device_id/data
  Body: { timestamp, data: {...} }
  Returns: { success, record_id }
  Tables: device_data
  Note: This triggers rule evaluation

GET    /api/devices/:device_id/data/latest
  Returns: { timestamp, data }
  Tables: device_data (ORDER BY timestamp DESC LIMIT 1)

GET    /api/devices/:device_id/data/aggregate
  Query: ?interval=hour&start=xxx&end=xxx&fields[]=xxx
  Returns: { aggregates[] }
  Tables: device_data (with DATE_TRUNC aggregation)
```

---

## 📍 Installations & Locations

### `/api/installations`

```javascript
GET    /api/installations
  Query: ?tenant_id=xxx&device_id=xxx&installed_by=xxx
  Returns: { installations[], total }
  Tables: installations, locations, devices, users

GET    /api/installations/:id
  Returns: { 
    installation,
    location,
    device,
    installed_by_user
  }
  Tables: installations, locations, devices, users

POST   /api/installations
  Body: {
    device_id,
    installed_by_user_id,
    installation_notes,
    initial_sensor_readings,
    location: { lat, lng, address, city, country }
  }
  Returns: { installation, location }
  Tables: installations, locations, devices

PATCH  /api/installations/:id
  Body: { installation_notes }
  Returns: { installation }
  Tables: installations

GET    /api/installations/map
  Query: ?tenant_id=xxx&bounds=xxx
  Returns: { installations_with_locations[] }
  Tables: installations, locations, devices, device_health
```

### `/api/locations`

```javascript
GET    /api/locations/:installation_id
  Returns: { location }
  Tables: locations

PATCH  /api/locations/:installation_id
  Body: { latitude, longitude, address, city }
  Returns: { location }
  Tables: locations
```

---

## 🚨 Alerts & Rules

### `/api/alerts`

```javascript
GET    /api/alerts
  Query: ?tenant_id=xxx&device_id=xxx&status=open
         &priority=high&start_date=xxx&end_date=xxx
  Returns: { alerts[], total }
  Tables: alerts, devices, alert_rules, users

GET    /api/alerts/:id
  Returns: { 
    alert,
    device,
    rule,
    notifications,
    acknowledged_by,
    resolved_by
  }
  Tables: alerts, devices, alert_rules, notifications, users

POST   /api/alerts
  Body: {
    device_id,
    rule_id,
    title,
    message,
    priority,
    trigger_data
  }
  Returns: { alert }
  Tables: alerts
  Note: Creates notifications based on rule config

PATCH  /api/alerts/:id/acknowledge
  Body: { user_id }
  Returns: { alert }
  Tables: alerts

PATCH  /api/alerts/:id/resolve
  Body: { user_id, resolution_notes }
  Returns: { alert }
  Tables: alerts

GET    /api/alerts/stats
  Query: ?tenant_id=xxx&start_date=xxx&end_date=xxx
  Returns: { 
    total,
    by_priority,
    by_status,
    avg_response_time
  }
  Tables: alerts
```

### `/api/alert-rules`

```javascript
GET    /api/alert-rules
  Query: ?tenant_id=xxx&device_id=xxx&is_active=true
  Returns: { rules[], total }
  Tables: alert_rules

GET    /api/alert-rules/:id
  Returns: { rule, recent_alerts }
  Tables: alert_rules, alerts

POST   /api/alert-rules
  Body: {
    name,
    tenant_id,
    device_id (optional),
    condition,
    priority,
    title_template,
    message_template,
    notify_email,
    notify_sms,
    webhook_url
  }
  Returns: { rule }
  Tables: alert_rules

PATCH  /api/alert-rules/:id
  Body: { name, condition, is_active }
  Returns: { rule }
  Tables: alert_rules

DELETE /api/alert-rules/:id
  Returns: { success }
  Tables: alert_rules

POST   /api/alert-rules/:id/test
  Body: { test_data }
  Returns: { would_trigger, simulated_alert }
  Tables: alert_rules (read-only)
```

### `/api/notifications`

```javascript
GET    /api/notifications
  Query: ?alert_id=xxx&channel=email&status=sent
  Returns: { notifications[], total }
  Tables: notifications

GET    /api/notifications/:id
  Returns: { notification, alert }
  Tables: notifications, alerts

POST   /api/notifications/:id/retry
  Returns: { notification }
  Tables: notifications (increment retry_count)
```

---

## 📱 Firmware (FOTA)

### `/api/firmware-versions`

```javascript
GET    /api/firmware-versions
  Query: ?device_type=xxx&is_recommended=true
  Returns: { versions[], total }
  Tables: firmware_versions

GET    /api/firmware-versions/:id
  Returns: { version, compatible_devices_count }
  Tables: firmware_versions, devices

POST   /api/firmware-versions
  Body: {
    device_type,
    name,
    version,
    file_path,
    checksum,
    release_notes,
    is_recommended
  }
  Returns: { version }
  Tables: firmware_versions

DELETE /api/firmware-versions/:id
  Returns: { success }
  Tables: firmware_versions (check if used in active jobs)
```

### `/api/fota-jobs`

```javascript
GET    /api/fota-jobs
  Query: ?tenant_id=xxx&status=in_progress
  Returns: { jobs[], total }
  Tables: fota_jobs, firmware_versions

GET    /api/fota-jobs/:id
  Returns: { 
    job,
    firmware_version,
    device_progress,
    stats: { total, completed, failed, in_progress }
  }
  Tables: fota_jobs, firmware_versions, fota_job_devices

POST   /api/fota-jobs
  Body: {
    name,
    tenant_id,
    firmware_version_id,
    device_ids[] (or device_filter)
  }
  Returns: { job }
  Tables: fota_jobs, fota_job_devices

POST   /api/fota-jobs/:id/start
  Returns: { job }
  Tables: fota_jobs (update status to 'in_progress')

POST   /api/fota-jobs/:id/cancel
  Returns: { job }
  Tables: fota_jobs, fota_job_devices

GET    /api/fota-jobs/:id/devices
  Returns: { devices[], stats }
  Tables: fota_job_devices, devices

PATCH  /api/fota-jobs/:job_id/devices/:device_id
  Body: { status, last_error }
  Returns: { job_device }
  Tables: fota_job_devices
  Note: Called by device during update process
```

---

## 💰 Utility & Billing

### `/api/utility-tariffs`

```javascript
GET    /api/utility-tariffs
  Query: ?utility_kind=electricity&is_active=true
  Returns: { tariffs[], total }
  Tables: utility_tariffs

GET    /api/utility-tariffs/:id
  Returns: { tariff, usage_count }
  Tables: utility_tariffs, utility_records

POST   /api/utility-tariffs
  Body: {
    name,
    utility_kind,
    rate_per_unit,
    currency,
    notes
  }
  Returns: { tariff }
  Tables: utility_tariffs

PATCH  /api/utility-tariffs/:id
  Body: { rate_per_unit, is_active }
  Returns: { tariff }
  Tables: utility_tariffs
```

### `/api/utility-records`

```javascript
GET    /api/utility-records
  Query: ?tenant_id=xxx&device_id=xxx&record_type=invoice
         &status=pending&start_date=xxx&end_date=xxx
  Returns: { records[], total }
  Tables: utility_records, devices, utility_tariffs

GET    /api/utility-records/:id
  Returns: { record, device, tariff }
  Tables: utility_records, devices, utility_tariffs

POST   /api/utility-records
  Body: {
    tenant_id,
    device_id,
    utility_kind,
    record_type,
    ...type-specific fields
  }
  Returns: { record }
  Tables: utility_records

PATCH  /api/utility-records/:id
  Body: { status, amount }
  Returns: { record }
  Tables: utility_records

POST   /api/utility-records/generate-invoice
  Body: {
    device_id,
    period_start,
    period_end,
    tariff_id
  }
  Returns: { invoice }
  Tables: utility_records, device_data, utility_tariffs
  Note: Calculates consumption from device_data

GET    /api/utility-records/consumption-report
  Query: ?tenant_id=xxx&start_date=xxx&end_date=xxx
  Returns: { report[] }
  Tables: utility_records, devices
```

---

## 📊 Analytics & Reports

### `/api/analytics`

```javascript
GET    /api/analytics/dashboard
  Query: ?tenant_id=xxx
  Returns: {
    total_devices,
    online_devices,
    offline_devices,
    active_alerts,
    recent_installations,
    health_score
  }
  Tables: devices, device_health, alerts, installations

GET    /api/analytics/device-uptime
  Query: ?tenant_id=xxx&period=7d
  Returns: { uptime_by_device[] }
  Tables: device_health

GET    /api/analytics/alert-trends
  Query: ?tenant_id=xxx&period=30d
  Returns: { alerts_by_day[], by_priority[], by_device[] }
  Tables: alerts

GET    /api/analytics/installation-metrics
  Query: ?tenant_id=xxx&start_date=xxx&end_date=xxx
  Returns: {
    installations_by_day[],
    installations_by_team[],
    installations_by_user[]
  }
  Tables: installations, teams, users

GET    /api/analytics/telemetry-summary
  Query: ?device_id=xxx&period=24h&interval=1h
  Returns: { aggregated_data[] }
  Tables: device_data
```

---

## 🔄 Webhooks & Integrations

### `/api/integrations`

```javascript
GET    /api/integrations
  Query: ?user_id=xxx&is_active=true
  Returns: { integrations[], total }
  Tables: external_integrations

GET    /api/integrations/:id
  Returns: { integration, usage_stats }
  Tables: external_integrations

POST   /api/integrations
  Body: {
    user_id,
    name,
    allowed_endpoints[],
    webhook_url
  }
  Returns: { integration, api_key }
  Tables: external_integrations

PATCH  /api/integrations/:id
  Body: { name, is_active, allowed_endpoints }
  Returns: { integration }
  Tables: external_integrations

POST   /api/integrations/:id/regenerate-key
  Returns: { integration, new_api_key }
  Tables: external_integrations

DELETE /api/integrations/:id
  Returns: { success }
  Tables: external_integrations
```

---

## 🎯 Common Query Parameters

All list endpoints support:
```
?page=1           // Page number (default: 1)
?limit=50         // Items per page (default: 50, max: 100)
?sort=created_at  // Sort field
?order=desc       // Sort order (asc/desc)
?search=xxx       // Text search (where applicable)
```

---

## 🔒 Authentication Headers

All endpoints (except `/api/auth/login` and `/api/auth/register`) require:

```
Authorization: Bearer <jwt_token>
```

JWT payload should include:
```javascript
{
  user_id: "uuid",
  tenant_id: "uuid", 
  role: "admin|tenant_admin|user",
  exp: timestamp
}
```

---

## 📝 Standard Response Format

### Success Response
```javascript
{
  success: true,
  data: {...} or [...],
  metadata: {
    total: 100,      // For list endpoints
    page: 1,
    limit: 50,
    timestamp: "ISO-8601"
  }
}
```

### Error Response
```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message",
    details: {...}    // Optional
  }
}
```

---

## 🚀 Implementation Priority

### Phase 1: Core (MVP)
1. Auth endpoints
2. Device CRUD
3. Device data (POST for ingestion)
4. Basic alerts

### Phase 2: Monitoring
1. Device health
2. Alert rules
3. Notifications
4. Dashboard analytics

### Phase 3: Management
1. Installations
2. Teams
3. User management
4. Firmware (FOTA)

### Phase 4: Advanced
1. Utility & billing
2. Advanced analytics
3. Integrations
4. Webhooks

---

This API design maps directly to your database schema and provides a complete REST API for the IoT platform!
