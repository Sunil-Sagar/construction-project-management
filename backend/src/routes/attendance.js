const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get attendance for a specific date
router.get('/date/:date', (req, res) => {
  const query = `
    SELECT 
      a.*,
      w.name as worker_name,
      w.role as worker_role,
      s.name as site_name
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    JOIN sites s ON a.site_id = s.id
    WHERE a.date = ?
    ORDER BY s.name, w.name
  `;
  
  db.all(query, [req.params.date], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get attendance for a date range
router.get('/range', (req, res) => {
  const { start_date, end_date, site_id, worker_id } = req.query;
  
  let query = `
    SELECT 
      a.*,
      w.name as worker_name,
      w.role as worker_role,
      s.name as site_name
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    JOIN sites s ON a.site_id = s.id
    WHERE a.date BETWEEN ? AND ?
  `;
  
  const params = [start_date, end_date];
  
  if (site_id) {
    query += ' AND a.site_id = ?';
    params.push(site_id);
  }
  
  if (worker_id) {
    query += ' AND a.worker_id = ?';
    params.push(worker_id);
  }
  
  query += ' ORDER BY a.date DESC, s.name, w.name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get attendance for a specific worker
router.get('/worker/:worker_id', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      a.*,
      s.name as site_name
    FROM attendance a
    JOIN sites s ON a.site_id = s.id
    WHERE a.worker_id = ?
  `;
  
  const params = [req.params.worker_id];
  
  if (start_date && end_date) {
    query += ' AND a.date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  query += ' ORDER BY a.date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Mark attendance (single entry)
router.post('/', (req, res) => {
  const { worker_id, site_id, date, attendance_value, ot_hours, notes } = req.body;
  
  if (!worker_id || !site_id || !date || attendance_value === undefined) {
    return res.status(400).json({ error: 'Worker, site, date and attendance value are required' });
  }

  db.run(
    `INSERT INTO attendance (worker_id, site_id, date, attendance_value, ot_hours, notes) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(worker_id, site_id, date) 
     DO UPDATE SET attendance_value = ?, ot_hours = ?, notes = ?`,
    [worker_id, site_id, date, attendance_value, ot_hours || 0, notes,
     attendance_value, ot_hours || 0, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Attendance marked successfully' });
    }
  );
});

// Bulk attendance entry
router.post('/bulk', (req, res) => {
  const { records } = req.body;
  
  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Invalid bulk attendance data. Records array is required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO attendance (worker_id, site_id, date, attendance_value, ot_hours, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(worker_id, site_id, date)
    DO UPDATE SET attendance_value = ?, ot_hours = ?, notes = ?
  `);

  let errors = [];
  let successCount = 0;
  let processed = 0;

  records.forEach((record, index) => {
    const { worker_id, site_id, date, attendance_value, ot_hours, notes } = record;

    if (!worker_id || !site_id || !date || attendance_value === undefined) {
      errors.push({ index, error: 'Missing required fields: worker_id, site_id, date, attendance_value' });
      processed++;
      return;
    }

    stmt.run(
      [worker_id, site_id, date, attendance_value, ot_hours || 0, notes || null,
       attendance_value, ot_hours || 0, notes || null],
      (err) => {
        if (err) {
          errors.push({ index, error: err.message });
        } else {
          successCount++;
        }
        processed++;

        // Send response after all records are processed
        if (processed === records.length) {
          stmt.finalize((finalizeErr) => {
            if (finalizeErr) {
              return res.status(500).json({ error: finalizeErr.message });
            }
            res.status(201).json({
              message: 'Bulk attendance processed',
              successCount,
              totalRecords: records.length,
              errors: errors.length > 0 ? errors : null
            });
          });
        }
      }
    );
  });
});

// Update attendance
router.put('/:id', (req, res) => {
  const { site_id, attendance_value, ot_hours, notes } = req.body;
  
  db.run(
    'UPDATE attendance SET site_id = ?, attendance_value = ?, ot_hours = ?, notes = ? WHERE id = ?',
    [site_id, attendance_value, ot_hours, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }
      res.json({ message: 'Attendance updated successfully' });
    }
  );
});

// Delete attendance
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM attendance WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance deleted successfully' });
  });
});

module.exports = router;
