# 🚀 Vercel Deployment Guide: Integrated Lookup Toolkit

This repository is pre-configured for a **Unified Single-Project Full-Stack Deployment** on [Vercel](https://vercel.com).

- **Frontend:** React + Vite SPA built to `frontend/dist` with automatic client-side routing.
- **Backend:** Express API deployed as a high-performance Vercel Serverless Function via [`/api/index.js`](file:///c:/Users/Technohacks%20PC%20%2007/Desktop/integrated%20lookup%20toolkit%201/api/index.js).
- **Same-Origin Architecture:** Frontend and Backend share the same domain (`https://your-project.vercel.app`), eliminating CORS issues and proxy configuration.

---

## 📋 Required Environment Variables

Before deploying, make sure you have these environment variables ready to paste into the Vercel dashboard:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase PostgreSQL Connection String (Pooler or Direct) | `postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `SUPABASE_URL` | Supabase Project API URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional)* Supabase Service Role Key | |
| `VIRUSTOTAL_API_KEY` | VirusTotal Threat Intelligence API Key | *(Your 64-character VT API Key)* |
| `ADMIN_SECRET_KEY` | Passkey required to register SOC Administrators or reset passwords | `ADMIN2026` |
| `NODE_ENV` | Environment mode | `production` |

> [!NOTE]
> All keys can be copied from your local [`backend/.env`](file:///c:/Users/Technohacks%20PC%20%2007/Desktop/integrated%20lookup%20toolkit%201/backend/.env).

---

## 🛠️ Method 1: Deploy via GitHub & Vercel Dashboard (Recommended)

### Step 1: Push Project to GitHub
Initialize and push this directory to your GitHub account:
```powershell
git add .
git commit -m "feat: configure unified vercel serverless deployment"
git push origin main
```

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository: `integrated-lookup-toolkit`.

### Step 3: Configure Project Settings
In the Vercel deployment setup screen:
- **Framework Preset:** `Other` (or `Vite`)
- **Root Directory:** `./` *(leave default)*
- **Build & Development Settings:**
  - **Build Command:** `npm run vercel-build` *(or toggle override: `npm run build`)*
  - **Output Directory:** `frontend/dist`
  - **Install Command:** *(leave default)*

### Step 4: Add Environment Variables
Scroll to **Environment Variables** and add each variable from the table above:
- `DATABASE_URL`
- `SUPABASE_URL`
- `VIRUSTOTAL_API_KEY`
- `ADMIN_SECRET_KEY`
- `NODE_ENV` = `production`

### Step 5: Click Deploy
Click **Deploy**. Vercel will:
1. Install dependencies for both frontend and backend.
2. Build the production React bundle into `frontend/dist`.
3. Package the Express API into a serverless function (`/api/*`).
4. Generate your live URL: `https://<your-project>.vercel.app`.

---

## 💻 Method 2: Deploy via Vercel CLI (Direct from Terminal)

If you prefer deploying directly from your PowerShell terminal:

### Step 1: Install & Link Vercel CLI
```powershell
npx vercel
```
- When asked `Set up and deploy?`, press `Y`.
- Which scope? Select your personal or team account.
- Link to existing project? `N`.
- What's your project's name? `integrated-lookup-toolkit` (or press Enter).
- In which directory is your code located? `./` (press Enter).
- Want to modify these settings? `N`.

### Step 2: Add Environment Variables
```powershell
npx vercel env add DATABASE_URL production
npx vercel env add VIRUSTOTAL_API_KEY production
npx vercel env add ADMIN_SECRET_KEY production
npx vercel env add SUPABASE_URL production
```

### Step 3: Deploy to Production
```powershell
npx vercel --prod
```

---

## 🔍 Verification & Health Check

Once deployed, verify that both your frontend and backend APIs are operating:

1. **API Health Endpoint:**
   Navigate to:
   ```text
   https://<your-project>.vercel.app/api/health
   ```
   You should see:
   ```json
   {
     "success": true,
     "status": "online",
     "service": "Integrated Lookup Toolkit API",
     "database": {
       "configured": true,
       "connected": true
     }
   }
   ```

2. **Frontend Application:**
   Navigate to:
   ```text
   https://<your-project>.vercel.app
   ```
   - Test running an **Integrated Lookup** (e.g. `cloudflare.com` or `8.8.8.8`).
   - Sign in with your administrator account at `/login` or create a new SOC Admin at `/signup` using passkey `ADMIN2026`.
