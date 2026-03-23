const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all vercel.app subdomains
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      }
    : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database initialization promise
let dbInitialized = false;
let dbInitPromise = null;

// Initialize database (PostgreSQL in production, SQLite local)
if (process.env.DATABASE_URL) {
  // Use PostgreSQL (Neon) in production
  const { initPostgresDatabase } = require('./config/initDatabase-postgres');
  dbInitPromise = initPostgresDatabase()
    .then(() => {
      dbInitialized = true;
      console.log('PostgreSQL database initialized successfully');
    })
    .catch(err => {
      console.error('Failed to initialize PostgreSQL:', err);
      throw err;
    });
} else {
  // Use SQLite for local development
  require('./config/initDatabase');
  dbInitialized = true;
}

// Middleware to ensure database is ready before handling requests
app.use(async (req, res, next) => {
  if (!dbInitialized && dbInitPromise) {
    try {
      await dbInitPromise;
    } catch (err) {
      return res.status(503).json({ error: 'Database initialization failed' });
    }
  }
  next();
});

// Import routes
const sitesRoutes = require('./routes/sites');
const workersRoutes = require('./routes/workers');
const attendanceRoutes = require('./routes/attendance');
const advancesRoutes = require('./routes/advances');
const payoutsRoutes = require('./routes/payouts');
const materialsRoutes = require('./routes/materials');
const milestonesRoutes = require('./routes/milestones');
const wipRoutes = require('./routes/wip');
const reportsRoutes = require('./routes/reports');

// Routes
app.use('/api/sites', sitesRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advances', advancesRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/wip', wipRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server (local development only)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
