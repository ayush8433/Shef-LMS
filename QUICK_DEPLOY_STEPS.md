# ⚡ Quick Deployment Steps for learnwithshef.com

## 🎯 Fastest Path to Production (30 minutes)

### Before You Start
You need accounts on:
- ✅ Firebase (free): https://console.firebase.google.com
- ✅ Render.com (free): https://render.com
- ✅ Vercel (free): https://vercel.com
- ✅ Your domain registrar (to configure DNS)

---

## Step 1: Firebase Setup (10 minutes)

### Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project" → Name: `shef-lms-production`
3. Create project

### Enable Services
1. **Firestore Database**
   - Click "Create database" → Production mode → Enable
   
2. **Authentication**
   - Click "Get Started" → Enable "Email/Password" → Save

### Get Credentials
1. **For Frontend:**
   - Project Settings → Your apps → Add Web App
   - Copy the `firebaseConfig` values
   - Save these 6 values: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId

2. **For Backend:**
   - Project Settings → Service Accounts → Generate new private key
   - Download JSON file
   - Extract: project_id, private_key, client_email

---

## Step 2: Backend Deployment on Render (10 minutes)

1. **Go to** https://render.com → Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub: `Abhi1727/Shef-LMS`
   - Name: `shef-lms-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Choose: **Free tier**

3. **Add Environment Variables** (Click "Advanced"):
   ```
   NODE_ENV=production
   PORT=5000
   FIREBASE_PROJECT_ID=<from Firebase JSON>
   FIREBASE_PRIVATE_KEY=<from Firebase JSON - replace \n with actual newlines>
   FIREBASE_CLIENT_EMAIL=<from Firebase JSON>
   JWT_SECRET=<generate random string 32+ chars>
   ALLOWED_ORIGINS=https://learnwithshef.com
   ```

4. **Deploy** → Wait 3-5 minutes

5. **Copy Backend URL**: `https://shef-lms-backend.onrender.com` (or similar)

---

## Step 3: Frontend Deployment on Vercel (10 minutes)

### Option A: Via Vercel Website (Easiest)

1. **Go to** https://vercel.com → Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import `Abhi1727/Shef-LMS`
   - Root Directory: `frontend`
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Add Environment Variables**:
   ```
   REACT_APP_FIREBASE_API_KEY=<from Step 1>
   REACT_APP_FIREBASE_AUTH_DOMAIN=<from Step 1>
   REACT_APP_FIREBASE_PROJECT_ID=<from Step 1>
   REACT_APP_FIREBASE_STORAGE_BUCKET=<from Step 1>
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<from Step 1>
   REACT_APP_FIREBASE_APP_ID=<from Step 1>
   REACT_APP_API_URL=<Backend URL from Step 2>
   REACT_APP_NAME=SHEF LMS
   ```

4. **Deploy** → Wait 2-3 minutes

### Option B: Via CLI (From this server)

```bash
cd /root/Shef-LMS/frontend

# Create .env.production with values from Step 1 & 2
nano .env.production

# Run deployment script
cd ..
./deploy-frontend.sh
```

---

## Step 4: Connect Custom Domain (5 minutes)

### On Vercel Dashboard
1. Select your project → Settings → Domains
2. Add domain: `learnwithshef.com`
3. Add domain: `www.learnwithshef.com`

### On Your Domain Registrar
Add these DNS records:

**For learnwithshef.com:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www.learnwithshef.com:**
```
Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Wait:** DNS propagation takes 5-30 minutes. SSL auto-provisions.

---

## Step 5: Final Configuration (5 minutes)

### Update Backend CORS
1. Go to Render.com → Your service → Environment
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://learnwithshef.com,https://www.learnwithshef.com
   ```
3. Redeploy

### Create Admin User
1. Visit https://learnwithshef.com
2. Register with: `admin@learnwithshef.com`
3. Go to Firebase Console → Firestore → users collection
4. Find your user document → Edit → Change `role` to `admin`

### Add Sample Data (Optional)
Use Firebase Console to add:
- Courses
- Modules  
- Lessons

---

## ✅ Testing Your Live Site

Visit: https://learnwithshef.com

Test:
- ✅ Site loads with HTTPS (secure)
- ✅ Login page works
- ✅ Can register new user
- ✅ Dashboard displays
- ✅ Responsive on mobile
- ✅ No console errors (F12)

---

## 🎉 You're Live!

Your LMS is now running at:
- **Main Site:** https://learnwithshef.com
- **API:** https://shef-lms-backend.onrender.com

---

## 📊 Monitoring

### Check Logs
- **Frontend:** Vercel Dashboard → Logs
- **Backend:** Render Dashboard → Logs
- **Database:** Firebase Console → Firestore

### Performance
- **Vercel Analytics:** Automatic
- **Render Metrics:** Dashboard
- **Firebase Usage:** Console → Usage tab

---

## 🆘 Common Issues

### "CORS error"
- Update ALLOWED_ORIGINS on backend
- Redeploy backend on Render

### "Firebase auth error"  
- Check all 6 Firebase env vars are correct
- Verify Authentication is enabled in Firebase

### "API not responding"
- Check backend is running on Render
- Test directly: `https://your-backend.onrender.com/health`

### "Build failed"
- Check Vercel build logs
- Ensure all env vars are set
- Verify no syntax errors

---

## 💰 Cost Estimate

**FREE TIER (Perfect for testing/small projects):**
- Firebase: Free (up to 50K reads/day)
- Render: Free (sleeps after 15min inactivity)
- Vercel: Free (100GB bandwidth/month)

**TOTAL: $0/month** for moderate usage

**When to upgrade:**
- Render: $7/month (always-on, no sleep)
- Firebase: Pay-as-you-go (cents per day for small usage)
- Vercel: $20/month (more bandwidth + analytics)

---

## 📚 Resources

- **Full Guide:** `PRODUCTION_DEPLOYMENT.md`
- **Firebase Docs:** https://firebase.google.com/docs
- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

**Need help?** Check the detailed `PRODUCTION_DEPLOYMENT.md` file!
