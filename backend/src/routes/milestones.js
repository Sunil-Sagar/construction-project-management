const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get milestones for a specific site
router.get('/site/:site_id', (req, res) => {
  db.all(
    'SELECT * FROM milestones WHERE site_id = ? ORDER BY created_at',
    [req.params.site_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get all milestones
router.get('/', (req, res) => {
  const query = `
    SELECT 
      m.*,
      s.name as site_name
    FROM milestones m
    JOIN sites s ON m.site_id = s.id
    ORDER BY s.name, m.created_at
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create or update milestone
router.post('/', (req, res) => {
  const { site_id, phase, status, start_date, completion_date, notes } = req.body;
  
  if (!site_id || !phase) {
    return res.status(400).json({ error: 'Site and phase are required' });
  }

  db.run(
    `INSERT INTO milestones (site_id, phase, status, start_date, completion_date, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(site_id, phase)
     DO UPDATE SET status = ?, start_date = ?, completion_date = ?, notes = ?`,
    [site_id, phase, status || 'not-started', start_date, completion_date, notes,
     status || 'not-started', start_date, completion_date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Milestone saved successfully' });
    }
  );
});

// Update milestone
router.put('/:id', (req, res) => {
  const { status, start_date, completion_date, notes } = req.body;
  
  // If status is not "completed", clear the actual_completion_date
  // This handles manual status changes (e.g., reverting from completed back to in-progress)
  // Also clear original_status when manually changing status (resets tracking for next WIP)
  const actualCompletionDate = status === 'completed' ? undefined : null;
  
  const query = actualCompletionDate === null
    ? 'UPDATE milestones SET status = ?, start_date = ?, completion_date = ?, notes = ?, actual_completion_date = NULL, original_status = NULL WHERE id = ?'
    : 'UPDATE milestones SET status = ?, start_date = ?, completion_date = ?, notes = ?, original_status = NULL WHERE id = ?';
  
  const params = [status, start_date, completion_date, notes, req.params.id];
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json({ message: 'Milestone updated successfully' });
  });
});

// Initialize milestones for a site (create all 4 phases)
router.post('/initialize/:site_id', (req, res) => {
  const phases = ['Excavation', 'Footing', 'Plinth', 'Slab'];
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO milestones (site_id, phase, status)
    VALUES (?, ?, 'not-started')phases based on provided list)
router.post('/initialize/:site_id', (req, res) => {
  const { phases } = req.body;
  
  if (!phases || !Array.isArray(phases) || phases.length === 0) {
    return res.status(400).json({ error: 'Phases array is required' });
  }

  const stmt = db.prepare(`
    INSERT INTO milestones (site_id, phase, status)
    VALUES (?, ?, 'not-started')
    ON CONFLICT(site_id, phase) DO NOTHING

  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Milestones initialized for site' });
  });
});

// Delete milestone
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM milestones WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }
    res.json({ message: 'Milestone deleted successfully' });
  });
});

module.exports = router;
