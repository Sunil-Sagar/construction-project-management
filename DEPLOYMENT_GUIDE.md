# Deployment Guide - Construction Project Management System

This guide walks you through deploying the application with:
- **Backend**: Railway (free tier with persistent SQLite)
- **Frontend**: Vercel with custom URL `construction-mgmt.vercel.app`

## Prerequisites

- GitHub repository (✅ Already done: https://github.com/Sunil-Sagar/construction-project-management)
- Railway account (sign up at https://railway.app)
- Vercel account (✅ Already have)

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account & Project

1. Go to https://railway.app and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `Sunil-Sagar/construction-project-management`
5. Railway will detect the backend automatically

### Step 2: Configure Backend Service

1. Click on the deployed service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Go to **Variables** tab and add:
   ```
   NODE_ENV=production
   PORT=5000
   ```

### Step 3: Get Backend URL

1. Go to **Settings** > **Networking**
2. Click **"Generate Domain"**
3. You'll get a URL like: `https://construction-backend-production-xxxx.railway.app`
4. **SAVE THIS URL** - you'll need it for frontend deployment!

### Step 4: Test Backend

Visit: `https://your-railway-url.railway.app/api/health`

You should see: `{"status":"OK","message":"Server is running"}`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** > **"Project"**
3. Import: `Sunil-Sagar/construction-project-management`

### Step 2: Configure Frontend Build

1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Step 3: Set Environment Variables

In the **Environment Variables** section, add:

```
VITE_API_URL=https://your-railway-backend-url.railway.app/api
```

**IMPORTANT**: Replace `your-railway-backend-url` with the actual Railway URL from Part 1, Step 3!

### Step 4: Deploy

Click **"Deploy"** - Vercel will build and deploy your frontend.

### Step 5: Configure Custom URL (IMPORTANT!)

1. After deployment completes, go to **Project Settings**
2. Click **"Domains"** tab
3. Add custom domain: `construction-mgmt.vercel.app`
4. Click **"Add"**
5. Vercel will configure it automatically ✅

Your app will be live at: **https://construction-mgmt.vercel.app**

---

## Part 3: Update Backend CORS (If Needed)

If you chose a different custom domain, update `backend/src/server.js`:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-custom-domain.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

Then commit and push - Railway will auto-redeploy.

---

## Part 4: Verify Deployment

### Check Backend
- Health: `https://your-railway-url.railway.app/api/health`
- Sites: `https://your-railway-url.railway.app/api/sites`

### Check Frontend
- Visit: `https://construction-mgmt.vercel.app`
- Test creating a site, adding milestones, logging WIP

---

## Troubleshooting

### CORS Errors
- Verify backend CORS includes your Vercel domain
- Check `VITE_API_URL` in Vercel environment variables

### Database Not Persisting
- Railway automatically provisions persistent storage
- Check Railway logs: Dashboard > Service > Deployments > Logs

### Build Failures
- **Frontend**: Check if all dependencies are in package.json
- **Backend**: Verify Node version compatibility (Railway uses Node 18+)

---

## Cost Breakdown

- **Railway**: $0 (Free tier: 512MB RAM, shared CPU, persistent storage)
- **Vercel**: $0 (Free tier: Unlimited deployments, custom vercel.app domains)
- **Total**: $0/month 🎉

---

## Custom Domain (Optional)

Want to use your own domain like `myproject.com`?

1. **Vercel**: Settings > Domains > Add your domain
2. Update DNS records as instructed by Vercel
3. Update backend CORS to include new domain

---

## Continuous Deployment

Both Railway and Vercel are connected to your GitHub repo:
- Push to `main` branch → Both auto-deploy! 🚀

---

## Next Steps

1. ✅ Follow Part 1 and Part 2 above
2. Test all features on production
3. Monitor Railway logs for any errors
4. Set up database backups (Railway Dashboard)

Need help? Review the logs:
- Railway: Dashboard > Service > Deployments > View Logs
- Vercel: Dashboard > Project > Deployments > View Function Logs
