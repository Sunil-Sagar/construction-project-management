const { neon } = require('@neondatabase/serverless');

// Get connection string from environment variable
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
