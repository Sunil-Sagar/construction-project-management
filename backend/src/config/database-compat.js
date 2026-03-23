const { neon } = require('@neondatabase/serverless');

// Get connection string from environment variable
const sql = neon(process.env.DATABASE_URL || '');

// Compatibility wrapper to make Neon work like SQLite's callback API
const db = {
  // Execute query and return all rows (like SQLite's db.all)
  all: async function(query, params, callback) {
    try {
      // Convert ? placeholders to $1, $2, etc for PostgreSQL
      let paramIndex = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      const result = await sql(pgQuery, params || []);
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  },

  // Execute query and return first row (like SQLite's db.get)
  get: async function(query, params, callback) {
    try {
      let paramIndex = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      const result = await sql(pgQuery, params || []);
      callback(null, result[0] || null);
    } catch (error) {
      callback(error, null);
    }
  },

  // Execute query without returning rows (like SQLite's db.run)
  run: async function(query, params, callback) {
    try {
      let paramIndex = 0;
      const pgQuery = query.replace(/\?/g, () => `$${++paramIndex}`);
      
      const result = await sql(pgQuery, params || []);
      
      // Simulate SQLite's this context with lastID and changes
      const context = {
        lastID: result[0]?.id || null,
        changes: result.length
      };
      
      if (callback) {
        callback.call(context, null);
      }
    } catch (error) {
      if (callback) {
        callback.call({}, error);
      }
    }
  },

  // Direct SQL access for complex queries
  sql: sql
};

module.exports = db;
