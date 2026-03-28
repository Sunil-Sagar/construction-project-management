const sql = require('./database-postgres');

const initPostgresDatabase = async () => {
  try {
    console.log('Creating PostgreSQL tables...');

    // Sites table
    await sql`
      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        location TEXT,
        client_name VARCHAR(255),
        start_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Workers table (Labor Master)
    await sql`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(100) NOT NULL,
        current_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
        ot_rate NUMERIC(10,2) NOT NULL DEFAULT 100,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Worker rate history (for variable rates)
    await sql`
      CREATE TABLE IF NOT EXISTS worker_rate_history (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        daily_rate NUMERIC(10,2) NOT NULL,
        ot_rate NUMERIC(10,2) NOT NULL,
        effective_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
      )
    `;

    // Attendance table
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        date DATE NOT NULL,
        attendance_value NUMERIC(2,1) NOT NULL CHECK(attendance_value IN (0, 0.5, 1.0)),
        ot_hours NUMERIC(5,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        UNIQUE(worker_id, date)
      )
    `;

    // Advances table
    await sql`
      CREATE TABLE IF NOT EXISTS advances (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        date DATE NOT NULL,
        payment_mode VARCHAR(50) NOT NULL CHECK(payment_mode IN ('Cash', 'UPI')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
      )
    `;

    // Payouts table (Saturday settlements)
    await sql`
      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER NOT NULL,
        week_start_date DATE NOT NULL,
        week_end_date DATE NOT NULL,
        days_worked NUMERIC(3,1) NOT NULL,
        daily_rate NUMERIC(10,2) NOT NULL,
        ot_hours NUMERIC(5,2) DEFAULT 0,
        ot_rate NUMERIC(10,2) DEFAULT 0,
        gross_wage NUMERIC(10,2) NOT NULL,
        advances NUMERIC(10,2) DEFAULT 0,
        net_payable NUMERIC(10,2) NOT NULL,
        amount_paid NUMERIC(10,2) DEFAULT 0,
        payment_mode VARCHAR(50) CHECK(payment_mode IN ('Cash', 'UPI', 'Carryover')),
        payment_date DATE,
        status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'carryover')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
      )
    `;

    // Materials master table
    await sql`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        unit VARCHAR(50) NOT NULL,
        reference_rate NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Material entries (deliveries and expenses)
    await sql`
      CREATE TABLE IF NOT EXISTS material_entries (
        id SERIAL PRIMARY KEY,
        material_id INTEGER NOT NULL,
        site_id INTEGER NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        rate NUMERIC(10,2) NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL,
        date DATE NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
        payment_mode VARCHAR(50) CHECK(payment_mode IN ('Cash', 'UPI')),
        payment_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      )
    `;

    // Milestones table
    await sql`
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        site_id INTEGER NOT NULL,
        phase VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'not-started' CHECK(status IN ('not-started', 'in-progress', 'completed')),
        start_date DATE,
        completion_date DATE,
        actual_completion_date DATE,
        original_status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        UNIQUE(site_id, phase)
      )
    `;

    console.log('✓ All PostgreSQL tables created successfully');

    // Insert default materials
    await insertDefaultData();

  } catch (error) {
    console.error('Error creating PostgreSQL tables:', error.message);
    throw error;
  }
};

const insertDefaultData = async () => {
  try {
    const defaultMaterials = [
      ['Cement', 'Bag', 400],
      ['Sand', 'Ton', 1500],
      ['Aggregate', 'Ton', 2000],
      ['Steel (8mm)', 'Kg', 55],
      ['Steel (10mm)', 'Kg', 55],
      ['Steel (12mm)', 'Kg', 55],
      ['Bricks', 'Unit', 8],
      ['M-Sand', 'Ton', 1800]
    ];

    for (const [name, unit, rate] of defaultMaterials) {
      await sql`
        INSERT INTO materials (name, unit, reference_rate) 
        VALUES (${name}, ${unit}, ${rate})
        ON CONFLICT (name) DO NOTHING
      `;
    }

    console.log('✓ Default materials inserted');
  } catch (error) {
    console.error('Error inserting default materials:', error.message);
  }
};

module.exports = { initPostgresDatabase };
