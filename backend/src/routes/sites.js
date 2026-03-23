const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all sites
router.get('/', (req, res) => {
  db.all('SELECT * FROM sites ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get active sites
router.get('/active', (req, res) => {
  db.all('SELECT * FROM sites WHERE status = ? ORDER BY name', ['active'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single site
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM sites WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json(row);
  });
});

// Create site
router.post('/', (req, res) => {
  const { name, location, client_name, start_date } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Site name is required' });
  }

  db.run(
    'INSERT INTO sites (name, location, client_name, start_date) VALUES (?, ?, ?, ?)',
    [name, location, client_name, start_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Site created successfully' });
    }
  );
});

// Update site
router.put('/:id', (req, res) => {
  const { name, location, client_name, start_date, status } = req.body;
  
  db.run(
    'UPDATE sites SET name = ?, location = ?, client_name = ?, start_date = ?, status = ? WHERE id = ?',
    [name, location, client_name, start_date, status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Site not found' });
      }
      res.json({ message: 'Site updated successfully' });
    }
  );
});

// Delete site
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM sites WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ message: 'Site deleted successfully' });
  });
});

module.exports = router;
