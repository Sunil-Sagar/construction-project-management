const { neon } = require('@neondatabase/serverless');

// Get connection string from environment variable
const sql = neon(process.env.DATABASE_URL || '');

// Compatibility wrapper to make Neon work like SQLite's callback API
const db = {
  // Execute query and return all rows (like SQLite's db.all)
  all: async function(query, params, callback) {
    // Handle optional params: db.all(query, callback) or db.all(query, params, callback)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      // Convert ? placeholders to $1, $2, etc for PostgreSQL
      let paramIndex = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      // Call Neon SQL: sql(query, params)
      const result = await sql(pgQuery, params || []);
      
      callback(null, result);
    } catch (error) {
      console.error('Database query error (all):', error);
      callback(error, null);
    }
  },

  // Execute query and return first row (like SQLite's db.get)
  get: async function(query, params, callback) {
    // Handle optional params: db.get(query, callback) or db.get(query, params, callback)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      let paramIndex = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      const result = await sql(pgQuery, params || []);
      
      callback(null, result[0] || null);
    } catch (error) {
      console.error('Database query error (get):', error);
      callback(error, null);
    }
  },

  // Execute query without returning rows (like SQLite's db.run)
  run: async function(query, params, callback) {
    // Handle optional params: db.run(query, callback) or db.run(query, params, callback)
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      let paramIndex = 0;
      let pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      // Add RETURNING id for INSERT queries to get lastID
      if (pgQuery.toUpperCase().trim().startsWith('INSERT')) {
        pgQuery += ' RETURNING id';
      }
      
      const result = await sql(pgQuery, params || []);
      
      // Simulate SQLite's this context with lastID and changes
      const context = {
        lastID: result[0]?.id || null,
        changes: result.length || (result.count !== undefined ? result.count : 1)
      };
      
      if (callback) {
        callback.call(context, null);
      }
    } catch (error) {
      console.error('Database query error (run):', error);
      if (callback) {
        callback.call({}, error);
      }
    }
  },

  // Serialize method for sequential execution (SQLite compatibility)
  serialize: function(callback) {
    // In PostgreSQL, just execute the callback immediately
    // Queries are already sequential within a callback chain
    if (callback) callback();
  },

  // Prepare statement for batch operations (SQLite compatibility)
  prepare: function(query) {
    return {
      run: async function(params, callback) {
        try {
          let paramIndex = 0;
          let pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
          
          // Add RETURNING id for INSERT queries
          if (pgQuery.toUpperCase().trim().startsWith('INSERT')) {
            // Remove OR IGNORE if present (not standard PostgreSQL)
            pgQuery = pgQuery.replace(/INSERT OR IGNORE/i, 'INSERT');
            
            // Add RETURNING id if not already present
            if (!pgQuery.toUpperCase().includes('RETURNING')) {
              pgQuery += ' RETURNING id';
            }
            
            // Add ON CONFLICT DO NOTHING for OR IGNORE behavior
            if (query.toUpperCase().includes('OR IGNORE')) {
              const returningPos = pgQuery.toUpperCase().indexOf('RETURNING');
              pgQuery = pgQuery.substring(0, returningPos) + 'ON CONFLICT DO NOTHING ' + pgQuery.substring(returningPos);
            }
          }
          
          const result = await sql(pgQuery, params || []);
          
          const context = {
            lastID: result[0]?.id || null,
            changes: result.length || (result.count !== undefined ? result.count : 1)
          };
          
          if (callback) {
            callback.call(context, null);
          }
        } catch (error) {
          console.error('Database query error (prepare):', error);
          if (callback) {
            callback.call({}, error);
          }
        }
      },
      finalize: function(callback) {
        // No cleanup needed for Neon, just call callback
        if (callback) callback(null);
      }
    };
  },

  // Direct SQL access for complex queries
  sql: sql
};

module.exports = db;
