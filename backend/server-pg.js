import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, getClient } from './db.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Initialize Express app
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

console.log('🚀 Starting FlowSet Backend with PostgreSQL...');

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'postgresql',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Get all installations
app.get('/api/installations', async (req, res) => {
  try {
    const { teamId, status, limit, offset, startDate, endDate, deviceId, locationId } = req.query;

    let sql = `
      SELECT 
        i.*,
        t.name as team_name,
        l.municipality_name,
        l.latitude as location_latitude,
        l.longitude as location_longitude
      FROM installations i
      LEFT JOIN teams t ON i.team_id = t.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (teamId) {
      sql += ` AND i.team_id = $${paramCount++}`;
      params.push(teamId);
    }
    if (status) {
      sql += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }
    if (deviceId) {
      sql += ` AND i.device_id = $${paramCount++}`;
      params.push(deviceId);
    }
    if (locationId) {
      sql += ` AND i.location_id = $${paramCount++}`;
      params.push(locationId);
    }
    if (startDate) {
      sql += ` AND i.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND i.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ' ORDER BY i.created_at DESC';

    if (limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(parseInt(limit));
    }
    if (offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(parseInt(offset));
    }

    const result = await query(sql, params);
    
    // Get total count
    const countSql = 'SELECT COUNT(*) FROM installations WHERE 1=1' + 
      (teamId ? ' AND team_id = $1' : '') +
      (status ? ' AND status = $' + (teamId ? '2' : '1') : '');
    const countParams = [teamId, status].filter(Boolean);
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      metadata: {
        total,
        returned: result.rows.length,
        offset: offset ? parseInt(offset) : 0,
        limit: limit ? parseInt(limit) : null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get single installation
app.get('/api/installations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT 
        i.*,
        t.name as team_name,
        l.municipality_name,
        l.latitude as location_latitude,
        l.longitude as location_longitude
      FROM installations i
      LEFT JOIN teams t ON i.team_id = t.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: `Installation ${id} not found` });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching installation:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get installations by device ID
app.get('/api/installations/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await query(`
      SELECT 
        i.*,
        t.name as team_name
      FROM installations i
      LEFT JOIN teams t ON i.team_id = t.id
      WHERE i.device_id = $1
      ORDER BY i.created_at DESC
    `, [deviceId]);

    res.json({
      success: true,
      data: result.rows,
      metadata: {
        deviceId,
        total: result.rows.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching installations by device:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get installation statistics
app.get('/api/installations/stats/summary', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'verified') as verified,
        COUNT(*) FILTER (WHERE status = 'flagged') as flagged,
        COUNT(*) FILTER (WHERE system_pre_verified = true) as system_pre_verified,
        COUNT(*) FILTER (WHERE image_urls IS NOT NULL AND array_length(image_urls, 1) > 0) as with_images,
        COUNT(*) FILTER (WHERE video_url IS NOT NULL) as with_video
      FROM installations
    `);

    const teamStats = await query(`
      SELECT t.name, t.id, COUNT(i.*) as count
      FROM teams t
      LEFT JOIN installations i ON i.team_id = t.id
      GROUP BY t.id, t.name
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        ...stats.rows[0],
        byStatus: {
          pending: parseInt(stats.rows[0].pending),
          verified: parseInt(stats.rows[0].verified),
          flagged: parseInt(stats.rows[0].flagged)
        },
        byTeam: teamStats.rows.reduce((acc, row) => {
          acc[row.id] = { name: row.name, count: parseInt(row.count) };
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const result = await query('SELECT * FROM teams ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM locations ORDER BY municipality_name, name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const result = await query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Create installation
app.post('/api/installations', async (req, res) => {
  try {
    const {
      device_id, team_id, location_id, installer_name,
      latitude, longitude, user_reading, server_reading,
      image_urls, video_url, status = 'pending'
    } = req.body;

    const result = await query(`
      INSERT INTO installations (
        device_id, team_id, location_id, installer_name,
        latitude, longitude, user_reading, server_reading,
        image_urls, video_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      device_id, team_id, location_id, installer_name,
      latitude, longitude, user_reading, server_reading,
      image_urls, video_url, status
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating installation:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested endpoint does not exist' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 FlowSet Backend API (PostgreSQL) running on http://localhost:${PORT}`);
  console.log(`\n📍 Main Endpoints:`);
  console.log(`   📊 Health: http://localhost:${PORT}/health`);
  console.log(`   📦 Installations: http://localhost:${PORT}/api/installations`);
  console.log(`   👥 Teams: http://localhost:${PORT}/api/teams`);
  console.log(`   📍 Locations: http://localhost:${PORT}/api/locations`);
  console.log(`   🔧 Devices: http://localhost:${PORT}/api/devices`);
  console.log(`   📈 Statistics: http://localhost:${PORT}/api/installations/stats/summary`);
  console.log(`\n✅ Using PostgreSQL database`);
  console.log(`🔓 Auth bypassed for development\n`);
});
