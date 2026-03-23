const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Helper function to update milestone status based on WIP entry
const updateMilestoneStatus = (milestoneId, wipStatus, wipDate, callback) => {
  // First, get the current milestone status
  db.get(
    'SELECT status FROM milestones WHERE id = ?',
    [milestoneId],
    (err, milestone) => {
      if (err) {
        return callback(err);
      }

      if (!milestone) {
        return callback(new Error('Milestone not found'));
      }

      // Rule A: Auto-Mobilization - If milestone is "not-started" and any WIP is logged, set to "in-progress"
      if (milestone.status === 'not-started' && wipStatus === 'in-progress') {
        db.run(
          'UPDATE milestones SET status = ? WHERE id = ?',
          ['in-progress', milestoneId],
          (err) => {
            if (err) return callback(err);
            console.log(`Auto-updated milestone ${milestoneId} from not-started to in-progress`);
            callback(null);
          }
        );
      }
      // Rule C: Auto-Closure - If WIP is marked "completed", update milestone to "completed" with actual date
      else if (wipStatus === 'completed') {
        db.run(
          'UPDATE milestones SET status = ?, actual_completion_date = ? WHERE id = ?',
          ['completed', wipDate, milestoneId],
          (err) => {
            if (err) return callback(err);
            console.log(`Auto-completed milestone ${milestoneId} with actual date ${wipDate}`);
            callback(null);
          }
        );
      }
      // If WIP is in-progress but milestone is already in-progress or completed, no change
      else {
        callback(null);
      }
    }
  );
};

// Get all WIP entries with filters
router.get('/', (req, res) => {
  const { site_id, milestone_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      w.*,
      s.name as site_name,
      m.phase as milestone_phase
    FROM daily_wip w
    JOIN sites s ON w.site_id = s.id
    JOIN milestones m ON w.milestone_id = m.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (site_id) {
    query += ' AND w.site_id = ?';
    params.push(site_id);
  }
  
  if (milestone_id) {
    query += ' AND w.milestone_id = ?';
    params.push(milestone_id);
  }
  
  if (start_date) {
    query += ' AND w.date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND w.date <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY w.date DESC, w.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single WIP entry
router.get('/:id', (req, res) => {
  const query = `
    SELECT 
      w.*,
      s.name as site_name,
      m.phase as milestone_phase
    FROM daily_wip w
    JOIN sites s ON w.site_id = s.id
    JOIN milestones m ON w.milestone_id = m.id
    WHERE w.id = ?
  `;
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'WIP entry not found' });
    }
    res.json(row);
  });
});

// Get WIP history for a specific milestone
router.get('/milestone/:milestone_id', (req, res) => {
  const query = `
    SELECT 
      w.*,
      s.name as site_name,
      m.phase as milestone_phase
    FROM daily_wip w
    JOIN sites s ON w.site_id = s.id
    JOIN milestones m ON w.milestone_id = m.id
    WHERE w.milestone_id = ?
    ORDER BY w.date DESC, w.created_at DESC
  `;
  
  db.all(query, [req.params.milestone_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create new WIP entry (with smart milestone update)
router.post('/', (req, res) => {
  const { date, site_id, milestone_id, work_details, progress_status } = req.body;
  
  if (!date || !site_id || !milestone_id || !work_details || !progress_status) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Validate progress_status
  if (!['in-progress', 'completed'].includes(progress_status)) {
    return res.status(400).json({ error: 'Invalid progress_status. Must be "in-progress" or "completed"' });
  }
  
  // Check if this is the first WIP entry for this milestone
  db.get(
    'SELECT COUNT(*) as count FROM daily_wip WHERE milestone_id = ?',
    [milestone_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const isFirstWIP = row.count === 0;
      
      // If first WIP, store current milestone status as original_status
      if (isFirstWIP) {
        db.get('SELECT status FROM milestones WHERE id = ?', [milestone_id], (err, milestone) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (milestone) {
            db.run(
              'UPDATE milestones SET original_status = ? WHERE id = ?',
              [milestone.status, milestone_id],
              (err) => {
                if (err) {
                  console.error('Error storing original status:', err.message);
                } else {
                  console.log(`Stored original status '${milestone.status}' for milestone ${milestone_id}`);
                }
                // Continue with WIP creation regardless
                createWIPEntry();
              }
            );
          } else {
            createWIPEntry();
          }
        });
      } else {
        createWIPEntry();
      }
      
      // Helper function to create WIP entry
      function createWIPEntry() {
        db.run(
          `INSERT INTO daily_wip (date, site_id, milestone_id, work_details, progress_status)
           VALUES (?, ?, ?, ?, ?)`,
          [date, site_id, milestone_id, work_details, progress_status],
          function(err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            const wipId = this.lastID;
            
            // Trigger smart milestone update
            updateMilestoneStatus(milestone_id, progress_status, date, (err) => {
              if (err) {
                console.error('Error updating milestone:', err.message);
                // Don't fail the WIP creation if milestone update fails
              }
              
              res.status(201).json({
                id: wipId,
                message: 'WIP entry created successfully'
              });
            });
          }
        );
      }
    }
  );
});

// Update WIP entry (with smart milestone update)
router.put('/:id', (req, res) => {
  const { date, work_details, progress_status } = req.body;
  
  if (!date || !work_details || !progress_status) {
    return res.status(400).json({ error: 'Date, work_details, and progress_status are required' });
  }
  
  // Validate progress_status
  if (!['in-progress', 'completed'].includes(progress_status)) {
    return res.status(400).json({ error: 'Invalid progress_status. Must be "in-progress" or "completed"' });
  }
  
  // Get the milestone_id before updating
  db.get('SELECT milestone_id FROM daily_wip WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'WIP entry not found' });
    }
    
    const milestoneId = row.milestone_id;
    
    db.run(
      `UPDATE daily_wip 
       SET date = ?, work_details = ?, progress_status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, work_details, progress_status, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'WIP entry not found' });
        }
        
        // Trigger smart milestone update
        updateMilestoneStatus(milestoneId, progress_status, date, (err) => {
          if (err) {
            console.error('Error updating milestone:', err.message);
          }
          
          res.json({ message: 'WIP entry updated successfully' });
        });
      }
    );
  });
});

// Delete WIP entry (with smart milestone status reversal)
router.delete('/:id', (req, res) => {
  // First, get the WIP entry details before deleting
  db.get('SELECT milestone_id FROM daily_wip WHERE id = ?', [req.params.id], (err, wipEntry) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!wipEntry) {
      return res.status(404).json({ error: 'WIP entry not found' });
    }
    
    const milestoneId = wipEntry.milestone_id;
    
    // Delete the WIP entry
    db.run('DELETE FROM daily_wip WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Check remaining WIP entries for this milestone
      db.all(
        'SELECT progress_status, date FROM daily_wip WHERE milestone_id = ? ORDER BY date DESC',
        [milestoneId],
        (err, remainingEntries) => {
          if (err) {
            console.error('Error checking remaining WIP entries:', err.message);
            return res.json({ message: 'WIP entry deleted successfully' });
          }
          
          // Determine milestone status based on remaining WIP entries
          if (remainingEntries.length === 0) {
            // No WIP entries left - restore to original status (before first WIP was created)
            db.get(
              'SELECT original_status FROM milestones WHERE id = ?',
              [milestoneId],
              (err, milestone) => {
                if (err) {
                  console.error('Error fetching original status:', err.message);
                  return;
                }
                
                // Default to 'not-started' if original_status wasn't stored
                const restoreStatus = milestone?.original_status || 'not-started';
                
                db.run(
                  'UPDATE milestones SET status = ?, actual_completion_date = NULL, original_status = NULL WHERE id = ?',
                  [restoreStatus, milestoneId],
                  (err) => {
                    if (err) console.error('Error reverting milestone:', err.message);
                    else console.log(`Milestone ${milestoneId} restored to '${restoreStatus}' (no WIP entries remain)`);
                  }
                );
              }
            );
          } else {
            // Check if any remaining entry is completed
            const hasCompleted = remainingEntries.some(e => e.progress_status === 'completed');
            
            if (hasCompleted) {
              // Keep milestone as completed with the latest completed date
              const latestCompleted = remainingEntries.find(e => e.progress_status === 'completed');
              db.run(
                'UPDATE milestones SET status = ?, actual_completion_date = ? WHERE id = ?',
                ['completed', latestCompleted.date, milestoneId],
                (err) => {
                  if (err) console.error('Error updating milestone:', err.message);
                  else console.log(`Milestone ${milestoneId} kept as completed (other completed WIP exists)`);
                }
              );
            } else {
              // All remaining entries are in-progress - set milestone to in-progress
              db.run(
                'UPDATE milestones SET status = ?, actual_completion_date = NULL WHERE id = ?',
                ['in-progress', milestoneId],
                (err) => {
                  if (err) console.error('Error updating milestone:', err.message);
                  else console.log(`Milestone ${milestoneId} set to in-progress (remaining WIP are in-progress)`);
                }
              );
            }
          }
          
          res.json({ message: 'WIP entry deleted successfully' });
        }
      );
    });
  });
});

module.exports = router;
