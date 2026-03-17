import { Router } from 'express';
import { query, getClient } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// Alerts
// ============================================

// Get all alerts
router.get('/', asyncHandler(async (req, res) => {
  const { tenant_id, device_id, status, priority, start_date, end_date, limit = 50, offset = 0 } = req.query;
  
  let sql = `
    SELECT 
      a.*,
      d.device_id as device_device_id,
      d.name as device_name,
      ar.name as rule_name,
      u_ack.full_name as acknowledged_by_name,
      u_res.full_name as resolved_by_name
    FROM alerts a
    JOIN devices d ON a.device_id = d.id
    LEFT JOIN alert_rules ar ON a.rule_id = ar.id
    LEFT JOIN users u_ack ON a.acknowledged_by = u_ack.id
    LEFT JOIN users u_res ON a.resolved_by = u_res.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND a.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (device_id) {
    sql += ` AND a.device_id = $${paramCount++}`;
    params.push(device_id);
  }
  if (status) {
    sql += ` AND a.status = $${paramCount++}`;
    params.push(status);
  }
  if (priority) {
    sql += ` AND a.priority = $${paramCount++}`;
    params.push(priority);
  }
  if (start_date) {
    sql += ` AND a.triggered_at >= $${paramCount++}`;
    params.push(start_date);
  }
  if (end_date) {
    sql += ` AND a.triggered_at <= $${paramCount++}`;
    params.push(end_date);
  }
  
  sql += ` ORDER BY 
    CASE a.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    a.triggered_at DESC
    LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  params.push(parseInt(limit), parseInt(offset));
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows,
    metadata: { returned: result.rows.length }
  });
}));

// Get single alert
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const alert = await query(`
    SELECT 
      a.*,
      d.device_id as device_device_id,
      d.name as device_name,
      ar.name as rule_name,
      u_ack.full_name as acknowledged_by_name,
      u_res.full_name as resolved_by_name
    FROM alerts a
    JOIN devices d ON a.device_id = d.id
    LEFT JOIN alert_rules ar ON a.rule_id = ar.id
    LEFT JOIN users u_ack ON a.acknowledged_by = u_ack.id
    LEFT JOIN users u_res ON a.resolved_by = u_res.id
    WHERE a.id = $1
  `, [id]);
  
  if (alert.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  
  const notifications = await query(`
    SELECT * FROM notifications WHERE alert_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...alert.rows[0],
      notifications: notifications.rows
    }
  });
}));

// Create alert
router.post('/', asyncHandler(async (req, res) => {
  const {
    rule_id,
    device_id,
    tenant_id,
    title,
    message,
    priority,
    trigger_data
  } = req.body;
  
  const result = await query(`
    INSERT INTO alerts (
      rule_id, device_id, tenant_id, title, message,
      priority, status, trigger_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'open', $7)
    RETURNING *
  `, [rule_id, device_id, tenant_id, title, message, priority, trigger_data]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Acknowledge alert
router.patch('/:id/acknowledge', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  const result = await query(`
    UPDATE alerts
    SET status = 'acknowledged',
        acknowledged_at = NOW(),
        acknowledged_by = $1
    WHERE id = $2
    RETURNING *
  `, [user_id, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Resolve alert
router.patch('/:id/resolve', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;
  
  const result = await query(`
    UPDATE alerts
    SET status = 'resolved',
        resolved_at = NOW(),
        resolved_by = $1
    WHERE id = $2
    RETURNING *
  `, [user_id, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Alert statistics
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;
  
  let whereClause = tenant_id ? 'WHERE tenant_id = $1' : '';
  const params = tenant_id ? [tenant_id] : [];
  
  const stats = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'open') as open,
      COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
      COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
      COUNT(*) FILTER (WHERE priority = 'critical') as critical,
      COUNT(*) FILTER (WHERE priority = 'high') as high,
      COUNT(*) FILTER (WHERE priority = 'medium') as medium,
      COUNT(*) FILTER (WHERE priority = 'low') as low,
      AVG(EXTRACT(EPOCH FROM (acknowledged_at - triggered_at))/60) as avg_response_minutes
    FROM alerts
    ${whereClause}
  `, params);
  
  res.json({
    success: true,
    data: {
      ...stats.rows[0],
      by_status: {
        open: parseInt(stats.rows[0].open),
        acknowledged: parseInt(stats.rows[0].acknowledged),
        resolved: parseInt(stats.rows[0].resolved)
      },
      by_priority: {
        critical: parseInt(stats.rows[0].critical),
        high: parseInt(stats.rows[0].high),
        medium: parseInt(stats.rows[0].medium),
        low: parseInt(stats.rows[0].low)
      }
    }
  });
}));

// ============================================
// Alert Rules
// ============================================

router.get('/rules', asyncHandler(async (req, res) => {
  const { tenant_id, is_active } = req.query;
  
  let sql = 'SELECT * FROM alert_rules WHERE 1=1';
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (is_active !== undefined) {
    sql += ` AND is_active = $${paramCount++}`;
    params.push(is_active === 'true');
  }
  
  sql += ` ORDER BY 
    CASE priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    created_at DESC`;
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

router.get('/rules/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const rule = await query('SELECT * FROM alert_rules WHERE id = $1', [id]);
  if (rule.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Alert rule not found' });
  }
  
  const recentAlerts = await query(`
    SELECT * FROM alerts 
    WHERE rule_id = $1 
    ORDER BY triggered_at DESC 
    LIMIT 10
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...rule.rows[0],
      recent_alerts: recentAlerts.rows
    }
  });
}));

router.post('/rules', asyncHandler(async (req, res) => {
  const {
    name,
    description,
    device_id,
    tenant_id,
    condition,
    priority,
    title_template,
    message_template,
    notify_email,
    notify_sms,
    notify_webhook,
    webhook_url
  } = req.body;
  
  const result = await query(`
    INSERT INTO alert_rules (
      name, description, device_id, tenant_id, condition,
      priority, title_template, message_template,
      notify_email, notify_sms, notify_webhook, webhook_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    name, description, device_id, tenant_id, condition,
    priority, title_template, message_template,
    notify_email, notify_sms, notify_webhook, webhook_url
  ]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.patch('/rules/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, condition, is_active, priority } = req.body;
  
  const result = await query(`
    UPDATE alert_rules
    SET name = COALESCE($1, name),
        condition = COALESCE($2, condition),
        is_active = COALESCE($3, is_active),
        priority = COALESCE($4, priority)
    WHERE id = $5
    RETURNING *
  `, [name, condition, is_active, priority, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Alert rule not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

export default router;
