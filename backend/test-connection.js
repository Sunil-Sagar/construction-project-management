// Test Neon PostgreSQL connection
require('dotenv').config();

const { neon } = require('@neondatabase/serverless');

const testConnection = async () => {
  try {
    console.log('Testing Neon PostgreSQL connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set!');
      console.log('Make sure to set DATABASE_URL in your .env file');
      process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    // Test basic query
    console.log('\n1. Testing basic connection...');
    const result = await sql.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);

    // Check if tables exist
    console.log('\n2. Checking tables...');
    const tables = await sql.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));

    // Check sites count
    console.log('\n3. Checking sites data...');
    const sites = await sql.query('SELECT COUNT(*) as count FROM sites');
    console.log('✅ Sites in database:', sites.rows[0].count);

    if (sites.rows[0].count > 0) {
      const allSites = await sql.query('SELECT id, name, location FROM sites LIMIT 5');
      console.log('Sample sites:');
      allSites.rows.forEach(site => console.log(`  - [${site.id}] ${site.name} (${site.location || 'No location'})`));
    }

    // Check workers count
    console.log('\n4. Checking workers data...');
    const workers = await sql.query('SELECT COUNT(*) as count FROM workers');
    console.log('✅ Workers in database:', workers.rows[0].count);

    if (workers.rows[0].count > 0) {
      const allWorkers = await sql.query('SELECT id, name, role FROM workers LIMIT 5');
      console.log('Sample workers:');
      allWorkers.rows.forEach(worker => console.log(`  - [${worker.id}] ${worker.name} (${worker.role})`));
    }

    console.log('\n✅ All checks passed! Database is accessible.');

  } catch (error) {
    console.error('\n❌ Connection test failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testConnection();
