# 🚀 Production Deployment Guide for learnwithshef.com

## Prerequisites Checklist
- [ ] Firebase project created
- [ ] Domain `learnwithshef.com` DNS access
- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Render.com account (free tier works)

---

## Step 1: Firebase Setup (Required First!)

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name: `shef-lms-production`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firestore Database
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose **Production mode**
4. Select location: **us-central1** (or nearest)
5. Click "Enable"

### 1.3 Set Firestore Security Rules
Go to Firestore → Rules tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /enrollments/{enrollmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /modules/{moduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /lessons/{lessonId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 1.4 Enable Authentication
1. Firebase Console → Authentication
2. Click "Get Started"
3. Enable "Email/Password" sign-in method
4. Save

### 1.5 Get Firebase Web Config
1. Project Settings (gear icon) → General
2. Scroll to "Your apps" → Click Web icon (</>)
3. Register app name: `SHEF LMS Web`
4. **Copy the firebaseConfig object** - you'll need these values:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### 1.6 Generate Admin SDK Key (For Backend)
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file (KEEP IT SECURE!)
4. Extract these values from the JSON:
   - `project_id` → FIREBASE_PROJECT_ID
   - `private_key` → FIREBASE_PRIVATE_KEY
   - `client_email` → FIREBASE_CLIENT_EMAIL

---

## Step 2: Deploy Backend to Render.com

### 2.1 Push Code to GitHub (if not already)
```bash
cd /root/Shef-LMS
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2.2 Deploy on Render.com
1. Go to https://render.com → Sign up/Login
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select repository: `Abhi1727/Shef-LMS`
5. Configure:
   - **Name:** `shef-lms-backend`
   - **Region:** Oregon (US West) or nearest
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### 2.3 Add Environment Variables in Render
Click "Advanced" → Add Environment Variables:

```
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your-project-id-from-firebase
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
JWT_SECRET=your_random_secure_jwt_secret_min_32_chars
JWT_EXPIRE=7d
ALLOWED_ORIGINS=https://learnwithshef.com,https://www.learnwithshef.com
FRONTEND_URL=https://learnwithshef.com
```

**Important:** For FIREBASE_PRIVATE_KEY, replace actual newlines with `\n`

### 2.4 Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for deployment
- Copy your backend URL: `https://shef-lms-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Production Environment File
Create `frontend/.env.production`:

```bash
# Use your Firebase config values from Step 1.5
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=shef-lms-production.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=shef-lms-production
REACT_APP_FIREBASE_STORAGE_BUCKET=shef-lms-production.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Use your Render backend URL from Step 2.4
REACT_APP_API_URL=https://shef-lms-backend.onrender.com

REACT_APP_NAME=SHEF LMS
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
```

### 3.2 Deploy via Vercel CLI
```bash
cd /root/Shef-LMS/frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: shef-lms
# - Directory: ./ (current directory)
# - Build settings: Auto-detected (Create React App)
```

### 3.3 Add Environment Variables in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add all `REACT_APP_*` variables from `.env.production`
4. Redeploy if needed

### 3.4 Configure Custom Domain
1. Vercel Dashboard → Settings → Domains
2. Add domain: `learnwithshef.com`
3. Add domain: `www.learnwithshef.com`
4. Vercel will show DNS records to add

### 3.5 Update DNS Records (at your domain registrar)
Add these records:

**For root domain (learnwithshef.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**SSL Certificate:** Vercel automatically provisions SSL (takes 1-2 minutes)

---

## Step 4: Update Backend CORS

Once frontend is live, update backend environment on Render:
```
ALLOWED_ORIGINS=https://learnwithshef.com,https://www.learnwithshef.com
```

Redeploy backend on Render.

---

## Step 5: Post-Deployment Testing

### 5.1 Test Checklist
- [ ] Visit https://learnwithshef.com
- [ ] SSL certificate shows secure (🔒)
- [ ] Login page loads
- [ ] Register new user
- [ ] Login with test user
- [ ] Dashboard loads with data
- [ ] Courses display correctly
- [ ] Mobile responsive works
- [ ] Check browser console for errors

### 5.2 Create Admin User
1. Go to Firebase Console → Firestore
2. Add document to `users` collection:
   ```json
   {
     "email": "admin@learnwithshef.com",
     "name": "Admin User",
     "role": "admin",
     "status": "active",
     "createdAt": "2025-01-15T00:00:00.000Z"
   }
   ```
3. Login with this email and set password

### 5.3 Add Sample Data
Use Firebase Console to add:
- 3-5 courses
- Modules and lessons
- Sample content

---

## Step 6: Monitoring Setup

### 6.1 Vercel Analytics
- Automatically enabled on Vercel
- View in Dashboard → Analytics

### 6.2 Render Monitoring
- View logs: Render Dashboard → Logs
- Set up alerts for downtime

### 6.3 Firebase Monitoring
- Firebase Console → Performance
- Firebase Console → Analytics

---

## 🎉 Deployment Complete!

Your LMS is now live at:
- **Frontend:** https://learnwithshef.com
- **Backend API:** https://shef-lms-backend.onrender.com
- **Admin Panel:** https://learnwithshef.com/admin

---

## Troubleshooting

### Frontend not loading?
- Check Vercel build logs
- Verify environment variables
- Check browser console for errors

### Backend API errors?
- Check Render logs
- Verify Firebase credentials
- Test API endpoint directly

### CORS errors?
- Update ALLOWED_ORIGINS on backend
- Redeploy backend after changes

### Firebase authentication failing?
- Check Firebase config values
- Verify authentication is enabled
- Check Firestore security rules

---

## Alternative: Quick Deploy with Railway (All-in-One)

If you prefer deploying both frontend and backend together:

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Connect Abhi1727/Shef-LMS
4. Railway auto-detects both frontend/backend
5. Add environment variables
6. Connect custom domain

---

## Need Help?
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Firebase Docs: https://firebase.google.com/docs
