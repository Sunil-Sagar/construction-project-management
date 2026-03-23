# Construction Manager - Project Documentation

## Project Overview

A full-stack web application designed for civil contractors to manage multiple construction sites, track labor attendance, calculate wages with variable rates, manage materials, and generate comprehensive reports.

## System Architecture

```
Construction Manager
├── Backend (Node.js + Express + SQLite)
│   ├── REST API Server (Port 5000)
│   ├── SQLite Database (Single file)
│   └── Business Logic (Wage calculation, Reports)
│
└── Frontend (React + Vite + Tailwind CSS)
    ├── Web UI (Port 3000)
    ├── Component-based Architecture
    └── Responsive Design
```

## Database Schema

### Core Tables

1. **sites** - Construction site master data
   - id, name, location, client_name, start_date, status

2. **workers** - Labor master with current rates
   - id, name, phone, role (Mason/Labor/Mestri), current_rate, ot_rate, status

3. **worker_rate_history** - Historical rate tracking (Variable Rates)
   - id, worker_id, daily_rate, ot_rate, effective_date

4. **attendance** - Daily attendance records
   - id, worker_id, site_id, date, attendance_value (0/0.5/1.0), ot_hours

5. **advances** - Cash advances given to workers
   - id, worker_id, amount, date, payment_mode (Cash/UPI)

6. **payouts** - Weekly settlement records (Saturday)
   - id, worker_id, week_start_date, week_end_date, days_worked, gross_wage, advances, net_payable, payment_status

7. **materials** - Material types master
   - id, name, unit, reference_rate

8. **material_entries** - Material deliveries and expenses
   - id, material_id, site_id, vendor_name, quantity, rate, total_amount, payment_status

9. **milestones** - Project progress tracking
   - id, site_id, phase (Excavation/Footing/Plinth/Slab), status, dates

## API Endpoints

### Sites API
- GET `/api/sites` - Get all sites
- GET `/api/sites/active` - Get active sites
- POST `/api/sites` - Create new site
- PUT `/api/sites/:id` - Update site
- DELETE `/api/sites/:id` - Delete site

### Workers API
- GET `/api/workers` - Get all workers
- GET `/api/workers/active` - Get active workers
- GET `/api/workers/:id` - Get worker with rate history
- POST `/api/workers` - Create new worker
- PUT `/api/workers/:id` - Update worker (creates rate history if rate changed)
- DELETE `/api/workers/:id` - Delete worker

### Attendance API
- GET `/api/attendance/date/:date` - Get attendance by date
- GET `/api/attendance/range` - Get attendance by date range
- POST `/api/attendance` - Mark attendance (single worker)
- POST `/api/attendance/bulk` - Bulk attendance entry
- PUT `/api/attendance/:id` - Update attendance
- DELETE `/api/attendance/:id` - Delete attendance

### Advances API
- GET `/api/advances` - Get all advances
- GET `/api/advances/worker/:worker_id` - Get worker's advances
- POST `/api/advances` - Record new advance
- PUT `/api/advances/:id` - Update advance
- DELETE `/api/advances/:id` - Delete advance

### Payouts API (Saturday Settlement)
- GET `/api/payouts` - Get all payouts
- GET `/api/payouts/week/:date` - Get payouts for specific week
- GET `/api/payouts/pending` - Get pending/carryover payouts
- **POST `/api/payouts/calculate`** - Calculate wages for a week (preview)
- **POST `/api/payouts/process`** - Process weekly payouts (create records)
- POST `/api/payouts/:id/pay` - Mark payout as paid
- POST `/api/payouts/:id/carryover` - Mark payout as carryover
- DELETE `/api/payouts/:id` - Delete payout

### Materials API
- GET `/api/materials` - Get all materials
- GET `/api/materials/entries` - Get material entries (with filters)
- POST `/api/materials` - Create new material
- POST `/api/materials/entries` - Record material delivery
- POST `/api/materials/entries/:id/pay` - Mark entry as paid
- PUT `/api/materials/:id` - Update material
- DELETE `/api/materials/:id` - Delete material

### Milestones API
- GET `/api/milestones` - Get all milestones
- GET `/api/milestones/site/:site_id` - Get milestones for a site
- POST `/api/milestones` - Create/update milestone
- POST `/api/milestones/initialize/:site_id` - Initialize all 4 phases for a site
- PUT `/api/milestones/:id` - Update milestone
- DELETE `/api/milestones/:id` - Delete milestone

### Reports API
- GET `/api/reports/attendance` - Attendance report
- GET `/api/reports/labor-cost` - Labor cost analysis
- GET `/api/reports/financial-outflow` - Cash vs UPI breakdown
- GET `/api/reports/material-consumption` - Material usage by site
- GET `/api/reports/milestone-progress` - Project progress
- GET `/api/reports/dashboard-summary` - Dashboard statistics

## Business Logic

### Wage Calculation (wageService.js)

The core wage calculation handles:

1. **Variable Rates**: Workers' rates can change mid-week
   - System stores rate history with effective dates
   - When calculating wages, correct rate is applied to each day
   - Days before rate change: old rate
   - Days after rate change: new rate

2. **Formula**:
   ```
   Gross Wage = Σ(Attendance × Applicable Daily Rate) + Σ(OT Hours × Applicable OT Rate)
   Net Payable = Gross Wage - Total Advances
   ```

3. **Week Boundaries**: Sunday (week start) to Saturday (week end)

4. **Carryover**: If worker absent on Saturday, amount carries forward

### Multi-Site Support

- Workers can work at different sites on different days
- Attendance records include site_id
- Reports can filter by site for accurate cost allocation

## Frontend Structure

```
frontend/src/
├── components/
│   ├── Layout.jsx          # Main layout with sidebar navigation
│   ├── Card.jsx            # Reusable card component
│   ├── Button.jsx          # Button with variants
│   └── Modal.jsx           # Modal dialog component
│
├── pages/
│   ├── Dashboard.jsx       # Main dashboard with stats
│   ├── Sites.jsx           # Sites management (CRUD)
│   ├── Workers.jsx         # Workers management (CRUD)
│   ├── Attendance.jsx      # Attendance marking (placeholder)
│   ├── Advances.jsx        # Advances tracking (placeholder)
│   ├── Payouts.jsx         # Saturday settlement (placeholder)
│   ├── Materials.jsx       # Material tracking (placeholder)
│   ├── Milestones.jsx      # Milestone tracking (placeholder)
│   └── Reports.jsx         # Report center (placeholder)
│
├── services/
│   └── api.js              # API service layer (axios)
│
├── utils/
│   └── helpers.js          # Utility functions (date, currency formatting)
│
├── App.jsx                 # Main app component with routing
└── main.jsx                # Entry point
```

## Features Implemented

### ✅ Fully Functional
- Backend API (all endpoints)
- Database schema with proper relationships
- Wage calculation service (with variable rates support)
- Dashboard with summary statistics
- Sites management (full CRUD)
- Workers management (full CRUD with rate history)
- Reports API (all report types)

### 🚧 UI Placeholders (API Ready)
- Attendance marking interface
- Advances entry interface
- Saturday settlement interface
- Materials tracking interface
- Milestones management interface
- Full reporting dashboard UI

## Key Business Rules

1. **Week Cycle**: Strict Sunday-to-Saturday
2. **Attendance Values**: 0 (absent), 0.5 (half day), 1.0 (full day)
3. **OT Calculation**: Hours-based at flat rate (not percentage of daily wage)
4. **Rate Changes**: Tracked historically, applied correctly to wage calculations
5. **Carryover**: Unpaid wages roll forward automatically
6. **Payment Modes**: Cash or UPI tracking for all transactions
7. **Multi-Site**: Workers can switch sites; costs allocated correctly

## Data Flow Example: Saturday Settlement

1. User clicks "Calculate This Week" on Payouts page
2. Frontend calls: `POST /api/payouts/calculate` with date
3. Backend determines week boundaries (Sun-Sat)
4. **wageService.calculateWeeklyWagesForAllWorkers()**:
   - Finds all workers who worked this week
   - For each worker:
     - Gets attendance records  
     - Gets rate history
     - For each attendance day:
       - Finds applicable rate (based on effective date)
       - Calculates: attendance × rate + OT hours × OT rate
     - Sums up gross wage
     - Gets total advances for the week
     - Calculates: net payable = gross - advances
5. Returns preview data to frontend
6. User reviews and clicks "Process Payouts"
7. Frontend calls: `POST /api/payouts/process`
8. Backend creates payout records in database
9. User can then mark each payout as Paid (Cash/UPI) or Carryover

## Security & Data

- **No Authentication**: Single-user system (as per requirements)
- **Local Database**: SQLite file stored locally
- **No Cloud**: Runs entirely on user's laptop
- **Backup**: User responsible for copying database.db file
- **Data Privacy**: All data stays on user's machine

## Performance Considerations

- SQLite: Suitable for single-user, moderate data volume
- Indexes: Primary keys auto-indexed
- No pagination: Suitable for contractor-scale data (hundreds of records, not millions)
- Lazy loading: Can be added if performance issues arise

## Future Enhancement Ideas

1. **Complete UI Pages**: Finish placeholder pages
2. **PDF Export**: Generate printable reports
3. **Charts**: Visual analytics (Chart.js/Recharts)
4. **Auto-Backup**: Scheduled database backups
5. **Mobile App**: React Native version for on-site entry
6. **Offline Mode**: PWA with service workers
7. **Multi-User**: Add authentication for team access
8. **Cloud Sync**: Optional cloud backup
9. **WhatsApp Integration**: Send payment confirmations
10. **Bill Generation**: Customer invoicing module

## Technologies Used

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend Runtime | Node.js | 16+ | JavaScript runtime |
| Backend Framework | Express.js | 4.18+ | REST API server |
| Database | SQLite3 | 5.1+ | Embedded database |
| Frontend Framework | React | 18.2 | UI library |
| Build Tool | Vite | 4.4+ | Fast dev server & bundler |
| CSS Framework | Tailwind CSS | 3.3+ | Utility-first CSS |
| HTTP Client | Axios | 1.5+ | API calls |
| Routing | React Router | 6.16+ | Client-side routing |
| Date Handling | date-fns | 2.30+ | Date formatting |
| Charts (planned) | Recharts | 2.8+ | Data visualization |

## File Sizes (Approximate)

- Backend code: ~50 KB
- Frontend code: ~200 KB
- node_modules (backend): ~50 MB
- node_modules (frontend): ~200 MB
- Database (empty): ~100 KB
- Database (with 1 year data): ~5-10 MB

## Development Notes

- **Port 5000**: Backend server
- **Port 3000**: Frontend dev server
- **CORS**: Enabled for local development
- **Hot Reload**: Both servers support live reload
- **Error Handling**: Basic error handling implemented
- **Validation**: Client-side and server-side validation

## Maintenance

### Regular Tasks
- Backup database weekly
- Clear old data after year-end
- Update dependencies quarterly
- Test on new Node.js versions

### Database Maintenance
```sql
-- Clean up old data (if needed)
DELETE FROM attendance WHERE date < '2024-01-01';
DELETE FROM payouts WHERE week_end_date < '2024-01-01';

-- Vacuum to reclaim space
VACUUM;
```

---

**Built with ❤️ for streamlined construction management**
