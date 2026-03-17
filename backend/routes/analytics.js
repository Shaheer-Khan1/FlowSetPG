import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Dashboard overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;
  
  const whereClause = tenant_id ? 'WHERE d.tenant_id = $1' : '';
  const params = tenant_id ? [tenant_id] : [];
  
  // Device stats
  const deviceStats = await query(`
    SELECT 
      COUNT(*) as total_devices,
      COUNT(*) FILTER (WHERE d.is_active = true) as active_devices,
      COUNT(*) FILTER (WHERE dh.current_status = 'online') as online_devices,
      COUNT(*) FILTER (WHERE dh.current_status = 'offline') as offline_devices,
      COUNT(*) FILTER (WHERE dh.current_status = 'degraded') as degraded_devices
    FROM devices d
    LEFT JOIN device_health dh ON d.id = dh.device_id
    ${whereClause}
  `, params);
  
  // Alert stats
  const alertStats = await query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'open') as open_alerts,
      COUNT(*) FILTER (WHERE priority = 'critical' AND status = 'open') as critical_alerts,
      COUNT(*) FILTER (WHERE triggered_at > NOW() - INTERVAL '24 hours') as alerts_24h
    FROM alerts
    ${tenant_id ? 'WHERE tenant_id = $1' : ''}
  `, params);
  
  // Recent installations
  const recentInstallations = await query(`
    SELECT COUNT(*) as count
    FROM installations i
    JOIN devices d ON i.device_id = d.id
    WHERE i.installed_at > NOW() - INTERVAL '7 days'
    ${tenant_id ? 'AND d.tenant_id = $1' : ''}
  `, params);
  
  // Health score
  const healthScore = await query(`
    SELECT AVG(connectivity_score) as avg_health
    FROM device_health dh
    JOIN devices d ON dh.device_id = d.id
    ${whereClause}
  `, params);
  
  res.json({
    success: true,
    data: {
      devices: {
        total: parseInt(deviceStats.rows[0].total_devices),
        active: parseInt(deviceStats.rows[0].active_devices),
        online: parseInt(deviceStats.rows[0].online_devices),
        offline: parseInt(deviceStats.rows[0].offline_devices),
        degraded: parseInt(deviceStats.rows[0].degraded_devices)
      },
      alerts: {
        open: parseInt(alertStats.rows[0].open_alerts),
        critical: parseInt(alertStats.rows[0].critical_alerts),
        last_24h: parseInt(alertStats.rows[0].alerts_24h)
      },
      installations: {
        last_7_days: parseInt(recentInstallations.rows[0].count)
      },
      health_score: parseFloat(healthScore.rows[0].avg_health) || 0
    }
  });
}));

// Device uptime report
router.get('/device-uptime', asyncHandler(async (req, res) => {
  const { tenant_id, period = '7d' } = req.query;
  
  const whereClause = tenant_id ? 'WHERE d.tenant_id = $1' : '';
  const params = tenant_id ? [tenant_id] : [];
  
  const result = await query(`
    SELECT 
      d.device_id,
      d.name,
      dh.uptime_24h_percent,
      dh.uptime_7d_percent,
      dh.connectivity_score,
      dh.message_count_24h,
      dh.message_count_7d,
      dh.last_seen_at
    FROM devices d
    JOIN device_health dh ON d.id = dh.device_id
    ${whereClause}
    ORDER BY dh.uptime_7d_percent DESC
  `, params);
  
  res.json({ success: true, data: result.rows });
}));

// Alert trends
router.get('/alert-trends', asyncHandler(async (req, res) => {
  const { tenant_id, period = '30d' } = req.query;
  
  // Determine interval in days
  const intervalDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  
  let paramCount = 1;
  const params = [];
  
  if (tenant_id) {
    params.push(tenant_id);
    paramCount++;
  }
  
  const byDay = await query(`
    SELECT 
      DATE_TRUNC('day', triggered_at) as day,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE priority = 'critical') as critical_count
    FROM alerts
    ${tenant_id ? 'WHERE tenant_id = $1 AND' : 'WHERE'} triggered_at > NOW() - INTERVAL '${intervalDays} days'
    GROUP BY DATE_TRUNC('day', triggered_at)
    ORDER BY day DESC
  `, params);
  
  const byPriority = await query(`
    SELECT priority, COUNT(*) as count
    FROM alerts
    ${tenant_id ? 'WHERE tenant_id = $1 AND' : 'WHERE'} triggered_at > NOW() - INTERVAL '${intervalDays} days'
    GROUP BY priority
  `, params);
  
  const byDevice = await query(`
    SELECT 
      d.device_id,
      d.name,
      COUNT(a.*) as alert_count
    FROM alerts a
    JOIN devices d ON a.device_id = d.id
    ${tenant_id ? 'WHERE d.tenant_id = $1 AND' : 'WHERE'} a.triggered_at > NOW() - INTERVAL '${intervalDays} days'
    GROUP BY d.device_id, d.name
    ORDER BY alert_count DESC
    LIMIT 10
  `, params);
  
  res.json({
    success: true,
    data: {
      by_day: byDay.rows,
      by_priority: byPriority.rows,
      by_device: byDevice.rows
    }
  });
}));

// Installation metrics
router.get('/installation-metrics', asyncHandler(async (req, res) => {
  const { tenant_id, start_date, end_date } = req.query;
  
  let whereClause = '1=1';
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    whereClause += ` AND d.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (start_date) {
    whereClause += ` AND i.installed_at >= $${paramCount++}`;
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ` AND i.installed_at <= $${paramCount++}`;
    params.push(end_date);
  }
  
  const byDay = await query(`
    SELECT 
      DATE_TRUNC('day', i.installed_at) as day,
      COUNT(*) as count
    FROM installations i
    JOIN devices d ON i.device_id = d.id
    WHERE ${whereClause}
    GROUP BY DATE_TRUNC('day', i.installed_at)
    ORDER BY day DESC
  `, params);
  
  const byUser = await query(`
    SELECT 
      u.full_name,
      COUNT(i.*) as installation_count
    FROM installations i
    JOIN devices d ON i.device_id = d.id
    LEFT JOIN users u ON i.installed_by_user_id = u.id
    WHERE ${whereClause}
    GROUP BY u.id, u.full_name
    ORDER BY installation_count DESC
  `, params);
  
  res.json({
    success: true,
    data: {
      by_day: byDay.rows,
      by_user: byUser.rows
    }
  });
}));

// Telemetry summary
router.get('/telemetry-summary', asyncHandler(async (req, res) => {
  const { device_id, period = '24h', interval = '1h' } = req.query;
  
  if (!device_id) {
    return res.status(400).json({ success: false, error: 'device_id is required' });
  }
  
  const intervalMap = {
    '1h': '1 hour',
    '6h': '6 hours',
    '1d': '1 day'
  };
  
  const periodMap = {
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days'
  };
  
  const result = await query(`
    SELECT 
      DATE_TRUNC('hour', timestamp) as period,
      COUNT(*) as data_points,
      data
    FROM device_data
    WHERE device_id = $1
      AND timestamp > NOW() - INTERVAL '${periodMap[period] || '24 hours'}'
    GROUP BY DATE_TRUNC('hour', timestamp), data
    ORDER BY period DESC
  `, [device_id]);
  
  res.json({ success: true, data: result.rows });
}));

export default router;
