const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { calculateWeeklyWage, getWeekBoundaries, calculateWeeklyWagesForAllWorkers } = require('../services/wageService');

// Get all payouts
router.get('/', (req, res) => {
  const query = `
    SELECT 
      p.*,
      w.name as worker_name,
      w.role as worker_role
    FROM payouts p
    JOIN workers w ON p.worker_id = w.id
    ORDER BY p.week_end_date DESC, w.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get payouts for a specific week
router.get('/week/:date', (req, res) => {
  const { startDate, endDate } = getWeekBoundaries(req.params.date);
  
  const query = `
    SELECT 
      p.*,
      w.name as worker_name,
      w.role as worker_role
    FROM payouts p
    JOIN workers w ON p.worker_id = w.id
    WHERE p.week_start_date = ? AND p.week_end_date = ?
    ORDER BY w.name
  `;
  
  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get pending payouts (carryover amounts)
router.get('/pending', (req, res) => {
  const query = `
    SELECT 
      p.*,
      w.name as worker_name,
      w.role as worker_role
    FROM payouts p
    JOIN workers w ON p.worker_id = w.id
    WHERE p.status IN ('pending', 'carryover') AND p.net_payable > 0
    ORDER BY p.week_end_date DESC, w.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Calculate wages for a specific week (preview before saving)
router.post('/calculate', (req, res) => {
  const { date } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const { startDate, endDate } = getWeekBoundaries(date);
  
  calculateWeeklyWagesForAllWorkers(startDate, endDate, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      week_start_date: startDate,
      week_end_date: endDate,
      workers: results
    });
  });
});

// Process weekly payout (Saturday settlement)
router.post('/process', (req, res) => {
  const { date } = req.body;
  
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const { startDate, endDate } = getWeekBoundaries(date);
  
  // First check if payouts already exist for this week
  db.get(
    'SELECT COUNT(*) as count FROM payouts WHERE week_start_date = ? AND week_end_date = ?',
    [startDate, endDate],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row.count > 0) {
        return res.status(409).json({ 
          error: 'Payouts already exist for this week',
          message: 'This week has already been processed. Use "Delete This Week" first if you want to recalculate.'
        });
      }

      // Proceed with calculation and insertion
      calculateWeeklyWagesForAllWorkers(startDate, endDate, (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
          return res.json({ message: 'No attendance records found for this week' });
        }

        // Insert payout records
        const stmt = db.prepare(`
          INSERT INTO payouts (
            worker_id, week_start_date, week_end_date, days_worked, daily_rate,
            ot_hours, ot_rate, gross_wage, advances, net_payable, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `);

        let inserted = 0;
        results.forEach(result => {
          stmt.run(
            [
              result.worker_id, startDate, endDate, result.days_worked, result.daily_rate,
              result.ot_hours, result.ot_rate, result.gross_wage, result.advances, result.net_payable
            ],
            (err) => {
              if (err) {
                console.error('Error inserting payout:', err);
              } else {
                inserted++;
              }
            }
          );
        });

        stmt.finalize((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({
            message: 'Weekly payouts processed successfully',
            week_start_date: startDate,
            week_end_date: endDate,
            records_created: inserted
          });
        });
      });
    }
  );
});

// Mark payout as paid
router.post('/:id/pay', (req, res) => {
  const { amount_paid, payment_mode, payment_date, notes } = req.body;
  
  if (!amount_paid || !payment_mode || !payment_date) {
    return res.status(400).json({ error: 'Amount, payment mode and date are required' });
  }

  db.run(
    `UPDATE payouts 
     SET amount_paid = ?, payment_mode = ?, payment_date = ?, status = 'paid', notes = ?
     WHERE id = ?`,
    [amount_paid, payment_mode, payment_date, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Payout not found' });
      }
      res.json({ message: 'Payout marked as paid successfully' });
    }
  );
});

// Mark payout as carryover
router.post('/:id/carryover', (req, res) => {
  const { notes } = req.body;
  
  db.run(
    `UPDATE payouts SET status = 'carryover', notes = ? WHERE id = ?`,
    [notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Payout not found' });
      }
      res.json({ message: 'Payout marked as carryover successfully' });
    }
  );
});

// Get payout details by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT 
      p.*,
      w.name as worker_name,
      w.role as worker_role,
      w.phone as worker_phone
    FROM payouts p
    JOIN workers w ON p.worker_id = w.id
    WHERE p.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    res.json(row);
  });
});

// Delete payout
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM payouts WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    res.json({ message: 'Payout deleted successfully' });
  });
});

// Delete all payouts for a specific week (for testing purposes)
router.delete('/week/:date', (req, res) => {
  const { startDate, endDate } = getWeekBoundaries(req.params.date);
  
  db.run(
    'DELETE FROM payouts WHERE week_start_date = ? AND week_end_date = ?',
    [startDate, endDate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        message: `Deleted ${this.changes} payout(s) for week ${startDate} to ${endDate}`,
        deletedCount: this.changes
      });
    }
  );
});

module.exports = router;
