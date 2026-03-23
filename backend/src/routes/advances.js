const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all advances
router.get('/', (req, res) => {
  const query = `
    SELECT 
      a.*,
      w.name as worker_name,
      w.role as worker_role
    FROM advances a
    JOIN workers w ON a.worker_id = w.id
    ORDER BY a.date DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get advances for a specific worker
router.get('/worker/:worker_id', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = 'SELECT * FROM advances WHERE worker_id = ?';
  const params = [req.params.worker_id];
  
  if (start_date && end_date) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  query += ' ORDER BY date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get advances for date range
router.get('/range', (req, res) => {
  const { start_date, end_date } = req.query;
  
  const query = `
    SELECT 
      a.*,
      w.name as worker_name,
      w.role as worker_role
    FROM advances a
    JOIN workers w ON a.worker_id = w.id
    WHERE a.date BETWEEN ? AND ?
    ORDER BY a.date DESC
  `;
  
  db.all(query, [start_date, end_date], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create advance
router.post('/', (req, res) => {
  const { worker_id, amount, date, payment_mode, notes } = req.body;
  
  if (!worker_id || !amount || !date || !payment_mode) {
    return res.status(400).json({ error: 'Worker, amount, date and payment mode are required' });
  }

  db.run(
    'INSERT INTO advances (worker_id, amount, date, payment_mode, notes) VALUES (?, ?, ?, ?, ?)',
    [worker_id, amount, date, payment_mode, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Advance recorded successfully' });
    }
  );
});

// Update advance
router.put('/:id', (req, res) => {
  const { amount, date, payment_mode, notes } = req.body;
  
  db.run(
    'UPDATE advances SET amount = ?, date = ?, payment_mode = ?, notes = ? WHERE id = ?',
    [amount, date, payment_mode, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Advance not found' });
      }
      res.json({ message: 'Advance updated successfully' });
    }
  );
});

// Delete advance
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM advances WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Advance not found' });
    }
    res.json({ message: 'Advance deleted successfully' });
  });
});

module.exports = router;
