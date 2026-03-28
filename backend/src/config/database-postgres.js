const { neon } = require('@neondatabase/serverless');

// Get connection string from environment variable
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
}

console.log('Initializing Neon connection...');
const sql = neon(process.env.DATABASE_URL);
console.log('Neon connection initialized');

module.exports = sql;
