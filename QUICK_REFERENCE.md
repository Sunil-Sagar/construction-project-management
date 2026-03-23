# Quick Reference Card

## 🚀 How to Start the Application

### Easy Way (Recommended)
1. Right-click on `start.ps1`
2. Select "Run with PowerShell"
3. Wait for browser to open automatically
4. App will be at: http://localhost:3000

### Manual Way
Open 2 PowerShell windows:

**Window 1 - Backend:**
```powershell
cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\backend"
npm run dev
```

**Window 2 - Frontend:**
```powershell
cd "C:\Users\sunsagar\Sunil\Personal_Docs\Construction Project\frontend"
npm run dev
```

Then open browser: http://localhost:3000

---

## 📊 Quick Workflow

### Daily Morning
1. **Attendance** page
2. Select today's date and site
3. Mark workers: Full (1.0), Half (0.5), or Absent (0)
4. Enter OT hours if any

### During Week
- **Advances**: Record any cash given to workers
- **Materials**: Log material deliveries from vendors

### Saturday Evening (Settlement)
1. **Payouts** page
2. "Calculate This Week"
3. Review wages: (Days × Rate) + (OT × OT Rate) - Advances
4. "Process Payouts"
5. Mark each as "Paid" or "Carryover"

### Anytime
- **Reports**: Generate reports for any date range/site
- **Dashboard**: View quick stats and reminders

---

## 💡 Key Formulas

**Net Payable:**
```
(Days Worked × Daily Rate) + (OT Hours × OT Rate) - Advances
```

**Week Cycle:**
```
Sunday (Start) ─→ Saturday (Settlement Day)
```

---

## 💾 Backup Your Data

**Database Location:**
```
backend\database.db
```

**To Backup:**
1. Stop both servers (Ctrl+C)
2. Copy `database.db` to safe location
3. Restart servers

**Backup Command:**
```powershell
Copy-Item "backend\database.db" -Destination "backup_$(Get-Date -Format 'yyyy-MM-dd').db"
```

---

## 🎯 Navigation

| Page | Purpose |
|------|---------|
| 📊 Dashboard | Overview & quick stats |
| 🏗️ Sites | Manage construction sites |
| 👷 Workers | Manage labor with rates |
| 📋 Attendance | Daily attendance entry |
| 💵 Advances | Cash advances tracking |
| 💰 Payouts | Saturday settlement |
| 🧱 Materials | Material deliveries |
| 🎯 Milestones | Project progress |
| 📈 Reports | Analytics & reports |

---

## ⚙️ Settings & Master Data

### Adding a New Site
1. Sites → "+ Add Site"
2. Fill: Name, Location, Client, Start Date
3. Click "Milestones" to initialize phases

### Adding a New Worker
1. Workers → "+ Add Worker"
2. Fill: Name, Role, Daily Rate, OT Rate
3. Rate changes create history automatically

### Adding a New Material
1. Materials → "+ Add Material"
2. Fill: Name, Unit, Reference Rate

---

## 🧮 Attendance Values

- **1.0** = Full day (8 hours)
- **0.5** = Half day (4 hours)
- **0** = Absent

**OT Hours:** Separate field, calculated at OT rate

---

## 💰 Payment Modes

- **Cash**: Physical cash payment
- **UPI**: Digital payment (PhonePe/GPay/Paytm)
- **Carryover**: Will pay later (Saturday absent)

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access app | Check both servers are running |
| Page won't load | Refresh browser (F5) |
| Data not showing | Check browser console (F12) |
| Server won't start | Port already in use - restart PC |
| Need to reset | Delete `database.db`, run `npm run init-db` |

---

## 📞 System Info

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Health Check**: http://localhost:5000/api/health
- **Database**: `backend/database.db` (SQLite)
- **Tech**: React + Node.js + SQLite

---

## 📝 Important Notes

✅ Keep both server windows open while using app  
✅ Backup database.db file regularly  
✅ Week runs Sunday to Saturday  
✅ Worker rates tracked historically  
✅ All data stored locally (private)  
✅ No internet needed after installation  

---

**Need Help?** Check SETUP_GUIDE.md or PROJECT_DOCS.md
