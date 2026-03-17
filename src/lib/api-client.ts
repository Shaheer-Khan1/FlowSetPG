// API Client for FlowSet IoT Platform
// Replaces Firebase with PostgreSQL REST API

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    total?: number;
    returned?: number;
    offset?: number;
    limit?: number;
    count?: number;
  };
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

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ============================================
  // System
  // ============================================

  async health() {
    return this.request('GET', '/health');
  }

  async getSystemStats() {
    return this.request('GET', '/api/system/stats');
  }

  // ============================================
  // Tenants
  // ============================================

  async getTenants() {
    return this.request<any[]>('GET', '/api/tenants');
  }

  async getTenant(id: string) {
    return this.request('GET', `/api/tenants/${id}`);
  }

  async createTenant(data: { name: string; code: string; country: string }) {
    return this.request('POST', '/api/tenants', data);
  }

  // ============================================
  // Users
  // ============================================

  async getUsers(params?: {
    tenant_id?: string;
    role?: string;
    is_active?: boolean;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/users${query ? '?' + query : ''}`);
  }

  async getUser(id: string) {
    return this.request('GET', `/api/users/${id}`);
  }

  async createUser(data: {
    email: string;
    full_name: string;
    role: string;
    tenant_id: string;
  }) {
    return this.request('POST', '/api/users', data);
  }

  async updateUser(id: string, data: {
    full_name?: string;
    role?: string;
    is_active?: boolean;
    enabled_modules?: string[];
  }) {
    return this.request('PATCH', `/api/users/${id}`, data);
  }

  // ============================================
  // Teams
  // ============================================

  async getTeams(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/teams${query ? '?' + query : ''}`);
  }

  async getTeamMembers(teamId: string) {
    return this.request<any[]>('GET', `/api/teams/${teamId}/members`);
  }

  async createTeam(data: {
    tenant_id: string;
    name: string;
    description?: string;
  }) {
    return this.request('POST', '/api/teams', data);
  }

  // ============================================
  // Devices
  // ============================================

  async getDevices(params?: {
    tenant_id?: string;
    device_type?: string;
    is_active?: boolean;
    status?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/devices${query ? '?' + query : ''}`);
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

  async updateDevice(id: string, data: {
    name?: string;
    is_active?: boolean;
    device_metadata?: any;
  }) {
    return this.request('PATCH', `/api/devices/${id}`, data);
  }

  async getDeviceHealth(deviceId: string) {
    return this.request('GET', `/api/devices/${deviceId}/health`);
  }

  async getDeviceData(deviceId: string, params?: {
    start_time?: string;
    end_time?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/devices/${deviceId}/data${query ? '?' + query : ''}`);
  }

  async postDeviceData(deviceId: string, data: {
    timestamp?: string;
    data: any;
  }) {
    return this.request('POST', `/api/devices/${deviceId}/data`, data);
  }

  async getLatestDeviceData(deviceId: string) {
    return this.request('GET', `/api/devices/${deviceId}/data/latest`);
  }

  // ============================================
  // Installations
  // ============================================

  async getInstallations(params?: { tenant_id?: string; device_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/installations${query ? '?' + query : ''}`);
  }

  async getInstallation(id: string) {
    return this.request('GET', `/api/installations/${id}`);
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

  async getInstallationMap(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/installations/map${query ? '?' + query : ''}`);
  }

  // ============================================
  // Alerts
  // ============================================

  async getAlerts(params?: {
    tenant_id?: string;
    device_id?: string;
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/alerts${query ? '?' + query : ''}`);
  }

  async getAlert(id: string) {
    return this.request('GET', `/api/alerts/${id}`);
  }

  async createAlert(data: {
    rule_id?: string;
    device_id: string;
    tenant_id: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    trigger_data?: any;
  }) {
    return this.request('POST', '/api/alerts', data);
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

  async getAlertRules(params?: { tenant_id?: string; is_active?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/alerts/rules${query ? '?' + query : ''}`);
  }

  async getAlertRule(id: string) {
    return this.request('GET', `/api/alerts/rules/${id}`);
  }

  async createAlertRule(data: {
    name: string;
    description?: string;
    device_id?: string;
    tenant_id: string;
    condition: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title_template: string;
    message_template: string;
    notify_email?: boolean;
    notify_sms?: boolean;
    notify_webhook?: boolean;
    webhook_url?: string;
  }) {
    return this.request('POST', '/api/alerts/rules', data);
  }

  async updateAlertRule(id: string, data: {
    name?: string;
    condition?: any;
    is_active?: boolean;
    priority?: string;
  }) {
    return this.request('PATCH', `/api/alerts/rules/${id}`, data);
  }

  // ============================================
  // Analytics
  // ============================================

  async getDashboard(params?: { tenant_id?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/dashboard${query ? '?' + query : ''}`);
  }

  async getDeviceUptime(params?: { tenant_id?: string; period?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/analytics/device-uptime${query ? '?' + query : ''}`);
  }

  async getAlertTrends(params?: { tenant_id?: string; period?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/alert-trends${query ? '?' + query : ''}`);
  }

  async getInstallationMetrics(params?: {
    tenant_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/installation-metrics${query ? '?' + query : ''}`);
  }

  async getTelemetrySummary(deviceId: string, params?: {
    period?: string;
    interval?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/api/analytics/telemetry-summary${query ? '?' + query : ''}`);
  }

  // ============================================
  // Firmware
  // ============================================

  async getFirmwareVersions(params?: { device_type?: string; is_recommended?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/firmware/versions${query ? '?' + query : ''}`);
  }

  async getFirmwareVersion(id: string) {
    return this.request('GET', `/api/firmware/versions/${id}`);
  }

  async createFirmwareVersion(data: {
    device_type: string;
    name: string;
    version: string;
    file_path: string;
    checksum: string;
    file_size_bytes: number;
    release_notes?: string;
    min_hw_version?: string;
    is_recommended?: boolean;
    is_mandatory?: boolean;
  }) {
    return this.request('POST', '/api/firmware/versions', data);
  }

  async getFotaJobs(params?: { tenant_id?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>('GET', `/api/firmware/jobs${query ? '?' + query : ''}`);
  }

  async getFotaJob(id: string) {
    return this.request('GET', `/api/firmware/jobs/${id}`);
  }

  async createFotaJob(data: {
    name: string;
    tenant_id: string;
    firmware_version_id: string;
    device_ids: string[];
    created_by_user_id: string;
  }) {
    return this.request('POST', '/api/firmware/jobs', data);
  }

  async startFotaJob(id: string) {
    return this.request('POST', `/api/firmware/jobs/${id}/start`, {});
  }

  async updateFotaJobDevice(jobId: string, deviceId: string, data: {
    status?: string;
    last_error?: string;
  }) {
    return this.request('PATCH', `/api/firmware/jobs/${jobId}/devices/${deviceId}`, data);
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE);

// Export type for use in components
export type { ApiClient };
