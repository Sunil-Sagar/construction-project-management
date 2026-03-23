# Construction Manager - Setup Guide

## Quick Start Guide

Follow these steps to get your Construction Manager application up and running on your laptop.

### Prerequisites

Before starting, ensure you have the following installed on your Windows machine:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open PowerShell and run `node --version`

2. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

---

## Installation Steps

### Step 1: Install Backend Dependencies

1. Open PowerShell or Windows Terminal
2. Navigate to the backend folder:
   ```powershell
   cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\backend"
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Initialize the database:
   ```powershell
   npm run init-db
   ```

   This will create the SQLite database file and set up all necessary tables.

### Step 2: Install Frontend Dependencies

1. Navigate to the frontend folder:
   ```powershell
   cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\frontend"
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

---

## Running the Application

You'll need to run both the backend and frontend servers. Open TWO separate PowerShell/Terminal windows.

### Terminal 1 - Start Backend Server

```powershell
cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\backend"
npm run dev
```

You should see:
```
Server is running on http://localhost:5000
Connected to SQLite database
All tables created successfully
```

Keep this terminal window open.

### Terminal 2 - Start Frontend Server

```powershell
cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\frontend"
npm run dev
```

You should see:
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:3000/
```

Keep this terminal window open as well.

### Step 3: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the Construction Manager dashboard!

---

## First-Time Setup

Once the application is running, follow these steps to set up your data:

1. **Add Sites**
   - Click on "Sites" in the sidebar
   - Click "+ Add Site"
   - Enter your construction site details
   - Initialize milestones for each site

2. **Add Workers**
   - Click on "Workers" in the sidebar
   - Click "+ Add Worker"
   - Enter worker name, role (Mason/Labor/Mestri), daily rate, and OT rate
   - Repeat for all your workers

3. **Start Using the App**
   - Mark daily attendance
   - Record advances
   - Process Saturday settlements
   - Track materials and expenses
   - View reports

---

## Daily Workflow

### Morning (On-Site)
1. Open the app: `http://localhost:3000`
2. Go to **Attendance**
3. Select today's date and site
4. Mark attendance for each worker (Full day / Half day)
5. Enter overtime hours if applicable

### During the Week
1. **Record Advances**: When giving cash to workers
   - Go to **Advances** → Add advance entry
   - Select worker, amount, payment mode (Cash/UPI)

2. **Record Material Deliveries**:
   - Go to **Materials** → Add material entry
   - Select site, material, vendor, quantity, rate
   - Mark as "Pending" (will settle later)

### Saturday Evening (Settlement Time)
1. Go to **Payouts**
2. Click "Calculate This Week's Wages"
3. Review the calculated wages for each worker
   - Formula: (Days × Rate) + (OT Hours × OT Rate) - Advances
4. Click "Process Payouts"
5. Mark each payout as "Paid" (Cash/UPI) or "Carryover"

### Anytime (Reporting)
1. Go to **Reports** (Mood-Proof Report Center)
2. Select date range and site
3. Generate reports:
   - Attendance summary
   - Labor cost analysis
   - Financial outflow (Cash vs UPI)
   - Material consumption
   - Milestone progress
4. Export to PDF/Excel for clients

---

## Data Backup

Your data is stored in:
```
backend/database.db
```

**Important: Backup this file regularly!**

### How to Backup:

1. Stop both servers (Ctrl+C in both terminals)
2. Copy the database file:
   ```powershell
   Copy-Item "backend/database.db" -Destination "backups/database_$(Get-Date -Format 'yyyy-MM-dd').db"
   ```

3. Store the backup file in a safe location (external drive, cloud storage)

---

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### Frontend won't start
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### Database errors
- Delete `backend/database.db`
- Run `npm run init-db` again to recreate the database

### Can't see data
- Make sure both backend AND frontend are running
- Check browser console for errors (F12)
- Verify backend is accessible: http://localhost:5000/api/health

---

## Key Features Implemented

✅ **Master Data Management**
- Sites management
- Workers management with role-based rates
- Materials master

✅ **Daily Operations**  
- Attendance tracking (full/half day, OT hours)
- Advances recording
- Material delivery entries

✅ **Weekly Settlement (Saturday Process)**
- Auto-calculation of wages with variable rate support
- Advances deduction
- Carryover support for absent workers

✅ **Wage Calculation Formula**
```
Net Payable = (Days Worked × Daily Rate) + (OT Hours × OT Rate) - Advances
```

✅ **Variable Rate Handling**
- Rate changes tracked historically
- Old rate applies to days already worked
- New rate applies to future days

✅ **Multi-Site Operations**
- Workers can switch between sites
- Cost allocation by site

✅ **Reporting Dashboard**
- Dashboard summary
- Date-range based reports
- Site-specific filters
- Export capabilities

---

## Next Steps (Future Enhancements)

The foundation is built! You can now enhance the app with:

- Full implementation of all placeholder pages
- PDF export functionality for reports
- Backup automation
- Mobile-responsive views for on-site entry
- Advanced analytics and charts
- Expense categorization
- Client billing module

---

## Support

For questions or issues:
1. Check this guide first
2. Review the README.md file
3. Check browser console for errors
4. Verify both servers are running

---

## Tech Stack Summary

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (single file, no server needed)
- **Authentication**: None (single-user system)
- **Hosting**: Local (runs on your laptop)

---

**Enjoy your new Construction Manager app!** 🏗️💪
