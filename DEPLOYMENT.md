# IntelliReviewAI Deployment Guide

This guide will help you deploy the application permanently for **FREE** using:
- **Frontend**: Vercel (free) → `yourapp.vercel.app`
- **Backend**: Render (free) → `yourapp.onrender.com`

---

## 📋 Prerequisites

1. A GitHub account (to host your code)
2. A [Vercel account](https://vercel.com) (sign up with GitHub - free)
3. A [Render account](https://render.com) (sign up with GitHub - free)

---

## 🔧 Step 1: Push Code to GitHub

If your code is not already on GitHub:

```bash
cd "d:\My Version\IntelliReviewAI1.0"
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/IntelliReviewAI.git
git push -u origin main
```

If you don't have a repository yet, create one on GitHub first.

---

## 🚀 Step 2: Deploy Backend on Render (FREE)

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account

### 2.2 Create New Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `intellireview-api` |
| **Root Directory** | `mandi-mcp` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 2.3 Add Environment Variables
In the Render dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | `AIzaSyCkXCQUXMwhHzLL1_oyeXB0cuYMzd6r5S4` |
| `DATA_GOV_API_KEY` | `579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b` |
| `DATA_GOV_RESOURCE_ID` | `9ef84268-d588-465a-a308-a864a43d0070` |

### 2.4 Deploy
Click **"Create Web Service"** and wait for deployment (takes 2-5 minutes).

Your backend URL will be something like:
```
https://intellireview-api.onrender.com
```

**⚠️ Note:** Copy this URL - you'll need it for the frontend!

---

## 🌐 Step 3: Deploy Frontend on Vercel (FREE)

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account

### 3.2 Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Vercel will auto-detect it's a Vite project

### 3.3 Configure Build Settings
| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.4 Add Environment Variables
Add this environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://intellireview-api.onrender.com` |
| `VITE_GEMINI_API_KEY` | `AIzaSyCkXCQUXMwhHzLL1_oyeXB0cuYMzd6r5S4` |

**⚠️ Important:** Replace the API URL with your actual Render backend URL from Step 2.4!

### 3.5 Deploy
Click **"Deploy"** and wait for deployment (takes 1-2 minutes).

Your frontend URL will be something like:
```
https://intellireview-ai.vercel.app
```

---

## ✅ Step 4: Verify Deployment

1. Open your Vercel frontend URL
2. Test the Mandi Dashboard features
3. Verify weather, price data, and AI advice work

---

## 🔄 Automatic Updates

Both Vercel and Render will automatically redeploy when you push changes to GitHub:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Server sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- 750 hours/month free

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Always-on (no sleep)

### Keeping Backend Awake (Optional)

To prevent cold starts, you can set up a free cron job to ping your backend:
1. Go to [cron-job.org](https://cron-job.org)
2. Create account (free)
3. Add new cron job:
   - URL: `https://intellireview-api.onrender.com/`
   - Schedule: Every 10 minutes

---

## 🔧 Troubleshooting

### Backend Not Starting
- Check Render logs for errors
- Verify environment variables are set correctly
- Make sure `requirements.txt` includes all dependencies

### Frontend Not Connecting to Backend
- Verify `VITE_API_URL` is set correctly in Vercel
- Check browser console for CORS errors
- Verify backend is running (visit backend URL directly)

### CORS Errors
The backend already has CORS enabled for all origins. If issues persist:
1. Check backend is running
2. Verify URL is correct (https, not http)

---

## 📱 Your Live URLs

After deployment, your apps will be available at:

| Service | URL |
|---------|-----|
| **Frontend** | `https://YOUR-APP.vercel.app` |
| **Backend** | `https://YOUR-API.onrender.com` |
| **API Docs** | `https://YOUR-API.onrender.com/docs` |

---

## 🎉 Congratulations!

Your IntelliReviewAI application is now permanently deployed and accessible worldwide!
