const { neon } = require('@neondatabase/serverless');

// Get connection string from environment variable
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
}

const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
