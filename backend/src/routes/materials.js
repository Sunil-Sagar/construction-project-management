const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all materials
router.get('/', (req, res) => {
  db.all('SELECT * FROM materials ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get material entries
router.get('/entries', (req, res) => {
  const { start_date, end_date, site_id, payment_status } = req.query;
  
  let query = `
    SELECT 
      me.*,
      m.name as material_name,
      m.unit as material_unit,
      s.name as site_name
    FROM material_entries me
    JOIN materials m ON me.material_id = m.id
    JOIN sites s ON me.site_id = s.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (start_date && end_date) {
    query += ' AND me.date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  if (site_id) {
    query += ' AND me.site_id = ?';
    params.push(site_id);
  }
  
  if (payment_status) {
    query += ' AND me.payment_status = ?';
    params.push(payment_status);
  }
  
  query += ' ORDER BY me.date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get pending material payments (vendor debt)
router.get('/entries/pending', (req, res) => {
  const query = `
    SELECT 
      me.*,
      m.name as material_name,
      m.unit as material_unit,
      s.name as site_name
    FROM material_entries me
    JOIN materials m ON me.material_id = m.id
    JOIN sites s ON me.site_id = s.id
    WHERE me.payment_status = 'pending'
    ORDER BY me.date DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create material
router.post('/', (req, res) => {
  const { name, unit, reference_rate } = req.body;
  
  if (!name || !unit) {
    return res.status(400).json({ error: 'Material name and unit are required' });
  }

  db.run(
    'INSERT INTO materials (name, unit, reference_rate) VALUES (?, ?, ?)',
    [name, unit, reference_rate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Material created successfully' });
    }
  );
});

// Create material entry
router.post('/entries', (req, res) => {
  const { material_name, unit, site_id, vendor_name, quantity, rate, date, notes } = req.body;
  
  if (!material_name || !unit || !site_id || !vendor_name || !quantity || !rate || !date) {
    return res.status(400).json({ error: 'All material entry fields are required' });
  }

  const total_amount = parseFloat((quantity * rate).toFixed(2));

  // First, check if the material exists, create it if not
  db.get('SELECT id FROM materials WHERE name = ?', [material_name], (err, material) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const insertEntry = (material_id) => {
      db.run(
        `INSERT INTO material_entries 
         (material_id, site_id, vendor_name, quantity, rate, total_amount, date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [material_id, site_id, vendor_name, quantity, rate, total_amount, date, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ id: this.lastID, message: 'Material entry created successfully' });
        }
      );
    };

    if (material) {
      // Material exists, use its ID
      insertEntry(material.id);
    } else {
      // Material doesn't exist, create it first
      db.run(
        'INSERT INTO materials (name, unit) VALUES (?, ?)',
        [material_name, unit],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          insertEntry(this.lastID);
        }
      );
    }
  });
});

// Mark material entry as paid
router.post('/entries/:id/pay', (req, res) => {
  const { payment_mode, payment_date } = req.body;
  
  if (!payment_mode || !payment_date) {
    return res.status(400).json({ error: 'Payment mode and date are required' });
  }

  db.run(
    `UPDATE material_entries 
     SET payment_status = 'paid', payment_mode = ?, payment_date = ?
     WHERE id = ?`,
    [payment_mode, payment_date, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Material entry not found' });
      }
      res.json({ message: 'Material entry marked as paid successfully' });
    }
  );
});

// Update material
router.put('/:id', (req, res) => {
  const { name, unit, reference_rate } = req.body;
  
  db.run(
    'UPDATE materials SET name = ?, unit = ?, reference_rate = ? WHERE id = ?',
    [name, unit, reference_rate, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Material not found' });
      }
      res.json({ message: 'Material updated successfully' });
    }
  );
});

// Update material entry
router.put('/entries/:id', (req, res) => {
  const { site_id, quantity, rate, vendor_name, date, notes } = req.body;
  const total_amount = parseFloat((quantity * rate).toFixed(2));
  
  db.run(
    `UPDATE material_entries 
     SET site_id = ?, quantity = ?, rate = ?, total_amount = ?, vendor_name = ?, date = ?, notes = ?
     WHERE id = ?`,
    [site_id, quantity, rate, total_amount, vendor_name, date, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Material entry not found' });
      }
      res.json({ message: 'Material entry updated successfully' });
    }
  );
});

// Delete material
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM materials WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  });
});

// Delete material entry
router.delete('/entries/:id', (req, res) => {
  db.run('DELETE FROM material_entries WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Material entry not found' });
    }
    res.json({ message: 'Material entry deleted successfully' });
  });
});

module.exports = router;
