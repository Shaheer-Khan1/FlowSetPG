import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, getClient, initDatabase } from './db.js';
import alertRoutes from './routes/alerts.js';
import analyticsRoutes from './routes/analytics.js';
import firmwareRoutes from './routes/firmware.js';

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
  },
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  next();
});

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

console.log('🚀 Starting FlowSet IoT Platform API...');

// Initialize database
await initDatabase();

// ============================================
// Health & System
// ============================================

app.get('/health', asyncHandler(async (req, res) => {
  const result = await query('SELECT NOW() as time, version() as version');
  res.json({ 
    status: 'ok',
    database: 'postgresql',
    time: result.rows[0].time,
    version: result.rows[0].version.split(',')[0],
    timestamp: new Date().toISOString()
  });
}));

app.get('/api/system/stats', asyncHandler(async (req, res) => {
  const stats = await query(`
    SELECT 
      (SELECT COUNT(*) FROM tenants WHERE is_active = true) as active_tenants,
      (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
      (SELECT COUNT(*) FROM devices WHERE is_active = true) as active_devices,
      (SELECT COUNT(*) FROM alerts WHERE status = 'open') as open_alerts,
      (SELECT COUNT(*) FROM installations) as total_installations
  `);
  
  res.json({ success: true, data: stats.rows[0] });
}));

// ============================================
// Tenants
// ============================================

app.get('/api/tenants', asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT t.*,
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
      (SELECT COUNT(*) FROM devices WHERE tenant_id = t.id) as device_count,
      (SELECT COUNT(*) FROM teams WHERE tenant_id = t.id) as team_count
    FROM tenants t
    ORDER BY t.created_at DESC
  `);
  
  res.json({ success: true, data: result.rows });
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
      (SELECT COUNT(*) FROM teams WHERE tenant_id = $1) as team_count,
      (SELECT COUNT(*) FROM alerts WHERE tenant_id = $1 AND status = 'open') as open_alerts
  `, [id]);
  
  res.json({
    success: true,
    data: { ...tenant.rows[0], stats: stats.rows[0] }
  });
}));

app.post('/api/tenants', asyncHandler(async (req, res) => {
  const { name, code, country } = req.body;
  
  const result = await query(`
    INSERT INTO tenants (name, code, country)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [name, code, country]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ============================================
// Users
// ============================================

app.get('/api/users', asyncHandler(async (req, res) => {
  const { tenant_id, role, is_active } = req.query;
  
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
  
  sql += ' ORDER BY u.created_at DESC';
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
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
    SELECT tm.role as team_role, te.*
    FROM team_members tm
    JOIN teams te ON tm.team_id = te.id
    WHERE tm.user_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: { ...user.rows[0], teams: teams.rows }
  });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const { email, full_name, role, tenant_id } = req.body;
  
  const result = await query(`
    INSERT INTO users (email, full_name, role, tenant_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [email, full_name, role, tenant_id]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
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
  
  if (tenant_id) {
    sql += ' AND t.tenant_id = $1';
    const result = await query(sql, [tenant_id]);
    return res.json({ success: true, data: result.rows });
  }
  
  const result = await query(sql);
  res.json({ success: true, data: result.rows });
}));

app.get('/api/teams/:id/members', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(`
    SELECT tm.*, u.email, u.full_name
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = $1
  `, [id]);
  
  res.json({ success: true, data: result.rows });
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

// ============================================
// Devices
// ============================================

app.get('/api/devices', asyncHandler(async (req, res) => {
  const { tenant_id, device_type, is_active, status } = req.query;
  
  let sql = `
    SELECT 
      d.*,
      dh.current_status,
      dh.last_seen_at,
      dh.connectivity_score,
      i.installed_at,
      l.city, l.latitude, l.longitude,
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
  
  sql += ' ORDER BY d.created_at DESC';
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

app.get('/api/devices/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const device = await query(`
    SELECT d.*, t.name as tenant_name
    FROM devices d
    JOIN tenants t ON d.tenant_id = t.id
    WHERE d.id = $1
  `, [id]);
  
  if (device.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  const health = await query('SELECT * FROM device_health WHERE device_id = $1', [id]);
  const latestData = await query(`
    SELECT * FROM device_data 
    WHERE device_id = $1 
    ORDER BY timestamp DESC 
    LIMIT 1
  `, [id]);
  
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
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    const device = await client.query(`
      INSERT INTO devices (device_id, tenant_id, device_type, name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [device_id, tenant_id, device_type, name]);
    
    await client.query(`
      INSERT INTO device_health (device_id, current_status)
      VALUES ($1, 'offline')
    `, [device.rows[0].id]);
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: device.rows[0] });
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
        device_metadata = COALESCE($3, device_metadata),
        updated_at = NOW()
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
  const result = await query('SELECT * FROM device_health WHERE device_id = $1', [device_id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device health not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Device Data
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
  res.json({ success: true, data: result.rows });
}));

app.post('/api/devices/:device_id/data', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  const { timestamp, data } = req.body;
  
  const result = await query(`
    INSERT INTO device_data (device_id, timestamp, data)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [device_id, timestamp || new Date(), data]);
  
  // Update health
  await query(`
    UPDATE device_health
    SET last_seen_at = NOW(),
        message_count_24h = message_count_24h + 1
    WHERE device_id = $1
  `, [device_id]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

app.get('/api/devices/:device_id/data/latest', asyncHandler(async (req, res) => {
  const { device_id } = req.params;
  
  const result = await query(`
    SELECT * FROM device_data WHERE device_id = $1 
    ORDER BY timestamp DESC LIMIT 1
  `, [device_id]);
  
  res.json({ success: true, data: result.rows[0] || null });
}));

// ============================================
// Installations
// ============================================

app.get('/api/installations', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;
  
  let sql = `
    SELECT 
      i.*,
      l.latitude, l.longitude, l.address, l.city, l.country,
      d.device_id, d.name as device_name, d.device_type,
      u.full_name as installed_by_name,
      t.name as tenant_name
    FROM installations i
    LEFT JOIN locations l ON i.id = l.installation_id
    JOIN devices d ON i.device_id = d.id
    JOIN tenants t ON d.tenant_id = t.id
    LEFT JOIN users u ON i.installed_by_user_id = u.id
    WHERE 1=1
  `;
  
  if (tenant_id) {
    sql += ' AND d.tenant_id = $1';
    const result = await query(sql, [tenant_id]);
    return res.json({ success: true, data: result.rows });
  }
  
  const result = await query(sql);
  res.json({ success: true, data: result.rows });
}));

app.get('/api/installations/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(`
    SELECT 
      i.*,
      l.*,
      d.device_id, d.name as device_name,
      u.full_name as installed_by_name
    FROM installations i
    LEFT JOIN locations l ON i.id = l.installation_id
    JOIN devices d ON i.device_id = d.id
    LEFT JOIN users u ON i.installed_by_user_id = u.id
    WHERE i.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Installation not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
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
    
    const installation = await client.query(`
      INSERT INTO installations (
        device_id, installed_by_user_id,
        installation_notes, initial_sensor_readings
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [device_id, installed_by_user_id, installation_notes, initial_sensor_readings]);
    
    let locationResult = null;
    if (location) {
      locationResult = await client.query(`
        INSERT INTO locations (
          installation_id, latitude, longitude,
          address, city, country, source
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
    
    await client.query(`
      UPDATE devices SET is_provisioned = true WHERE id = $1
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
      d.device_id, d.name, d.device_type,
      i.installed_at,
      l.latitude, l.longitude, l.city, l.address,
      dh.current_status
    FROM installations i
    JOIN devices d ON i.device_id = d.id
    LEFT JOIN locations l ON i.id = l.installation_id
    LEFT JOIN device_health dh ON d.id = dh.device_id
    WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
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
// Mount Route Modules
// ============================================

app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/firmware', firmwareRoutes);

// ============================================
// 404 Handler
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// ============================================
// Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Handle specific PostgreSQL errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this value already exists'
    });
  }
  
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference',
      message: 'Referenced record does not exist'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║   FlowSet IoT Platform API                    ║`);
  console.log(`╚════════════════════════════════════════════════╝`);
  console.log(`\n🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`\n📍 Main Endpoints:`);
  console.log(`   🏢 Tenants:       /api/tenants`);
  console.log(`   👥 Users:         /api/users`);
  console.log(`   👨‍👩‍👧‍👦 Teams:         /api/teams`);
  console.log(`   🔧 Devices:       /api/devices`);
  console.log(`   📍 Installations: /api/installations`);
  console.log(`   🚨 Alerts:        /api/alerts`);
  console.log(`   📊 Analytics:     /api/analytics`);
  console.log(`   💾 Firmware:      /api/firmware`);
  console.log(`\n✅ PostgreSQL Multi-Tenant IoT Platform`);
  console.log(`🗄️  Database: flowset_db (19+ tables)`);
  console.log(`🔓 Development Mode - Auth bypassed`);
  console.log(`\n📚 API Docs: See API_ENDPOINT_DESIGN.md`);
  console.log(`🗺️  Feature Mapping: See FEATURE_TO_TABLE_MAPPING.md\n`);
});
