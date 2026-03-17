# 🎯 Complete System Overview

Your FlowSet IoT Platform - from database to frontend.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Features](#frontend-features)
5. [Data Flow](#data-flow)
6. [Quick Start](#quick-start)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Dashboard, Device Management, Alerts, Analytics      │
│  - Port: 5173 (Vite dev server)                         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────────┐
│              Backend API (Node.js/Express)               │
│  - Authentication, Business Logic, Data Access          │
│  - Port: 3001                                            │
└────────────────────┬────────────────────────────────────┘
                     │ PostgreSQL Protocol
┌────────────────────┴────────────────────────────────────┐
│          PostgreSQL Database (Docker)                    │
│  - 19+ tables, Multi-tenant, Time-series data           │
│  - Port: 5432                                            │
└──────────────────────────────────────────────────────────┘
```

**Stack:**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + pg (PostgreSQL driver)
- **Database**: PostgreSQL 16 (Docker container)
- **Auth**: JWT tokens (ready when you implement)

---

## 🗄️ Database Schema

### Core Tables (19 total)

#### 1. **Multi-Tenancy & Users** (6 tables)
```
tenants              - Organizations/companies
├── users            - User accounts
├── teams            - Team organization
├── team_members     - Team membership
└── external_integrations - API keys, webhooks
```

#### 2. **Device Management** (4 tables)
```
devices              - Device registry
├── installations    - Installation records
├── locations        - GPS coordinates
└── devices_snapshot - Historical snapshots
```

#### 3. **Telemetry & Health** (2 tables)
```
device_data          - Time-series sensor readings
device_health        - Aggregated health metrics
```

#### 4. **Alerts & Rules** (4 tables)
```
alert_rules          - Alert configuration
├── alerts           - Alert instances
├── notifications    - Notification delivery
└── device_rules     - Device automation
```

#### 5. **Firmware** (3 tables)
```
firmware_versions    - Firmware releases
├── fota_jobs        - Update campaigns
└── fota_job_devices - Per-device update status
```

#### 6. **Utility & Billing** (2 tables)
```
utility_tariffs      - Pricing rates
utility_records      - Usage tracking & invoices
```

**Key Features:**
- ✅ Full multi-tenant isolation
- ✅ Cascading deletes
- ✅ Comprehensive indexes
- ✅ Auto-updating timestamps
- ✅ JSONB for flexible metadata

---

## 🌐 API Structure

### Authentication
```
POST /api/auth/login       - User login
POST /api/auth/register    - New user signup
GET  /api/auth/me          - Current user info
```

### Devices
```
GET    /api/devices                 - List devices
GET    /api/devices/:id             - Device details
POST   /api/devices                 - Create device
GET    /api/devices/:id/health      - Health metrics
GET    /api/devices/:id/data        - Telemetry data
POST   /api/devices/:id/data        - Submit reading
```

### Installations
```
GET    /api/installations           - List installations
POST   /api/installations           - New installation
GET    /api/installations/map       - Map view data
```

### Alerts
```
GET    /api/alerts                  - List alerts
GET    /api/alerts/:id              - Alert details
PATCH  /api/alerts/:id/acknowledge  - Acknowledge alert
PATCH  /api/alerts/:id/resolve      - Resolve alert
GET    /api/alert-rules             - Alert configuration
POST   /api/alert-rules             - Create rule
```

### Firmware (FOTA)
```
GET    /api/firmware-versions       - List firmware
POST   /api/fota-jobs               - Create update job
GET    /api/fota-jobs/:id           - Job status
POST   /api/fota-jobs/:id/start     - Start updates
```

### Analytics
```
GET    /api/analytics/dashboard     - Dashboard stats
GET    /api/analytics/device-uptime - Uptime reports
GET    /api/analytics/alert-trends  - Alert analytics
```

**See `API_ENDPOINT_DESIGN.md` for complete API documentation.**

---

## 🎨 Frontend Features

### 1. Dashboard
**Purpose**: Real-time system overview

**Data Sources:**
- `devices` + `device_health` → Device status grid
- `alerts` → Active alerts counter
- `installations` → Recent installations
- `device_data` → Latest readings

### 2. Device Management
**Purpose**: Manage IoT devices

**Features:**
- Device list with filters (status, type, tenant)
- Device details page
- Health monitoring
- Live telemetry charts
- Provisioning workflow

**Data Sources:**
- `devices`, `device_health`, `device_data`
- `installations`, `locations`

### 3. Installation Management
**Purpose**: Track device installations

**Features:**
- New installation form
- Installation history
- Map view with GPS pins
- Installation verification

**Data Sources:**
- `installations`, `locations`, `devices`, `users`, `teams`

### 4. Alert Management
**Purpose**: Monitor and respond to alerts

**Features:**
- Active alerts dashboard
- Alert history
- Alert rule configuration
- Acknowledge/resolve workflow
- Notification tracking

**Data Sources:**
- `alerts`, `alert_rules`, `notifications`
- `devices`, `device_data`

### 5. Firmware Updates (FOTA)
**Purpose**: Remote firmware management

**Features:**
- Firmware version catalog
- Bulk update jobs
- Progress tracking
- Rollback support

**Data Sources:**
- `firmware_versions`, `fota_jobs`, `fota_job_devices`

### 6. Analytics & Reports
**Purpose**: Insights and trends

**Features:**
- Device uptime reports
- Alert trend analysis
- Usage statistics
- Performance metrics

**Data Sources:**
- All tables (aggregated)

### 7. User & Team Management
**Purpose**: Access control and organization

**Features:**
- User CRUD
- Role assignment
- Team management
- Permissions

**Data Sources:**
- `users`, `teams`, `team_members`, `tenants`

### 8. Billing & Utility
**Purpose**: Consumption tracking and invoicing

**Features:**
- Tariff management
- Consumption tracking
- Invoice generation
- Usage reports

**Data Sources:**
- `utility_records`, `utility_tariffs`
- `device_data` (for consumption calculation)

---

## 🔄 Data Flow Examples

### 1. Device Sends Data

```
Device → Backend → Database → Alert System → Notifications

1. Device POSTs to: /api/devices/:id/data
   Body: { timestamp, data: { water_level: 45 } }

2. Backend inserts into device_data table

3. Backend evaluates alert_rules
   - Checks conditions against new data
   - Finds: "water_level > 40" rule

4. Backend creates alert record
   - Inserts into alerts table
   - Status: 'open', Priority: 'high'

5. Backend creates notifications
   - Inserts into notifications table
   - Channels: email, SMS, webhook

6. Backend sends notifications
   - Updates notification.status to 'sent'

7. Backend updates device_health
   - Updates last_seen_at
   - Increments message_count_24h
```

### 2. User Acknowledges Alert

```
Frontend → Backend → Database → UI Update

1. User clicks "Acknowledge" button

2. Frontend PATCHes: /api/alerts/:id/acknowledge
   Body: { user_id }

3. Backend updates alerts table:
   SET status = 'acknowledged',
       acknowledged_at = NOW(),
       acknowledged_by = user_id

4. Backend returns updated alert

5. Frontend refreshes alert list
```

### 3. Installation Workflow

```
User → Frontend → Backend → Multiple Tables

1. User fills installation form
   - Device selection
   - GPS coordinates
   - Notes, photos

2. Frontend POSTs: /api/installations
   Body: {
     device_id,
     location: { lat, lng, address },
     notes,
     initial_readings
   }

3. Backend transaction:
   a. INSERT into installations
   b. INSERT into locations (with installation_id)
   c. UPDATE devices SET is_provisioned = true

4. Backend returns installation + location

5. Frontend shows success, redirects to map
```

### 4. Firmware Update Job

```
Admin → Create Job → Deploy → Track → Complete

1. Admin selects firmware version
2. Admin selects target devices (by type/tenant)
3. Frontend POSTs: /api/fota-jobs
4. Backend creates:
   - fota_jobs record (status: 'pending')
   - fota_job_devices records for each device
5. Admin clicks "Start Job"
6. Frontend POSTs: /api/fota-jobs/:id/start
7. Backend updates job status to 'in_progress'
8. Devices poll for updates, download firmware
9. Devices PATCH: /api/fota-jobs/:job_id/devices/:device_id
   With status updates: 'downloading', 'installing', 'success'
10. Backend updates fota_job_devices.status
11. When all devices complete, update fota_jobs.status
```

---

## 🚀 Quick Start

### 1. Start Services

```bash
# Start PostgreSQL
docker start flowset-postgres

# Start Backend
cd backend
./start.sh

# Start Frontend  
./start-frontend.sh
```

### 2. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

### 3. Test API

```bash
# Health check
curl http://localhost:3001/health

# Get devices
curl http://localhost:3001/api/devices

# Get alerts
curl http://localhost:3001/api/alerts
```

### 4. View Database

```bash
# Connect to PostgreSQL
./docker-connect.sh

# Run queries
SELECT * FROM devices;
SELECT * FROM alerts WHERE status = 'open';
\q
```

---

## 📊 Current Status

### ✅ Completed

- [x] PostgreSQL database schema (19+ tables)
- [x] Sample data for all tables
- [x] Database connection module (`db.js`)
- [x] Basic backend API structure
- [x] Frontend with Firebase stubs (no auth required)
- [x] Development environment setup

### 🔨 In Progress / Next Steps

- [ ] Complete backend API implementation
- [ ] Update frontend to use PostgreSQL backend
- [ ] Implement JWT authentication
- [ ] Add WebSocket for real-time updates
- [ ] Implement alert rule evaluation engine
- [ ] Add file upload for firmware
- [ ] Create admin dashboard

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SCHEMA_UPDATED.md` | Database schema details |
| `FEATURE_TO_TABLE_MAPPING.md` | Feature → Table mapping |
| `API_ENDPOINT_DESIGN.md` | Complete API specification |
| `COMPLETE_SYSTEM_OVERVIEW.md` | This file - system overview |
| `NO_AUTH_SETUP_COMPLETE.md` | Setup without authentication |
| `READY_TO_RUN.md` | Quick start guide |

---

## 🎯 Development Workflow

### Adding a New Feature

1. **Plan Database Changes**
   - Identify tables needed
   - Check `FEATURE_TO_TABLE_MAPPING.md`
   - Update schema if needed

2. **Design API Endpoints**
   - Check `API_ENDPOINT_DESIGN.md`
   - Plan request/response format
   - Consider pagination, filters

3. **Implement Backend**
   - Add routes to `server-pg.js`
   - Write queries using `db.js`
   - Add error handling
   - Test with curl/Postman

4. **Update Frontend**
   - Create/update React components
   - Connect to new API endpoints
   - Handle loading/error states
   - Update UI

5. **Test End-to-End**
   - Manual testing
   - Check database state
   - Verify multi-tenant isolation

---

## 🔐 Security Checklist (When Adding Auth)

- [ ] Implement bcrypt password hashing
- [ ] Generate JWT tokens on login
- [ ] Validate JWT on all endpoints
- [ ] Implement tenant isolation (WHERE tenant_id = ...)
- [ ] Add role-based access control
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS in production
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CORS configuration

---

## 📈 Performance Optimization

### Database
- ✅ Indexes on foreign keys
- ✅ Indexes on frequently queried fields
- ✅ Composite indexes for common queries
- [ ] Partition device_data table by time (for very large datasets)
- [ ] Consider TimescaleDB for time-series optimization

### Backend
- [ ] Implement caching (Redis)
- [ ] Connection pooling (already configured)
- [ ] Query optimization
- [ ] Pagination on all list endpoints

### Frontend
- [ ] Lazy loading
- [ ] Virtual scrolling for large lists
- [ ] Debounce search inputs
- [ ] Cache API responses
- [ ] WebSocket for real-time updates

---

## 🐛 Debugging Guide

### Database Issues
```bash
# Check if PostgreSQL is running
docker ps | grep flowset-postgres

# View logs
docker logs flowset-postgres

# Connect and inspect
./docker-connect.sh
\dt  # List tables
\d devices  # Describe table
```

### Backend Issues
```bash
# Check backend logs
cd backend
npm run dev  # Watch output

# Test specific endpoint
curl -X GET http://localhost:3001/api/devices

# Check database connection
cd backend && npm run test:db
```

### Frontend Issues
```bash
# Check Vite logs (in browser console)
# Check Network tab for API calls
# Verify stub warnings in console
```

---

## 📞 Quick Reference

### Ports
- Frontend: 5173
- Backend: 3001
- PostgreSQL: 5432

### Key Files
- Schema: `init-db/10-complete-schema.sql`
- Sample Data: `init-db/11-sample-data.sql`
- Backend: `backend/server-pg.js`
- DB Module: `backend/db.js`

### Sample Tenants
- ACME (id: 11111111-1111-1111-1111-111111111111)
- TECH (id: 22222222-2222-2222-2222-222222222222)
- GLOB (id: 33333333-3333-3333-3333-333333333333)

---

**Your complete IoT platform is ready to build on!** 🚀

All documentation, schema, and sample data are in place. Start implementing features using the API design and table mappings as your guide.
