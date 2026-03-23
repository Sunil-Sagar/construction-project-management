const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Daily/Weekly Attendance Report
router.get('/attendance', (req, res) => {
  const { start_date, end_date, site_id } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  let query = `
    SELECT 
      a.date,
      s.name as site_name,
      w.name as worker_name,
      w.role as worker_role,
      a.attendance_value,
      a.ot_hours
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
  
  query += ' ORDER BY a.date DESC, s.name, w.name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Calculate summary statistics
    const uniqueWorkers = new Set();
    const uniqueDates = new Set();
    let totalAttendanceDays = 0;
    let totalOtHours = 0;

    const by_site = {};
    const by_role = {};

    rows.forEach(row => {
      uniqueWorkers.add(row.worker_name);
      uniqueDates.add(row.date);
      totalAttendanceDays += row.attendance_value;
      totalOtHours += row.ot_hours || 0;

      // Group by site
      if (!by_site[row.site_name]) {
        by_site[row.site_name] = { days: 0, ot_hours: 0, workers: new Set() };
      }
      by_site[row.site_name].days += row.attendance_value;
      by_site[row.site_name].ot_hours += row.ot_hours || 0;
      by_site[row.site_name].workers.add(row.worker_name);

      // Group by role
      if (!by_role[row.worker_role]) {
        by_role[row.worker_role] = { days: 0, ot_hours: 0, count: new Set() };
      }
      by_role[row.worker_role].days += row.attendance_value;
      by_role[row.worker_role].ot_hours += row.ot_hours || 0;
      by_role[row.worker_role].count.add(row.worker_name);
    });

    // Convert Sets to counts
    Object.keys(by_site).forEach(site => {
      by_site[site].unique_workers = by_site[site].workers.size;
      delete by_site[site].workers;
    });

    Object.keys(by_role).forEach(role => {
      by_role[role].unique_workers = by_role[role].count.size;
      delete by_role[role].count;
    });

    const numDays = uniqueDates.size || 1;
    const avgAttendancePerDay = (totalAttendanceDays / numDays).toFixed(1);

    const summary = {
      total_attendance: rows.length,
      total_workers: uniqueWorkers.size,
      total_ot_hours: totalOtHours,
      avg_attendance_per_day: parseFloat(avgAttendancePerDay),
      by_site,
      by_role
    };

    res.json({ details: rows, summary });
  });
});

// Labor Cost Analysis Report
router.get('/labor-cost', (req, res) => {
  const { start_date, end_date, site_id, worker_id } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  // First, get attendance data with calculated wages
  let attendanceQuery = `
    SELECT 
      w.id as worker_id,
      w.name as worker_name,
      SUM(a.attendance_value) as days_worked,
      SUM(a.ot_hours) as total_ot_hours,
      w.current_rate,
      w.ot_rate,
      (SUM(a.attendance_value) * w.current_rate + SUM(a.ot_hours) * w.ot_rate) as total_wages
    FROM attendance a
    JOIN workers w ON a.worker_id = w.id
    WHERE a.date BETWEEN ? AND ?
  `;
  
  const params = [start_date, end_date];
  
  if (site_id) {
    attendanceQuery += ' AND a.site_id = ?';
    params.push(site_id);
  }
  
  if (worker_id) {
    attendanceQuery += ' AND a.worker_id = ?';
    params.push(worker_id);
  }
  
  attendanceQuery += ' GROUP BY w.id ORDER BY w.name';
  
  db.all(attendanceQuery, params, (err, attendanceRows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get advances for the same period
    let advancesQuery = `
      SELECT 
        worker_id,
        SUM(amount) as total_advances
      FROM advances
      WHERE date BETWEEN ? AND ?
    `;
    
    const advParams = [start_date, end_date];
    
    if (worker_id) {
      advancesQuery += ' AND worker_id = ?';
      advParams.push(worker_id);
    }
    
    advancesQuery += ' GROUP BY worker_id';
    
    db.all(advancesQuery, advParams, (err, advanceRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Create a map of advances by worker_id
      const advancesMap = {};
      advanceRows.forEach(row => {
        advancesMap[row.worker_id] = row.total_advances || 0;
      });

      // Combine attendance and advances data
      const by_worker = attendanceRows.map(row => {
        const total_advances = advancesMap[row.worker_id] || 0;
        return {
          worker_name: row.worker_name,
          days_worked: row.days_worked,
          total_ot_hours: row.total_ot_hours || 0,
          total_wages: parseFloat(row.total_wages.toFixed(2)),
          total_advances: parseFloat(total_advances.toFixed(2)),
          net_amount: parseFloat((row.total_wages - total_advances).toFixed(2))
        };
      });

      // Calculate summary
      const summary = {
        total_wages: by_worker.reduce((sum, row) => sum + row.total_wages, 0),
        total_advances: by_worker.reduce((sum, row) => sum + row.total_advances, 0),
        net_payout: by_worker.reduce((sum, row) => sum + row.net_amount, 0)
      };

      summary.total_wages = parseFloat(summary.total_wages.toFixed(2));
      summary.total_advances = parseFloat(summary.total_advances.toFixed(2));
      summary.net_payout = parseFloat(summary.net_payout.toFixed(2));

      res.json({ by_worker, summary });
    });
  });
});

// Financial Outflow Report (Cash vs UPI)
router.get('/financial-outflow', (req, res) => {
  const { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  // Get labor payouts
  const payoutsQuery = `
    SELECT 
      'Labor Payment' as category,
      payment_mode,
      payment_date,
      SUM(amount_paid) as total_amount
    FROM payouts
    WHERE payment_date BETWEEN ? AND ? AND status = 'paid'
    GROUP BY payment_mode
  `;

  // Get advances
  const advancesQuery = `
    SELECT 
      'Advance' as category,
      payment_mode,
      date as payment_date,
      SUM(amount) as total_amount
    FROM advances
    WHERE date BETWEEN ? AND ?
    GROUP BY payment_mode
  `;

  // Get material payments
  const materialsQuery = `
    SELECT 
      'Material' as category,
      payment_mode,
      payment_date,
      SUM(total_amount) as total_amount
    FROM material_entries
    WHERE payment_date BETWEEN ? AND ? AND payment_status = 'paid'
    GROUP BY payment_mode
  `;

  // Get pending amounts
  const pendingMaterialsQuery = `
    SELECT 
      'Material' as category,
      SUM(total_amount) as total_amount
    FROM material_entries
    WHERE date BETWEEN ? AND ? AND payment_status = 'pending'
  `;

  const pendingPayoutsQuery = `
    SELECT 
      'Labor' as category,
      SUM(net_payable) as total_amount
    FROM payouts
    WHERE week_end_date BETWEEN ? AND ? AND status IN ('pending', 'carryover')
  `;

  const results = {
    labor_payouts: [],
    advances: [],
    materials: [],
    pending: { materials: 0, labor: 0, total: 0 },
    summary: { cash: 0, upi: 0, total: 0 }
  };

  db.all(payoutsQuery, [start_date, end_date], (err, payouts) => {
    if (err) return res.status(500).json({ error: err.message });
    results.labor_payouts = payouts;

    db.all(advancesQuery, [start_date, end_date], (err, advances) => {
      if (err) return res.status(500).json({ error: err.message });
      results.advances = advances;

      db.all(materialsQuery, [start_date, end_date], (err, materials) => {
        if (err) return res.status(500).json({ error: err.message });
        results.materials = materials;

        // Get pending amounts
        db.get(pendingMaterialsQuery, [start_date, end_date], (err, pendingMat) => {
          if (err) return res.status(500).json({ error: err.message });
          results.pending.materials = pendingMat?.total_amount || 0;

          db.get(pendingPayoutsQuery, [start_date, end_date], (err, pendingPay) => {
            if (err) return res.status(500).json({ error: err.message });
            results.pending.labor = pendingPay?.total_amount || 0;
            results.pending.total = results.pending.materials + results.pending.labor;

            // Calculate totals
            [...payouts, ...advances, ...materials].forEach(item => {
              if (item.payment_mode === 'Cash') {
                results.summary.cash += item.total_amount;
              } else if (item.payment_mode === 'UPI') {
                results.summary.upi += item.total_amount;
              }
              results.summary.total += item.total_amount;
            });

            results.summary.cash = parseFloat(results.summary.cash.toFixed(2));
            results.summary.upi = parseFloat(results.summary.upi.toFixed(2));
            results.summary.total = parseFloat(results.summary.total.toFixed(2));
            results.pending.materials = parseFloat(results.pending.materials.toFixed(2));
            results.pending.labor = parseFloat(results.pending.labor.toFixed(2));
            results.pending.total = parseFloat(results.pending.total.toFixed(2));

            res.json(results);
          });
        });
      });
    });
  });
});

// Material Payment Report (formerly Material Consumption Report)
router.get('/material-consumption', (req, res) => {
  const { start_date, end_date, site_id } = req.query;
  
  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  let query = `
    SELECT 
      m.name as material_name,
      m.unit,
      s.name as site_name,
      SUM(me.quantity) as total_quantity,
      AVG(me.rate) as avg_rate,
      SUM(me.total_amount) as total_cost,
      COUNT(*) as delivery_count
    FROM material_entries me
    JOIN materials m ON me.material_id = m.id
    JOIN sites s ON me.site_id = s.id
    WHERE me.date BETWEEN ? AND ?
  `;
  
  const params = [start_date, end_date];
  
  if (site_id) {
    query += ' AND me.site_id = ?';
    params.push(site_id);
  }
  
  query += ' GROUP BY m.id, s.id ORDER BY s.name, m.name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const totalCost = rows.reduce((sum, row) => sum + row.total_cost, 0);
    const totalEntries = rows.reduce((sum, row) => sum + row.delivery_count, 0);

    // Get pending payment amount
    let pendingQuery = `
      SELECT COALESCE(SUM(me.total_amount), 0) as pending_amount
      FROM material_entries me
      WHERE me.date BETWEEN ? AND ?
      AND me.payment_status = 'pending'
    `;
    
    const pendingParams = [start_date, end_date];
    if (site_id) {
      pendingQuery += ' AND me.site_id = ?';
      pendingParams.push(site_id);
    }

    db.get(pendingQuery, pendingParams, (err, pendingRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        by_material: rows,
        summary: {
          total_entries: totalEntries,
          total_cost: parseFloat(totalCost.toFixed(2)),
          pending_payment: parseFloat((pendingRow?.pending_amount || 0).toFixed(2))
        }
      });
    });
  });
});

// Milestone Progress Report
router.get('/milestone-progress', (req, res) => {
  const { site_id } = req.query;
  
  let query = `
    SELECT 
      m.*,
      s.name as site_name,
      s.location,
      s.client_name
    FROM milestones m
    JOIN sites s ON m.site_id = s.id
  `;
  
  const params = [];
  
  if (site_id) {
    query += ' WHERE m.site_id = ?';
    params.push(site_id);
  }
  
  query += ` ORDER BY s.name, CASE m.phase 
    WHEN 'Excavation' THEN 1 
    WHEN 'Footing' THEN 2 
    WHEN 'Plinth' THEN 3 
    WHEN 'Slab' THEN 4 
  END`;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Group by site
    const bySite = {};
    rows.forEach(row => {
      if (!bySite[row.site_name]) {
        bySite[row.site_name] = {
          site_name: row.site_name,
          location: row.location,
          client_name: row.client_name,
          milestones: [],
          completed_count: 0,
          in_progress_count: 0,
          not_started_count: 0
        };
      }
      
      bySite[row.site_name].milestones.push({
        phase: row.phase,
        status: row.status,
        start_date: row.start_date,
        completion_date: row.completion_date,
        notes: row.notes
      });

      if (row.status === 'completed') bySite[row.site_name].completed_count++;
      else if (row.status === 'in-progress') bySite[row.site_name].in_progress_count++;
      else bySite[row.site_name].not_started_count++;
    });

    res.json({
      data: rows,
      by_site: Object.values(bySite)
    });
  });
});

// Dashboard Summary
router.get('/dashboard-summary', (req, res) => {
  const queries = {
    activeSites: 'SELECT COUNT(*) as count FROM sites WHERE status = "active"',
    activeWorkers: 'SELECT COUNT(*) as count FROM workers WHERE status = "active"',
    pendingPayouts: 'SELECT COUNT(*) as count, COALESCE(SUM(net_payable), 0) as total FROM payouts WHERE status IN ("pending", "carryover")',
    pendingMaterials: 'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM material_entries WHERE payment_status = "pending"'
  };

  const results = {};

  db.get(queries.activeSites, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    results.active_sites = row.count;

    db.get(queries.activeWorkers, (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      results.active_workers = row.count;

      db.get(queries.pendingPayouts, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        results.pending_payouts = { count: row.count, total: parseFloat(row.total.toFixed(2)) };

        db.get(queries.pendingMaterials, (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          results.pending_materials = { count: row.count, total: parseFloat(row.total.toFixed(2)) };

          res.json(results);
        });
      });
    });
  });
});

module.exports = router;
