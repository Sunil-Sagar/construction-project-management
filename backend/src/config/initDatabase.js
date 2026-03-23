const db = require('./database');

const initDatabase = () => {
  // Sites table
  db.run(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT,
      client_name TEXT,
      start_date TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workers table (Labor Master)
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      current_rate REAL NOT NULL DEFAULT 0,
      ot_rate REAL NOT NULL DEFAULT 100,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Worker rate history (for variable rates)
  db.run(`
    CREATE TABLE IF NOT EXISTS worker_rate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      daily_rate REAL NOT NULL,
      ot_rate REAL NOT NULL,
      effective_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);

  // Attendance table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      attendance_value REAL NOT NULL CHECK(attendance_value IN (0, 0.5, 1.0)),
      ot_hours REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
      UNIQUE(worker_id, date)
    )
  `);

  // Advances table
  db.run(`
    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      payment_mode TEXT NOT NULL CHECK(payment_mode IN ('Cash', 'UPI')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);

  // Payouts table (Saturday settlements)
  db.run(`
    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      week_start_date TEXT NOT NULL,
      week_end_date TEXT NOT NULL,
      days_worked REAL NOT NULL,
      daily_rate REAL NOT NULL,
      ot_hours REAL DEFAULT 0,
      ot_rate REAL DEFAULT 0,
      gross_wage REAL NOT NULL,
      advances REAL DEFAULT 0,
      net_payable REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      payment_mode TEXT CHECK(payment_mode IN ('Cash', 'UPI', 'Carryover')),
      payment_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'carryover')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);

  // Materials master table
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      reference_rate REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Material entries (deliveries and expenses)
  db.run(`
    CREATE TABLE IF NOT EXISTS material_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      vendor_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      rate REAL NOT NULL,
      total_amount REAL NOT NULL,
      date TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
      payment_mode TEXT CHECK(payment_mode IN ('Cash', 'UPI', NULL)),
      payment_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    )
  `);

  // Milestones table
  db.run(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      phase TEXT NOT NULL CHECK(phase IN ('Excavation', 'Footing', 'Plinth', 'Slab')),
      status TEXT DEFAULT 'not-started' CHECK(status IN ('not-started', 'in-progress', 'completed')),
      start_date TEXT,
      completion_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
      UNIQUE(site_id, phase)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('All tables created successfully');
      insertDefaultData();
    }
  });
};

const insertDefaultData = () => {
  // Insert default materials
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

  defaultMaterials.forEach(([name, unit, rate]) => {
    db.run(
      'INSERT OR IGNORE INTO materials (name, unit, reference_rate) VALUES (?, ?, ?)',
      [name, unit, rate]
    );
  });

  console.log('Default materials inserted');
};

// Run initialization
initDatabase();

module.exports = { initDatabase };
