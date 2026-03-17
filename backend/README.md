# FlowSet IoT Platform - Backend API

A comprehensive RESTful API for a multi-tenant IoT platform built with Node.js, Express, and PostgreSQL.

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: PostgreSQL (19+ tables)
- **Multi-Tenant**: Full tenant isolation
- **Auth**: Bypassed for development (JWT ready for production)
- **Real-time**: WebSocket support (planned)

## 📦 Features

### Core Modules

1. **Tenant Management** - Multi-tenant architecture
2. **User Management** - Roles and permissions
3. **Team Management** - Collaborative access
4. **Device Management** - IoT device registration and monitoring
5. **Installation Tracking** - Device deployment and locations
6. **Alert System** - Rule-based alerts with priority levels
7. **Firmware Over-The-Air (FOTA)** - Remote firmware updates
8. **Analytics** - Dashboard metrics and reports

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (installed at `~/.local/node`)
- PostgreSQL 16 (running in Docker)
- npm packages installed

### Start Server

```bash
# Method 1: Using start script
./start.sh

# Method 2: Using npm
npm run dev

# Method 3: Direct node
node server-api.js
```

The API will be available at `http://localhost:3001`

### Test Endpoints

```bash
# Test all endpoints
npm run test:endpoints

# Test database connection
npm run test:db

# Health check
curl http://localhost:3001/health
```

## 📍 API Endpoints

### System

- `GET /health` - Health check
- `GET /api/system/stats` - System-wide statistics

### Tenants

- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details
- `POST /api/tenants` - Create tenant

### Users

- `GET /api/users` - List users (filter by tenant, role, status)
- `GET /api/users/:id` - Get user details with teams
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user

### Teams

- `GET /api/teams` - List teams (filter by tenant)
- `GET /api/teams/:id/members` - Get team members
- `POST /api/teams` - Create team

### Devices

- `GET /api/devices` - List devices (filter by tenant, type, status)
- `GET /api/devices/:id` - Get device with health & installation
- `POST /api/devices` - Register new device
- `PATCH /api/devices/:id` - Update device
- `GET /api/devices/:id/health` - Get device health metrics
- `GET /api/devices/:id/data` - Get telemetry data (time range)
- `POST /api/devices/:id/data` - Post telemetry data
- `GET /api/devices/:id/data/latest` - Get latest telemetry

### Installations

- `GET /api/installations` - List installations (filter by tenant)
- `GET /api/installations/:id` - Get installation details
- `POST /api/installations` - Create installation with location
- `GET /api/installations/map` - Get all installations for map view

### Alerts

- `GET /api/alerts` - List alerts (filter by tenant, device, status, priority)
- `GET /api/alerts/:id` - Get alert details with notifications
- `POST /api/alerts` - Create alert
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert
- `GET /api/alerts/stats/summary` - Alert statistics
- `GET /api/alerts/rules` - List alert rules
- `GET /api/alerts/rules/:id` - Get rule with recent alerts
- `POST /api/alerts/rules` - Create alert rule
- `PATCH /api/alerts/rules/:id` - Update alert rule

### Firmware (FOTA)

- `GET /api/firmware/versions` - List firmware versions
- `GET /api/firmware/versions/:id` - Get version details
- `POST /api/firmware/versions` - Upload firmware version
- `GET /api/firmware/jobs` - List FOTA jobs
- `GET /api/firmware/jobs/:id` - Get job with device status
- `POST /api/firmware/jobs` - Create FOTA job
- `POST /api/firmware/jobs/:id/start` - Start FOTA job
- `PATCH /api/firmware/jobs/:job_id/devices/:device_id` - Update device status

### Analytics

- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/device-uptime` - Device uptime report
- `GET /api/analytics/alert-trends` - Alert trends (by day, priority, device)
- `GET /api/analytics/installation-metrics` - Installation metrics
- `GET /api/analytics/telemetry-summary` - Telemetry summary for device

## 📊 Database Schema

The API interacts with 19+ PostgreSQL tables:

### Identity & Access
- `tenants` - Multi-tenant organizations
- `users` - User accounts with roles
- `teams` - Team groupings
- `team_members` - Team membership

### Devices
- `devices` - IoT devices
- `device_health` - Health metrics
- `device_data` - Telemetry data
- `installations` - Installation records
- `locations` - GPS/address data

### Alerts
- `alerts` - Alert instances
- `alert_rules` - Alert rule definitions
- `notifications` - Notification deliveries

### Firmware
- `firmware_versions` - Firmware releases
- `fota_jobs` - Update campaigns
- `fota_job_devices` - Job progress per device

### Billing (Schema ready)
- `billing_accounts`
- `invoices`
- `subscriptions`
- `usage_records`

See `init-db/10-complete-schema.sql` for full schema.

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=flowset_user
POSTGRES_PASSWORD=flowset_password
POSTGRES_DB=flowset_db

# Server
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173

# Auth (for production)
JWT_SECRET=your-secret-key
```

### CORS

The API allows CORS from:
- Frontend: `http://localhost:5173`
- Custom origins via `ALLOWED_ORIGINS` env var

## 📝 Response Format

All responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { /* ... */ },
  "metadata": { /* optional pagination/stats */ }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

## 🧪 Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/health

# Get all devices
curl http://localhost:3001/api/devices

# Get devices for tenant
curl "http://localhost:3001/api/devices?tenant_id=11111111-1111-1111-1111-111111111111"

# Create device
curl -X POST http://localhost:3001/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEV-NEW-001",
    "tenant_id": "11111111-1111-1111-1111-111111111111",
    "device_type": "flood_sensor",
    "name": "Test Device"
  }'
```

### Automated Testing

```bash
# Run endpoint tests
npm run test:endpoints

# Run database tests
npm run test:db
```

## 🗂️ Project Structure

```
backend/
├── server-api.js           # Main API server
├── db.js                   # PostgreSQL connection pool
├── routes/
│   ├── alerts.js          # Alert endpoints
│   ├── analytics.js       # Analytics endpoints
│   └── firmware.js        # Firmware endpoints
├── test-endpoints.js      # API tests
├── test-db.js            # Database tests
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔐 Security

### Current (Development)

- ❌ No authentication
- ❌ No rate limiting
- ✅ CORS enabled for localhost
- ✅ SQL injection protected (parameterized queries)

### Production Ready

- [ ] JWT authentication
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting
- [ ] API keys for devices
- [ ] HTTPS only
- [ ] Input validation middleware
- [ ] Audit logging

## 📈 Performance

### Database

- Connection pooling (max 20 connections)
- Indexed foreign keys
- Optimized queries with JOINs
- Efficient filtering

### API

- Async/await throughout
- Error handling middleware
- Request logging
- Pagination support

## 🐛 Error Handling

### PostgreSQL Errors

- `23505` - Duplicate entry → `409 Conflict`
- `23503` - Invalid reference → `400 Bad Request`
- Generic errors → `500 Internal Server Error`

### Application Errors

All errors are caught by async handler and return JSON responses.

## 📚 Documentation

- **API Design**: `../API_ENDPOINT_DESIGN.md`
- **Feature Mapping**: `../FEATURE_TO_TABLE_MAPPING.md`
- **System Overview**: `../COMPLETE_SYSTEM_OVERVIEW.md`
- **Database Schema**: `../init-db/10-complete-schema.sql`

## 🚧 TODO

### Short-term
- [ ] Add JWT authentication
- [ ] Add input validation (Joi/Zod)
- [ ] Add request rate limiting
- [ ] Add WebSocket support
- [ ] Add API documentation (Swagger/OpenAPI)

### Long-term
- [ ] Add GraphQL endpoint
- [ ] Add caching (Redis)
- [ ] Add message queue (RabbitMQ/Kafka)
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Add CI/CD pipeline

## 📞 Support

For issues or questions, see:
- Project docs in parent directory
- Database schema in `../init-db/`
- Sample data in `../init-db/11-sample-data.sql`

---

**Built with** ❤️ **for FlowSet IoT Platform**
