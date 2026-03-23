const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all workers
router.get('/', (req, res) => {
  const query = `
    SELECT 
      w.*,
      COALESCE(SUM(CASE WHEN p.status IN ('pending', 'carryover') THEN p.net_payable ELSE 0 END), 0) as current_balance
    FROM workers w
    LEFT JOIN payouts p ON w.id = p.worker_id AND p.status IN ('pending', 'carryover')
    GROUP BY w.id
    ORDER BY w.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get active workers
router.get('/active', (req, res) => {
  const query = `
    SELECT 
      w.*,
      COALESCE(SUM(CASE WHEN p.status IN ('pending', 'carryover') THEN p.net_payable ELSE 0 END), 0) as current_balance
    FROM workers w
    LEFT JOIN payouts p ON w.id = p.worker_id AND p.status IN ('pending', 'carryover')
    WHERE w.status = 'active'
    GROUP BY w.id
    ORDER BY w.name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get workers by role
router.get('/role/:role', (req, res) => {
  db.all(
    'SELECT * FROM workers WHERE role = ? AND status = ? ORDER BY name',
    [req.params.role, 'active'],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get single worker with rate history
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM workers WHERE id = ?', [req.params.id], (err, worker) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Get rate history
    db.all(
      'SELECT * FROM worker_rate_history WHERE worker_id = ? ORDER BY effective_date DESC',
      [req.params.id],
      (err, history) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ ...worker, rate_history: history });
      }
    );
  });
});

// Create worker
router.post('/', (req, res) => {
  const { name, phone, role, current_rate, ot_rate } = req.body;
  
  if (!name || !role || !current_rate) {
    return res.status(400).json({ error: 'Name, role and current rate are required' });
  }

  db.serialize(() => {
    db.run(
      'INSERT INTO workers (name, phone, role, current_rate, ot_rate) VALUES (?, ?, ?, ?, ?)',
      [name, phone, role, current_rate, ot_rate || 100],
      function(err) {
        if (err) {
          console.error('Error creating worker:', err.message);
          return res.status(500).json({ error: err.message });
        }

        const workerId = this.lastID;
        const today = new Date().toISOString().split('T')[0];

        // Add initial rate to history
        db.run(
          'INSERT INTO worker_rate_history (worker_id, daily_rate, ot_rate, effective_date) VALUES (?, ?, ?, ?)',
          [workerId, current_rate, ot_rate || 100, today],
          (err) => {
            if (err) {
              console.error('Error adding rate history:', err.message);
              return res.status(500).json({ error: 'Worker created but failed to add rate history: ' + err.message });
            }
            res.status(201).json({ id: workerId, message: 'Worker created successfully' });
          }
        );
      }
    );
  });
});

// Update worker (including rate change)
router.put('/:id', (req, res) => {
  const { name, phone, role, current_rate, ot_rate, status } = req.body;
  
  // First get current rate to check if it changed
  db.get('SELECT current_rate, ot_rate FROM workers WHERE id = ?', [req.params.id], (err, worker) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Update worker
    db.run(
      'UPDATE workers SET name = ?, phone = ?, role = ?, current_rate = ?, ot_rate = ?, status = ? WHERE id = ?',
      [name, phone, role, current_rate, ot_rate, status, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // If rate changed, add to history
        if (current_rate !== worker.current_rate || ot_rate !== worker.ot_rate) {
          const today = new Date().toISOString().split('T')[0];
          db.run(
            'INSERT INTO worker_rate_history (worker_id, daily_rate, ot_rate, effective_date) VALUES (?, ?, ?, ?)',
            [req.params.id, current_rate, ot_rate, today],
            (err) => {
              if (err) {
                console.error('Error adding rate history:', err.message);
              }
            }
          );
        }

        res.json({ message: 'Worker updated successfully' });
      }
    );
  });
});

// Delete worker
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM workers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json({ message: 'Worker deleted successfully' });
  });
});

module.exports = router;
