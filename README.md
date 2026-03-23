# Civil Contractor Management System

A comprehensive web application for managing multiple construction sites, labor attendance, wages, materials, and project milestones.

## Features

- **Labor & Wage Management**: Track attendance, calculate wages with variable rates, overtime, and advances
- **Multi-Site Operations**: Manage workers across multiple construction sites
- **Material & Expense Tracking**: Record material deliveries and vendor payments
- **Project Milestones**: Track construction progress (Excavation → Footing → Plinth → Slab)
- **Reporting Dashboard**: Generate reports for any date range and site

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Reports**: PDF generation with jsPDF

## Project Structure

```
construction-manager/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Wage calculation, reporting services
│   │   └── server.js       # Entry point
│   ├── database.db         # SQLite database file
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Main pages
│   │   ├── services/      # API calls
│   │   └── App.js
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run on `http://localhost:3000`

## Database Schema

- **sites**: Construction sites master data
- **workers**: Labor master with roles (Mason/Labor/Mestri)
- **worker_rate_history**: Track rate changes with effective dates
- **attendance**: Daily attendance records (full/half day, OT hours)
- **advances**: Cash advances given to workers
- **payouts**: Weekly settlement records
- **materials**: Material types master data
- **material_entries**: Material deliveries and expenses
- **milestones**: Project progress tracking

## Key Business Logic

### Wage Calculation
```
Net Payable = (Days × Daily Rate) + (OT Hours × OT Rate) - Advances
```

- Weekly cycle: Sunday to Saturday
- Settlement: Every Saturday evening
- Variable rates: Rate changes tracked historically
- Carryover: Unpaid amounts carry forward

### Variable Rate Handling
When a worker's rate changes mid-week:
- Old rate applies to days already worked
- New rate applies to future days
- System tracks effective dates automatically

## License

Private use only.
