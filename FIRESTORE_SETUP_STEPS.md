# 🎯 SHEF LMS - Firestore Setup: 4 Files Step-by-Step Guide

You have 4 key files. Here's exactly what to do with each one:

---

## 📋 The 4 Files Explained

| File | Purpose | What to Do |
|------|---------|-----------|
| **firestore-sample-data.json** | Contains all sample data for 11 collections | Use this to populate your database |
| **FIREBASE_SETUP_GUIDE.md** | Detailed setup instructions & collection schema | Reference guide for field definitions |
| **FIRESTORE_SETUP_GUIDE.md** | Complete collection structure documentation | Reference for all collection fields |
| **FIRESTORE_QUICK_START.md** | Automated script instructions | Follow this for fastest setup |

---

## ✅ STEP-BY-STEP SETUP (Do This Now)

### **STEP 1: Create Firebase Project** (2 minutes)
```
1. Go to: https://console.firebase.google.com
2. Click "Add Project"
3. Name it: "shef-lms"
4. Click "Create Project"
5. Wait for it to complete (3-5 minutes)
```

### **STEP 2: Enable Firestore Database** (3 minutes)
```
1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Choose: "Production mode"
4. Select location: "us-central1" (or nearest to you)
5. Click "Enable"
6. Wait for database to be ready ✅
```

### **STEP 3: Create Service Account Key** (2 minutes)
```
1. Click ⚙️ (gear icon) → Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate New Private Key"
4. Save file as: backend/config/firebase-admin-key.json
5. ✅ Keep this file secret! Never commit to Git
```

### **STEP 4: Create Collections** (5 minutes - Choose One Method)

#### **METHOD A: Using Automated Script (RECOMMENDED - 2 minutes)**

```bash
# 1. Open Terminal, navigate to backend
cd "C:\Users\hp\Desktop\Shef LMS\backend"

# 2. Install dependencies
npm install

# 3. Run seeding script
node scripts/seedFirestore.js

# ✅ Script will create all 11 collections with sample data!
```

**Expected output:**
```
🔥 Starting SHEF LMS Firestore Database Seeding...
📝 Seeding users collection...
  ✅ Created: admin1
  ✅ Created: student1
📝 Seeding courses collection...
  ✅ Created: course1
... (more collections)
✨ Database seeding completed successfully!
```

---

#### **METHOD B: Manual Creation Using Firebase Console (5 minutes)**

If script doesn't work, create manually:

**1. Create "users" Collection**
```
1. In Firebase Console → Firestore Database → Data tab
2. Click "+ Start collection"
3. Name: "users"
4. Add document "admin1" with fields:
   {
     name: "Super Admin"
     email: "admin@sheflms.com"
     password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO.J4m"
     role: "admin"
     status: "active"
     createdAt: (set to current date)
   }
```

**2. Create Other Collections**
- "courses" 
- "modules"
- "lessons"
- "projects"
- "assessments"
- "jobs"
- "mentors"
- "content"
- "stats"
- "activities"

(Copy field structure from firestore-sample-data.json)

---

### **STEP 5: Get Firebase Config** (2 minutes)
```
1. In Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click Web icon (</>)
4. Copy the config object
5. Save it for next step
```

Example config:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "shef-lms.firebaseapp.com",
  projectId: "shef-lms-production",
  storageBucket: "shef-lms-production.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
}
```

### **STEP 6: Update Frontend Config** (2 minutes)
```
1. Open: frontend/src/firebase/config.js
2. Replace firebaseConfig with your config from Step 5
3. Save file
4. ✅ Frontend ready!
```

### **STEP 7: Update Backend Config** (2 minutes)
```
1. Create backend/.env file with:

PORT=5000
NODE_ENV=development
JWT_SECRET=shef_lms_secret_key_2025
FIREBASE_PROJECT_ID=shef-lms
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-admin-key.json

2. Make sure firebase-admin-key.json is in backend/config/ folder
3. ✅ Backend ready!
```

### **STEP 8: Test the Setup** (5 minutes)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
# Should show: "Server is running on port 5000"
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
# Should open http://localhost:3000 in browser
```

**Test Login:**
```
Admin Login:
- Email: admin@sheflms.com
- Password: SuperAdmin@123
- Expected: Admin Dashboard with all charts and IP tracking

Student Login:
- Email: lqdeleon@gmail.com
- Password: Admin@123
- Expected: Student Dashboard with course learning
```

---

## 🎯 Verify Collections in Firebase Console

After setup, go to Firebase Console → Firestore Database → Data tab

You should see all 11 collections:

✅ **users** - Admin and student profiles
✅ **courses** - Cyber Security course details
✅ **modules** - 6 course modules
✅ **lessons** - Course lessons with video links
✅ **projects** - Capstone projects
✅ **assessments** - Practice tests and challenges
✅ **jobs** - Job board listings
✅ **mentors** - Mentor profiles
✅ **content** - Announcements
✅ **stats** - Platform statistics
✅ **activities** - Activity logs

---

## 📊 Sample Data Breakdown

### **firestore-sample-data.json** Contains:

1. **2 Users:**
   - 1 Admin (admin@sheflms.com)
   - 1 Student (lqdeleon@gmail.com)

2. **2 Courses:**
   - Cyber Security & Ethical Hacking (6 months)
   - Advanced Network Security (8 weeks)

3. **6 Modules:**
   - Fundamentals
   - Network Security
   - Application Security
   - Incident Response
   - Compliance & Governance
   - Capstone Project

4. **15 Lessons:**
   - Each with video links and class meeting links
   - Practical content and resources

5. **2 Projects:**
   - Security Lab Project
   - Capstone: Enterprise Security Audit

6. **3 Assessments:**
   - Security Fundamentals Quiz
   - Network Security Exam
   - CEH Practice Test

7. **3 Jobs:**
   - Security Analyst at TechCorp
   - Penetration Tester at SecureInc
   - SOC Analyst at CyberDefense

8. **2 Mentors:**
   - John Smith (Security Architect)
   - Sarah Johnson (CEO at SecureInc)

9. **2 Announcements:**
   - Welcome announcement
   - Feature update

10. **1 Stats Document:**
    - Total students, courses, completion rates

11. **Activities:**
    - Auto-populated when users login/interact

---

## 🚀 Quick Reference Checklist

- [ ] Created Firebase Project
- [ ] Enabled Firestore Database
- [ ] Generated Service Account Key
- [ ] Downloaded firebase-admin-key.json to backend/config/
- [ ] Ran seeding script OR created collections manually
- [ ] Updated frontend/src/firebase/config.js with Firebase config
- [ ] Created backend/.env with credentials
- [ ] Started backend server (npm start in backend)
- [ ] Started frontend server (npm start in frontend)
- [ ] Tested admin login
- [ ] Tested student login
- [ ] Verified 11 collections in Firebase Console
- [ ] Checked sample data is present

---

## 🐛 Troubleshooting

### **Error: "Cannot find module 'firebase-admin'"**
```bash
cd backend
npm install firebase-admin
```

### **Error: "GOOGLE_APPLICATION_CREDENTIALS not found"**
```
1. Make sure firebase-admin-key.json is in: backend/config/
2. Check backend/.env has correct path
3. Restart backend server
```

### **Error: "Permission denied" in Firestore**
```
1. Go to Firebase Console → Firestore → Rules tab
2. Replace with these rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

3. Publish rules
```

### **Collections not showing in Firebase Console**
```
1. Click "Refresh" button in Firebase Console
2. Make sure you're in right project (check top-left)
3. Go to Data tab in Firestore Database
4. If still empty, run seeding script again
```

### **Login not working**
```
1. Check backend is running: http://localhost:5000
2. Check frontend .env has correct API URL
3. Check Firebase config is correct
4. Look at browser console for errors (F12)
5. Check user exists in Firebase (email case-sensitive)
```

---

## 📁 File Structure After Setup

```
Shef LMS/
├── backend/
│   ├── config/
│   │   └── firebase-admin-key.json ✅ (Download from Firebase)
│   ├── .env ✅ (Create with credentials)
│   ├── server.js
│   ├── routes/
│   │   └── auth.js
│   └── scripts/
│       └── seedFirestore.js ✅ (Run this)
├── frontend/
│   ├── src/
│   │   └── firebase/
│   │       └── config.js ✅ (Update with Firebase config)
│   ├── .env
│   └── package.json
├── firestore-sample-data.json ✅ (Reference)
├── FIREBASE_SETUP_GUIDE.md ✅ (Reference)
├── FIRESTORE_SETUP_GUIDE.md ✅ (Reference)
└── FIRESTORE_QUICK_START.md ✅ (Reference)
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Backend server starts without errors
✅ Frontend loads at http://localhost:3000
✅ Admin can login and see Admin Dashboard
✅ Student can login and see Student Dashboard
✅ Analytics charts display correctly
✅ 11 collections visible in Firebase Console
✅ Sample data is populated in collections
✅ IP address shows when logged in

---

## 📞 Quick Commands Reference

```bash
# Navigate to project
cd "C:\Users\hp\Desktop\Shef LMS"

# Setup backend
cd backend
npm install
npm start

# Setup frontend (in new terminal)
cd frontend
npm install
npm start

# Seed database
cd backend
node scripts/seedFirestore.js

# Check if ports are free
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

---

## 🎯 Next Steps After Setup

1. ✅ **Test all admin features:**
   - Create new student
   - Edit student info
   - View IP address info
   - Check Analytics Dashboard

2. ✅ **Test student features:**
   - View courses
   - Browse lessons
   - View job board
   - Request mentorship

3. ✅ **Deploy to production:**
   - Follow DEPLOYMENT_GUIDE.md
   - Use Vercel for frontend
   - Use Heroku for backend

---

## 📖 Reference Files

| File | When to Use |
|------|-----------|
| firestore-sample-data.json | To see all sample data structure |
| FIREBASE_SETUP_GUIDE.md | For detailed Firebase configuration |
| FIRESTORE_SETUP_GUIDE.md | For all collection field definitions |
| FIRESTORE_QUICK_START.md | For fastest 5-minute setup |
| DEPLOYMENT_GUIDE.md | When ready to deploy to production |

---

**Version:** 1.0  
**Updated:** November 17, 2025  
**Status:** ✅ Ready to Use

**Start with STEP 1 and follow sequentially. You'll have everything running in 30 minutes!** 🚀
