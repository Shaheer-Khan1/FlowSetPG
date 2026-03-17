import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, getClient } from './db.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

console.log('🚀 Starting FlowSet IoT Platform API...');

// ============================================
// Middleware
// ============================================

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// Health & System
// ============================================

app.get('/health', asyncHandler(async (req, res) => {
  const result = await query('SELECT NOW() as time, version() as version');
  res.json({ 
    status: 'ok',
    database: 'postgresql',
    time: result.rows[0].time,
    version: result.rows[0].version.split(',')[0]
  });
}));

// ============================================
// Tenants
// ============================================

app.get('/api/tenants', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT t.*,
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
      (SELECT COUNT(*) FROM devices WHERE tenant_id = t.id) as device_count
    FROM tenants t
    ORDER BY t.created_at DESC
  `);
  
  res.json({
    success: true,
    data: result.rows,
    metadata: { total: result.rows.length }
  });
}));

app.get('/api/tenants/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tenant = await query('SELECT * FROM tenants WHERE id = $1', [id]);
  if (tenant.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  
  const stats = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as user_count,
      (SELECT COUNT(*) FROM devices WHERE tenant_id = $1) as device_count,
      (SELECT COUNT(*) FROM alerts WHERE tenant_id = $1 AND status = 'open') as open_alerts,
      (SELECT COUNT(*) FROM installations i 
        JOIN devices d ON i.device_id = d.id 
        WHERE d.tenant_id = $1) as installation_count
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...tenant.rows[0],
      stats: stats.rows[0]
    }
  });
}));

app.post('/api/tenants', asyncHandler(async (req, res) => {
  const { name, code, country } = req.body;
  
  const result = await query(`
    INSERT INTO tenants (name, code, country)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, code, country]);
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

app.patch('/api/tenants/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;
  
  const result = await query(`
    UPDATE tenants
    SET name = COALESCE($1, name),
        is_active = COALESCE($2, is_active)
    WHERE id = $3
    RETURNING *
  `, [name, is_active, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// ============================================
// Users
// ============================================

app.get('/api/users', asyncHandler(async (req, res) => {
  const { tenant_id, role, is_active, limit = 50, offset = 0 } = req.query;
  
  let sql = `
    SELECT u.*, t.name as tenant_name
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND u.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (role) {
    sql += ` AND u.role = $${paramCount++}`;
    params.push(role);
  }
  if (is_active !== undefined) {
    sql += ` AND u.is_active = $${paramCount++}`;
    params.push(is_active === 'true');
  }
  
  sql += ` ORDER BY u.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(parseInt(limit), parseInt(offset));
  
  const result = await query(sql, params);
  const countResult = await query('SELECT COUNT(*) FROM users WHERE 1=1' + 
    (tenant_id ? ' AND tenant_id = $1' : ''), 
    tenant_id ? [tenant_id] : []
  );
  
  res.json({
    success: true,
    data: result.rows,
    metadata: {
      total: parseInt(countResult.rows[0].count),
      returned: result.rows.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    }
  });
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await query(`
    SELECT u.*, t.name as tenant_name
    FROM users u
    LEFT JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = $1
  `, [id]);
  
  if (user.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const teams = await query(`
    SELECT tm.role, te.id, te.name, te.description
    FROM team_members tm
    JOIN teams te ON tm.team_id = te.id
    WHERE tm.user_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...user.rows[0],
      teams: teams.rows
    }
  });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const { email, full_name, role, tenant_id, enabled_modules } = req.body;
  
  const result = await query(`
    INSERT INTO users (email, full_name, role, tenant_id, enabled_modules)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [email, full_name, role, tenant_id, enabled_modules || []]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

app.patch('/api/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, role, is_active, enabled_modules } = req.body;
  
  const result = await query(`
    UPDATE users
    SET full_name = COALESCE($1, full_name),
        role = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        enabled_modules = COALESCE($4, enabled_modules)
    WHERE id = $5
    RETURNING *
  `, [full_name, role, is_active, enabled_modules, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// ============================================
// Teams
// ============================================

app.get('/api/teams', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;
  
  let sql = `
    SELECT t.*,
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t
    WHERE 1=1
  `;
  const params = [];
  
  if (tenant_id) {
    sql += ' AND t.tenant_id = $1';
    params.push(tenant_id);
  }
  
  sql += ' ORDER BY t.created_at DESC';
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

app.get('/api/teams/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const team = await query('SELECT * FROM teams WHERE id = $1', [id]);
  if (team.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  
  const members = await query(`
    SELECT tm.role, u.id, u.email, u.full_name
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...team.rows[0],
      members: members.rows
    }
  });
}));

app.post('/api/teams', asyncHandler(async (req, res) => {
  const { tenant_id, name, description } = req.body;
  
  const result = await query(`
    INSERT INTO teams (tenant_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [tenant_id, name, description]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

app.post('/api/teams/:id/members', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id, role } = req.body;
  
  const result = await query(`
    INSERT INTO team_members (team_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [id, user_id, role || 'member']);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ============================================
// Devices
// ============================================

app.get('/api/devices', asyncHandler(async (req, res) => {
  const { tenant_id, device_type, is_active, status, limit = 50, offset = 0 } = req.query;
  
  let sql = `
    SELECT 
      d.*,
      dh.current_status,
      dh.last_seen_at,
      dh.connectivity_score,
      dh.uptime_24h_percent,
      i.installed_at,
      l.city,
      l.latitude,
      l.longitude,
      t.name as tenant_name
    FROM devices d
    LEFT JOIN device_health dh ON d.id = dh.device_id
    LEFT JOIN installations i ON d.id = i.device_id
    LEFT JOIN locations l ON i.id = l.installation_id
    JOIN tenants t ON d.tenant_id = t.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND d.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (device_type) {
    sql += ` AND d.device_type = $${paramCount++}`;
    params.push(device_type);
  }
  if (is_active !== undefined) {
    sql += ` AND d.is_active = $${paramCount++}`;
    params.push(is_active === 'true');
  }
  if (status) {
    sql += ` AND dh.current_status = $${paramCount++}`;
    params.push(status);
  }
  
  sql += ` ORDER BY d.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(parseInt(limit), parseInt(offset));
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
    metadata: {
      returned: result.rows.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    }
  });
}));

app.get('/api/devices/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get device with all related data
  const device = await query(`
    SELECT d.*, t.name as tenant_name
    FROM devices d
    JOIN tenants t ON d.tenant_id = t.id
    WHERE d.id = $1
  `, [id]);
  
  if (device.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  // Get health
  const health = await query('SELECT * FROM device_health WHERE device_id = $1', [id]);
  
  // Get latest data
  const latestData = await query(`
    SELECT * FROM device_data 
    WHERE device_id = $1 
    ORDER BY timestamp DESC 
    LIMIT 1
  `, [id]);
  
  // Get installation
  const installation = await query(`
    SELECT i.*, l.*, u.full_name as installed_by_name
    FROM installations i
    LEFT JOIN locations l ON i.id = l.installation_id
    LEFT JOIN users u ON i.installed_by_user_id = u.id
    WHERE i.device_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...device.rows[0],
      health: health.rows[0] || null,
      latest_data: latestData.rows[0] || null,
      installation: installation.rows[0] || null
    }
  });
}));

app.post('/api/devices', asyncHandler(async (req, res) => {
  const { device_id, tenant_id, device_type, name } = req.body;
  
  // Generate provisioning key
  const provisioning_key = `PROV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Create device
    const device = await client.query(`
      INSERT INTO devices (
        device_id, tenant_id, device_type, name,
        provisioning_key, provisioning_key_expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [device_id, tenant_id, device_type, name, provisioning_key, expires_at]);
    
    // Create initial health record
    await client.query(`
      INSERT INTO device_health (device_id, current_status)
      VALUES ($1, 'provisioned')
    `, [device.rows[0].id]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: device.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.patch('/api/devices/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, is_active, device_metadata } = req.body;
  
  const result = await query(`
    UPDATE devices
    SET name = COALESCE($1, name),
        is_active = COALESCE($2, is_active),
        device_metadata = COALESCE($3, device_metadata)
    WHERE id = $4
    RETURNING *
  `, [name, is_active, device_metadata, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Device Health
app.get('/api/devices/:device_id/health', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  
  const result = await query(`
    SELECT * FROM device_health WHERE device_id = $1
  `, [device_id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device health not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Device Data (Telemetry)
app.get('/api/devices/:device_id/data', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  const { start_time, end_time, limit = 1000 } = req.query;
  
  let sql = 'SELECT * FROM device_data WHERE device_id = $1';
  const params = [device_id];
  let paramCount = 2;
  
  if (start_time) {
    sql += ` AND timestamp >= $${paramCount++}`;
    params.push(start_time);
  }
  if (end_time) {
    sql += ` AND timestamp <= $${paramCount++}`;
    params.push(end_time);
  }
  
  sql += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
  params.push(parseInt(limit));
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
    metadata: { count: result.rows.length }
  });
}));

app.post('/api/devices/:device_id/data', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  const { timestamp, data } = req.body;
  
  const result = await query(`
    INSERT INTO device_data (device_id, timestamp, data)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [device_id, timestamp || new Date(), data]);
  
  // Update device health
  await query(`
    UPDATE device_health
    SET last_seen_at = NOW(),
        message_count_24h = message_count_24h + 1
    WHERE device_id = $1
  `, [device_id]);
  
  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

app.get('/api/devices/:device_id/data/latest', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  
  const result = await query(`
    SELECT * FROM device_data
    WHERE device_id = $1
    ORDER BY timestamp DESC
    LIMIT 1
  `, [device_id]);
  
  res.json({
    success: true,
    data: result.rows[0] || null
  });
}));

// ============================================
// Installations
// ============================================

app.get('/api/installations', asyncHandler(async (req, res) => {
  const { tenant_id, device_id } = req.query;
  
  let sql = `
    SELECT 
      i.*,
      l.*,
      d.device_id,
      d.name as device_name,
      d.device_type,
      u.full_name as installed_by_name
    FROM installations i
    LEFT JOIN locations l ON i.id = l.installation_id
    JOIN devices d ON i.device_id = d.id
    LEFT JOIN users u ON i.installed_by_user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND d.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (device_id) {
    sql += ` AND i.device_id = $${paramCount++}`;
    params.push(device_id);
  }
  
  sql += ' ORDER BY i.installed_at DESC';
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

app.post('/api/installations', asyncHandler(async (req, res) => {
  const {
    device_id,
    installed_by_user_id,
    installation_notes,
    initial_sensor_readings,
    location
  } = req.body;
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Create installation
    const installation = await client.query(`
      INSERT INTO installations (
        device_id,
        installed_by_user_id,
        installation_notes,
        initial_sensor_readings
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [device_id, installed_by_user_id, installation_notes, initial_sensor_readings]);
    
    // Create location if provided
    let locationResult = null;
    if (location) {
      locationResult = await client.query(`
        INSERT INTO locations (
          installation_id,
          latitude,
          longitude,
          address,
          city,
          country,
          source
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        installation.rows[0].id,
        location.latitude,
        location.longitude,
        location.address,
        location.city,
        location.country,
        location.source || 'gps'
      ]);
    }
    
    // Update device
    await client.query(`
      UPDATE devices
      SET is_provisioned = true
      WHERE id = $1
    `, [device_id]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: {
        installation: installation.rows[0],
        location: locationResult?.rows[0] || null
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/installations/map', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;
  
  let sql = `
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
    WHERE l.latitude IS NOT NULL 
      AND l.longitude IS NOT NULL
  `;
  
  if (tenant_id) {
    sql += ' AND d.tenant_id = $1';
    const result = await query(sql, [tenant_id]);
    return res.json({ success: true, data: result.rows });
  }
  
  const result = await query(sql);
  res.json({ success: true, data: result.rows });
}));

// ============================================
// Continue in next file due to length...
// ============================================

export default app;

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`\n🚀 FlowSet IoT Platform API running on http://localhost:${PORT}`);
    console.log(`\n📍 Main Endpoints:`);
    console.log(`   📊 Health: http://localhost:${PORT}/health`);
    console.log(`   🏢 Tenants: http://localhost:${PORT}/api/tenants`);
    console.log(`   👥 Users: http://localhost:${PORT}/api/users`);
    console.log(`   🔧 Devices: http://localhost:${PORT}/api/devices`);
    console.log(`   📍 Installations: http://localhost:${PORT}/api/installations`);
    console.log(`   🚨 Alerts: http://localhost:${PORT}/api/alerts`);
    console.log(`\n✅ PostgreSQL Multi-Tenant IoT Platform`);
    console.log(`🔓 Development Mode - Auth bypassed\n`);
  });
}
