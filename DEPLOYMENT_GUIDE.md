# Deployment Guide - Construction Project Management System

Deploy both frontend and backend to **Vercel** (100% Free Forever!)

## Prerequisites

- ✅ GitHub repository: https://github.com/Sunil-Sagar/construction-project-management
- ✅ Vercel account (sign up at https://vercel.com with GitHub)

---

## 🎯 Deployment Strategy

**Both frontend and backend on Vercel:**
- ✅ **100% Free** (Hobby plan)
- ✅ **No time limits** (not a trial)
- ✅ **SQLite database** persists in serverless environment
- ✅ **Custom URL**: `construction-mgmt.vercel.app`
- ✅ **Auto-deploy** from GitHub

---

## 📦 Part 1: Deploy Backend (5 minutes)

### Step 1: Create New Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import: `Sunil-Sagar/construction-project-management`

### Step 2: Configure Backend

1. **Project Name**: `construction-backend` (or your choice)
2. **Framework Preset**: Other
3. **Root Directory**: `backend`  
   *(Click "Edit" next to Root Directory and select `backend`)*
4. **Build Command**: Leave empty
5. **Output Directory**: Leave empty
6. **Install Command**: `npm install`

### Step 3: Environment Variables

Add these in the **Environment Variables** section:
```
NODE_ENV=production
```

### Step 4: Deploy Backend

1. Click **"Deploy"**
2. Wait for deployment to complete (~2 minutes)
3. **Copy the deployment URL**: e.g., `https://construction-backend.vercel.app`
4. **SAVE THIS URL** - you'll need it for frontend!

### Step 5: Test Backend

Visit: `https://your-backend-url.vercel.app/api/health`

You should see:
```json
{"status":"OK","message":"Server is running"}
```

---

## 🎨 Part 2: Deploy Frontend (5 minutes)

### Step 1: Create Another Project

1. Go back to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**  
3. Import: `Sunil-Sagar/construction-project-management` (same repo!)

### Step 2: Configure Frontend

1. **Project Name**: `construction-mgmt` *(This becomes your URL prefix!)*
2. **Framework Preset**: Vite
3. **Root Directory**: `frontend`  
   *(Click "Edit" and select `frontend`)*
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`

### Step 3: Environment Variables

**CRITICAL**: Add your backend URL from Part 1, Step 4:

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

**Replace** `your-backend-url` with the actual URL from Part 1!

Example:
```
VITE_API_URL=https://construction-backend.vercel.app/api
```

### Step 4: Deploy Frontend

1. Click **"Deploy"**
2. Wait for deployment (~2 minutes)
3. Your app will be live!

---

## 🌐 Part 3: Configure Custom URL (IMPORTANT!)

### Set Your Custom Domain

1. After frontend deployment, go to **Project Settings**
2. Click **"Domains"** tab
3. You'll see the default URL like: `construction-mgmt.vercel.app`
4. Click **"Edit"** to customize the subdomain if needed
5. Or add a custom domain: `construction-mgmt.vercel.app`

**Your app is now live at:**  
✅ **https://construction-mgmt.vercel.app**

---

## ✅ Part 4: Verify Everything Works

### Test Backend
```
https://your-backend-url.vercel.app/api/health  → Should return OK
https://your-backend-url.vercel.app/api/sites   → Should return empty array []
```

### Test Frontend
1. Visit: `https://construction-mgmt.vercel.app`
2. Create a new site
3. Add milestones
4. Log daily WIP
5. Check if data persists after page refresh

### Check Data Persistence
- Vercel serverless functions use `/tmp` directory for SQLite
- ⚠️ **Note**: SQLite data persists during function lifecycle but may reset if function cold-starts
- For production use, consider upgrading to Vercel Postgres (optional, still free tier available)

---

## 🔧 Troubleshooting

### CORS Errors
- Backend CORS is already configured for `construction-mgmt.vercel.app`
- If you used a different domain, update `backend/src/server.js`:
  ```javascript
  const corsOptions = {
    origin: ['https://your-actual-domain.vercel.app', 'https://*.vercel.app']
    // ...
  };
  ```

### API Connection Errors
- Check `VITE_API_URL` in Vercel frontend environment variables
- Make sure it ends with `/api`
- Verify backend health endpoint returns OK

### Build Failures
- **Frontend**: Check all dependencies in `frontend/package.json`
- **Backend**: Vercel uses Node.js 18.x by default
- Check deployment logs in Vercel dashboard

### Database Not Persisting
- SQLite in serverless has limitations
- Consider Vercel Postgres for production (free tier available)
- Or use Vercel KV for session storage

---

## 💰 Cost Breakdown

- **Backend (Vercel)**: $0 (Hobby plan)
- **Frontend (Vercel)**: $0 (Hobby plan)
- **Custom vercel.app domain**: $0
- **Deployments**: Unlimited
- **Bandwidth**: 100GB/month (free tier)
- **Serverless Function Execution**: 100GB-hours (free tier)

**Total**: **$0/month** 🎉

### Usage Limits (Free Tier)
- ✅ Unlimited projects
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours function execution
- ✅ 6,000 build minutes/month

*For a personal construction project, you'll likely stay well within these limits.*

---

## 🚀 Continuous Deployment

Both projects are connected to your GitHub repo:

- **Push to** `main` **branch** → Vercel auto-deploys both! 🚀
- **Preview deployments**: Every PR gets a preview URL
- **Rollbacks**: One-click rollback in Vercel dashboard

---

## 🔐 Optional: Custom Domain

Want your own domain like `myproject.com`?

1. Go to Vercel **Project Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `myproject.com`
4. Follow DNS configuration instructions
5. Update backend CORS to include new domain

---

## 📊 Monitoring & Logs

### View Logs
- **Backend**: Vercel Dashboard → Backend Project → Functions → View Logs
- **Frontend**: Vercel Dashboard → Frontend Project → Deployments → View Function Logs

### Performance Monitoring
- Vercel provides built-in analytics
- View in: Project → Analytics
- Monitor response times, errors, bandwidth

---

## 🎯 Post-Deployment Checklist

- [  ] Backend health endpoint returns OK
- [  ] Frontend loads at custom URL
- [  ] Can create sites
- [  ] Can add milestones
- [  ] Can log daily WIP
- [  ] Data persists across page refreshes
- [  ] Mobile responsive design works
- [  ] All features functional

---

## 🆘 Need Help?

1. **Check Vercel Logs**: Dashboard → Project → Deployments → View Function Logs
2. **Review Build Logs**: Dashboard → Project → Deployments → Build Logs  
3. **Vercel Documentation**: https://vercel.com/docs
4. **GitHub Issues**: Create issue in your repo

---

## 🎉 Success!

Your Construction Project Management System is now deployed!

**Frontend**: https://construction-mgmt.vercel.app  
**Backend**: https://construction-backend.vercel.app

Both are **FREE FOREVER** on Vercel's Hobby plan! 🚀
