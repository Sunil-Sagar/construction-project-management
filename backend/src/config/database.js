const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Use PostgreSQL if DATABASE_URL is set (production), otherwise SQLite (local)
if (process.env.DATABASE_URL) {
  module.exports = require('./database-compat');
} else {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.db');

  // Create database connection
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to database:', err.message);
    } else {
      console.log('Connected to SQLite database');
    }
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  module.exports = db;
}
