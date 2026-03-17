# Frontend Integration Guide

## 🎯 Overview

The backend API is **complete and running**. This guide shows you how to connect your existing React frontend to the new PostgreSQL backend.

## 📝 Quick Summary

**What Changed:**
- ❌ Firebase (Firestore, Auth, Storage) → Removed
- ✅ PostgreSQL backend with REST API → Active
- ✅ Auth temporarily bypassed for development
- ✅ 48 API endpoints ready to use

**What Stays the Same:**
- React frontend structure
- Component hierarchy
- UI/UX design
- Routing

## 🔧 Step-by-Step Integration

### Step 1: Create API Client

Create `src/lib/api-client.ts`:

```typescript
const API_BASE = 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: any;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  // Devices
  async getDevices(params?: {
    tenant_id?: string;
    device_type?: string;
    is_active?: boolean;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/devices${query ? '?' + query : ''}`);
  }

  async getDevice(id: string) {
    return this.request('GET', `/api/devices/${id}`);
  }

  async createDevice(data: {
    device_id: string;
    tenant_id: string;
    device_type: string;
    name: string;
  }) {
    return this.request('POST', '/api/devices', data);
  }

  async getDeviceData(deviceId: string, params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/devices/${deviceId}/data${query ? '?' + query : ''}`);
  }

  async postDeviceData(deviceId: string, data: {
    timestamp?: string;
    data: any;
  }) {
    return this.request('POST', `/api/devices/${deviceId}/data`, data);
  }

  // Installations
  async getInstallations(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/installations${query ? '?' + query : ''}`);
  }

  async getInstallationMap(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/installations/map${query ? '?' + query : ''}`);
  }

  async createInstallation(data: {
    device_id: string;
    installed_by_user_id: string;
    installation_notes?: string;
    initial_sensor_readings?: any;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      country?: string;
      source?: string;
    };
  }) {
    return this.request('POST', '/api/installations', data);
  }

  // Alerts
  async getAlerts(params?: {
    tenant_id?: string;
    device_id?: string;
    status?: string;
    priority?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/alerts${query ? '?' + query : ''}`);
  }

  async acknowledgeAlert(id: string, userId: string) {
    return this.request('PATCH', `/api/alerts/${id}/acknowledge`, { user_id: userId });
  }

  async resolveAlert(id: string, userId: string) {
    return this.request('PATCH', `/api/alerts/${id}/resolve`, { user_id: userId });
  }

  async getAlertStats(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/alerts/stats/summary${query ? '?' + query : ''}`);
  }

  // Analytics
  async getDashboard(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/dashboard${query ? '?' + query : ''}`);
  }

  async getDeviceUptime(params?: { tenant_id?: string; period?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/device-uptime${query ? '?' + query : ''}`);
  }

  async getAlertTrends(params?: { tenant_id?: string; period?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/alert-trends${query ? '?' + query : ''}`);
  }

  // Users
  async getUsers(params?: { tenant_id?: string; role?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/users${query ? '?' + query : ''}`);
  }

  // Teams
  async getTeams(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/teams${query ? '?' + query : ''}`);
  }

  // Firmware
  async getFirmwareVersions(params?: { device_type?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/firmware/versions${query ? '?' + query : ''}`);
  }

  async getFotaJobs(params?: { tenant_id?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/firmware/jobs${query ? '?' + query : ''}`);
  }
}

export const apiClient = new ApiClient(API_BASE);
```

### Step 2: Update Auth Context

Modify `src/lib/auth-context.tsx` to include tenant_id:

```typescript
// Update MOCK_PROFILE to include tenant
const MOCK_PROFILE: UserProfile = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Dev User',
  isAdmin: true,
  role: 'admin',
  tenant_id: '11111111-1111-1111-1111-111111111111', // Add this
};

// Make tenant_id available in context
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  tenant_id: string; // Add this
}
```

### Step 3: Update Components

#### Example: Dashboard Component

```typescript
// src/pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function Dashboard() {
  const { tenant_id } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data } = await apiClient.getDashboard({ tenant_id });
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [tenant_id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div>Total Devices: {stats?.devices.total}</div>
        <div>Online: {stats?.devices.online}</div>
        <div>Open Alerts: {stats?.alerts.open}</div>
        <div>Health Score: {stats?.health_score}%</div>
      </div>
    </div>
  );
}
```

#### Example: Devices List

```typescript
// src/pages/devices.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function Devices() {
  const { tenant_id } = useAuth();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    async function loadDevices() {
      const { data } = await apiClient.getDevices({ tenant_id });
      setDevices(data);
    }

    loadDevices();
  }, [tenant_id]);

  return (
    <div>
      <h1>Devices</h1>
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.device_id}</td>
              <td>{device.name}</td>
              <td>{device.device_type}</td>
              <td>{device.current_status}</td>
              <td>{new Date(device.last_seen_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### Example: Map View

```typescript
// src/pages/map.tsx
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function MapView() {
  const { tenant_id } = useAuth();
  const [installations, setInstallations] = useState([]);

  useEffect(() => {
    async function loadMap() {
      const { data } = await apiClient.getInstallationMap({ tenant_id });
      setInstallations(data);
    }

    loadMap();
  }, [tenant_id]);

  return (
    <MapContainer center={[24.7136, 46.6753]} zoom={6}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {installations.map((install) => (
        <Marker key={install.device_id} position={[install.latitude, install.longitude]}>
          <Popup>
            <strong>{install.name}</strong><br />
            Status: {install.current_status}<br />
            Type: {install.device_type}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### Step 4: Remove Firebase Dependencies

Once you've migrated all components:

```bash
# Remove Firebase packages
npm uninstall firebase firebase-admin

# Remove Firebase files
rm -rf src/lib/firebase.ts
rm -rf src/lib/firebase-stubs.ts
```

Update `vite.config.ts` to remove Firebase aliases.

## 🗺️ Component Migration Checklist

### Dashboard
- [ ] Replace Firestore queries with `apiClient.getDashboard()`
- [ ] Update stats display with new data structure

### Devices
- [ ] Replace `getDocs(collection(db, 'devices'))` with `apiClient.getDevices()`
- [ ] Update device detail view with `apiClient.getDevice(id)`
- [ ] Replace telemetry queries with `apiClient.getDeviceData()`

### Map View
- [ ] Replace Firestore location queries with `apiClient.getInstallationMap()`
- [ ] Update marker data structure

### Alerts
- [ ] Replace alert queries with `apiClient.getAlerts()`
- [ ] Add acknowledge/resolve buttons using API methods
- [ ] Update alert statistics

### Teams
- [ ] Replace team queries with `apiClient.getTeams()`
- [ ] Update team member lists

### Settings
- [ ] Replace user queries with `apiClient.getUsers()`
- [ ] Update user profile editing

## 📊 Data Structure Mapping

### Firebase → PostgreSQL

#### Device Document → Device Object

**Before (Firebase):**
```javascript
{
  id: "abc123",
  deviceId: "DEV-001",
  name: "Sensor 1",
  type: "flood_sensor",
  location: {
    lat: 24.7,
    lng: 46.6
  }
}
```

**After (PostgreSQL):**
```javascript
{
  id: "uuid",
  device_id: "DEV-001",
  name: "Sensor 1",
  device_type: "flood_sensor",
  current_status: "online",
  last_seen_at: "2026-02-10T09:00:00Z",
  latitude: 24.7,
  longitude: 46.6,
  city: "Riyadh"
}
```

#### Installation Document → Installation Object

**After (PostgreSQL):**
```javascript
{
  id: "uuid",
  device_id: "uuid",
  device_device_id: "DEV-001",
  device_name: "Sensor 1",
  installed_at: "2026-01-15T10:00:00Z",
  installed_by_name: "Ahmed Hassan",
  latitude: 24.7,
  longitude: 46.6,
  address: "King Fahd Road",
  city: "Riyadh"
}
```

## 🧪 Testing Your Integration

### 1. Verify Backend is Running

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "database": "postgresql",
  "time": "2026-02-10T09:00:00.000Z"
}
```

### 2. Test API Client

Create `src/test-api.ts`:

```typescript
import { apiClient } from '@/lib/api-client';

async function testApi() {
  console.log('Testing API...');
  
  const devices = await apiClient.getDevices({ tenant_id: '11111111-1111-1111-1111-111111111111' });
  console.log('Devices:', devices.data);
  
  const dashboard = await apiClient.getDashboard({ tenant_id: '11111111-1111-1111-1111-111111111111' });
  console.log('Dashboard:', dashboard.data);
  
  console.log('API test complete!');
}

testApi();
```

### 3. Check Browser Console

Open browser DevTools → Network tab:
- Should see API calls to `localhost:3001`
- Should see JSON responses
- No CORS errors

## 🚨 Common Issues

### CORS Error
**Problem:** "Access blocked by CORS policy"

**Solution:** Backend already configured for `http://localhost:5173`. Make sure frontend is running on this port.

### 404 Not Found
**Problem:** API endpoint not found

**Solution:** 
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify endpoint path in `backend/README.md`
3. Check for typos in API calls

### Empty Data
**Problem:** API returns empty arrays

**Solution:**
1. Check database has sample data: `docker exec -it flowset-postgres psql -U flowset_user -d flowset_db -c "SELECT COUNT(*) FROM devices;"`
2. If empty, reload sample data: `./docker-start.sh` (runs init scripts)

### Wrong Tenant
**Problem:** No data showing for user

**Solution:** Verify tenant_id in auth context matches sample data tenant:
```typescript
tenant_id: '11111111-1111-1111-1111-111111111111' // Saudi Arabia
// or
tenant_id: '22222222-2222-2222-2222-222222222222' // Egypt
```

## 📝 Migration Checklist

- [ ] Backend API running (`npm run dev` in backend)
- [ ] PostgreSQL container running (`docker ps`)
- [ ] Sample data loaded (check database)
- [ ] API client created (`src/lib/api-client.ts`)
- [ ] Auth context updated with tenant_id
- [ ] Dashboard migrated to API
- [ ] Devices list migrated to API
- [ ] Device detail view migrated to API
- [ ] Map view migrated to API
- [ ] Alerts migrated to API
- [ ] Teams migrated to API
- [ ] Settings migrated to API
- [ ] Firebase dependencies removed
- [ ] Frontend runs without errors
- [ ] Data displays correctly

## 🎉 Success Criteria

You'll know the integration is complete when:

✅ Frontend loads without Firebase errors  
✅ Dashboard shows device counts and stats  
✅ Devices page lists all devices  
✅ Map shows device locations  
✅ Alerts display with correct data  
✅ No console errors  
✅ Network tab shows successful API calls  

## 📚 Resources

- **Backend API Docs**: `backend/README.md`
- **API Endpoints**: `API_ENDPOINT_DESIGN.md`
- **Database Schema**: `init-db/10-complete-schema.sql`
- **Sample Data**: `init-db/11-sample-data.sql`

---

**Ready to integrate? Start with creating the API client and updating one component at a time!**
