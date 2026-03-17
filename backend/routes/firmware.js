import { Router } from 'express';
import { query, getClient } from '../db.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// Firmware Versions
// ============================================

router.get('/versions', asyncHandler(async (req, res) => {
  const { device_type, is_recommended } = req.query;
  
  let sql = `
    SELECT 
      fv.*,
      COUNT(d.id) as installed_device_count
    FROM firmware_versions fv
    LEFT JOIN devices d ON d.firmware_current_version = fv.version
      AND d.device_type = fv.device_type
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (device_type) {
    sql += ` AND fv.device_type = $${paramCount++}`;
    params.push(device_type);
  }
  if (is_recommended !== undefined) {
    sql += ` AND fv.is_recommended = $${paramCount++}`;
    params.push(is_recommended === 'true');
  }
  
  sql += ` GROUP BY fv.id ORDER BY fv.created_at DESC`;
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

router.get('/versions/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const version = await query('SELECT * FROM firmware_versions WHERE id = $1', [id]);
  if (version.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Firmware version not found' });
  }
  
  const deviceCount = await query(`
    SELECT COUNT(*) as count
    FROM devices
    WHERE firmware_current_version = $1
      AND device_type = $2
  `, [version.rows[0].version, version.rows[0].device_type]);
  
  res.json({
    success: true,
    data: {
      ...version.rows[0],
      installed_device_count: parseInt(deviceCount.rows[0].count)
    }
  });
}));

router.post('/versions', asyncHandler(async (req, res) => {
  const {
    device_type,
    name,
    version,
    file_path,
    checksum,
    file_size_bytes,
    release_notes,
    min_hw_version,
    is_recommended,
    is_mandatory
  } = req.body;
  
  const result = await query(`
    INSERT INTO firmware_versions (
      device_type, name, version, file_path, checksum,
      file_size_bytes, release_notes, min_hw_version,
      is_recommended, is_mandatory
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    device_type, name, version, file_path, checksum,
    file_size_bytes, release_notes, min_hw_version,
    is_recommended, is_mandatory
  ]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// ============================================
// FOTA Jobs
// ============================================

router.get('/jobs', asyncHandler(async (req, res) => {
  const { tenant_id, status } = req.query;
  
  let sql = `
    SELECT 
      fj.*,
      fv.version as firmware_version,
      fv.name as firmware_name,
      u.full_name as created_by_name,
      COUNT(fjd.id) as total_devices,
      COUNT(*) FILTER (WHERE fjd.status = 'success') as completed_devices,
      COUNT(*) FILTER (WHERE fjd.status = 'failed') as failed_devices,
      COUNT(*) FILTER (WHERE fjd.status IN ('pending', 'downloading', 'installing')) as in_progress_devices
    FROM fota_jobs fj
    JOIN firmware_versions fv ON fj.firmware_version_id = fv.id
    LEFT JOIN users u ON fj.created_by_user_id = u.id
    LEFT JOIN fota_job_devices fjd ON fj.id = fjd.job_id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;
  
  if (tenant_id) {
    sql += ` AND fj.tenant_id = $${paramCount++}`;
    params.push(tenant_id);
  }
  if (status) {
    sql += ` AND fj.status = $${paramCount++}`;
    params.push(status);
  }
  
  sql += ` GROUP BY fj.id, fv.version, fv.name, u.full_name ORDER BY fj.created_at DESC`;
  
  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
}));

router.get('/jobs/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const job = await query(`
    SELECT 
      fj.*,
      fv.version as firmware_version,
      fv.name as firmware_name,
      u.full_name as created_by_name
    FROM fota_jobs fj
    JOIN firmware_versions fv ON fj.firmware_version_id = fv.id
    LEFT JOIN users u ON fj.created_by_user_id = u.id
    WHERE fj.id = $1
  `, [id]);
  
  if (job.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'FOTA job not found' });
  }
  
  const devices = await query(`
    SELECT 
      fjd.*,
      d.device_id,
      d.name as device_name
    FROM fota_job_devices fjd
    JOIN devices d ON fjd.device_id = d.id
    WHERE fjd.job_id = $1
  `, [id]);
  
  const stats = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as completed,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status IN ('pending', 'downloading', 'installing')) as in_progress
    FROM fota_job_devices
    WHERE job_id = $1
  `, [id]);
  
  res.json({
    success: true,
    data: {
      ...job.rows[0],
      devices: devices.rows,
      stats: stats.rows[0]
    }
  });
}));

router.post('/jobs', asyncHandler(async (req, res) => {
  const {
    name,
    tenant_id,
    firmware_version_id,
    device_ids,
    created_by_user_id
  } = req.body;
  
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Create job
    const job = await client.query(`
      INSERT INTO fota_jobs (
        name, tenant_id, firmware_version_id,
        status, created_by_user_id
      )
      VALUES ($1, $2, $3, 'pending', $4)
      RETURNING *
    `, [name, tenant_id, firmware_version_id, created_by_user_id]);
    
    // Add devices to job
    if (device_ids && device_ids.length > 0) {
      for (const device_id of device_ids) {
        await client.query(`
          INSERT INTO fota_job_devices (job_id, device_id, status)
          VALUES ($1, $2, 'pending')
        `, [job.rows[0].id, device_id]);
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ success: true, data: job.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

router.post('/jobs/:id/start', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(`
    UPDATE fota_jobs
    SET status = 'in_progress',
        started_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'FOTA job not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

router.patch('/jobs/:job_id/devices/:device_id', asyncHandler(async (req, res) => {
  const { job_id, device_id } = req.params;
  const { status, last_error } = req.body;
  
  const result = await query(`
    UPDATE fota_job_devices
    SET status = COALESCE($1, status),
        last_error = COALESCE($2, last_error),
        last_update_at = NOW()
    WHERE job_id = $3 AND device_id = $4
    RETURNING *
  `, [status, last_error, job_id, device_id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Device not found in job' });
  }
  
  // If device completed, update device firmware version
  if (status === 'success') {
    const jobInfo = await query(`
      SELECT fv.version
      FROM fota_jobs fj
      JOIN firmware_versions fv ON fj.firmware_version_id = fv.id
      WHERE fj.id = $1
    `, [job_id]);
    
    if (jobInfo.rows.length > 0) {
      await query(`
        UPDATE devices
        SET firmware_current_version = $1,
            firmware_last_update_at = NOW()
        WHERE id = $2
      `, [jobInfo.rows[0].version, device_id]);
    }
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

export default router;
