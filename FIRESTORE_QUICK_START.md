# 🚀 SHEF LMS - Firestore Database Quick Setup Guide

## ⚡ 5-Minute Quick Start

### Step 1: Get Firebase Admin Key
```bash
1. Open Firebase Console: https://console.firebase.google.com
2. Select your "Shef LMS" project
3. Go to: Project Settings (gear icon) → Service Accounts tab
4. Click "Generate New Private Key"
5. Save the JSON file as: backend/config/firebase-admin-key.json
```

### Step 2: Install Dependencies
```bash
cd "C:\Users\hp\Desktop\Shef LMS\backend"
npm install
```

### Step 3: Run the Seeding Script
```bash
node scripts/seedFirestore.js
```

**Expected Output:**
```
🔥 Starting SHEF LMS Firestore Database Seeding...

============================================================

📝 Seeding users collection...
  ✅ Created: admin1
  ✅ Created: student1
  📊 Total: 2/2 documents created

📝 Seeding courses collection...
  ✅ Created: course1
  ✅ Created: course2
  📊 Total: 2/2 documents created

... (more collections)

✨ Database seeding completed successfully!

📊 Total documents created: 37

🔐 Test Credentials:
  Admin Email: admin@sheflms.com
  Password: SuperAdmin@123

  Student Email: lqdeleon@gmail.com
  Password: Admin@123

🎉 Happy Learning!
```

### Step 4: Verify in Firebase Console
1. Go to: https://console.firebase.google.com
2. Select your project
3. Click "Firestore Database"
4. You should see all 11 collections with sample data ✅

---

## 📋 Collections Overview

| Collection | Purpose | Documents |
|-----------|---------|-----------|
| **users** | Student & Admin profiles | 2+ (admin, students) |
| **courses** | Course information | 2+ (course details) |
| **modules** | Course modules/sections | 2+ (linked to courses) |
| **lessons** | Individual lessons/classes | 2+ (linked to modules) |
| **projects** | Student capstone projects | 1+ (project descriptions) |
| **assessments** | Quizzes, exams, challenges | 1+ (test content) |
| **jobs** | Job board postings | 2+ (job listings) |
| **mentors** | Mentorship program | 2+ (mentor profiles) |
| **content** | Announcements & featured content | 2+ (announcements) |
| **stats** | Platform statistics | 1 (main stats) |
| **activities** | User activity logs | Auto-populated |

---

## 🔧 Manual Setup (If Script Doesn't Work)

### Create Collections Manually in Firebase Console

#### 1. Create "users" Collection
```javascript
// Document: admin1
{
  name: "Super Admin",
  email: "admin@sheflms.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO.J4m",
  role: "admin",
  status: "active",
  createdAt: 2025-11-01,
  updatedAt: 2025-11-01
}

// Document: student1
{
  name: "Leonardo De Leon",
  email: "lqdeleon@gmail.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWDeBlkxiRlO.J4m",
  role: "student",
  status: "active",
  enrollmentNumber: "SU-2025-001",
  course: "Cyber Security & Ethical Hacking",
  phone: "+1-234-567-8900",
  address: "123 Main St, New York, NY",
  createdAt: 2025-11-07,
  updatedAt: 2025-11-07
}
```

#### 2. Create "courses" Collection
```javascript
// Document: course1
{
  title: "Cyber Security & Ethical Hacking",
  description: "Master cybersecurity fundamentals...",
  duration: "6 months",
  instructor: "John Smith",
  modules: 6,
  price: "$999",
  status: "active",
  enrollmentCount: 1,
  createdAt: 2025-10-15,
  updatedAt: 2025-11-01
}
```

#### 3. Continue with Other Collections
Follow the same pattern for:
- modules
- lessons
- projects
- assessments
- jobs
- mentors
- content
- stats

---

## 📊 Data Flow Diagram

```
Firebase Console
       ↓
Firestore Database
  ├── collections/
  │   ├── users (authentication)
  │   ├── courses (curriculum)
  │   ├── modules (course structure)
  │   ├── lessons (learning content)
  │   ├── projects (student work)
  │   ├── assessments (tests)
  │   ├── jobs (career board)
  │   ├── mentors (mentorship)
  │   ├── content (announcements)
  │   ├── stats (analytics)
  │   └── activities (logging)
       ↓
Backend Server (Node.js)
  ├── /api/auth/login
  ├── /api/auth/register
  ├── /api/students
  ├── /api/courses
  └── ... (all CRUD endpoints)
       ↓
Frontend (React)
  ├── Admin Dashboard
  ├── Student Dashboard
  └── Login Page
```

---

## ✅ Verification Checklist

After seeding, verify each collection exists:

### In Firebase Console:

- [ ] **users** - 2+ documents (admin1, student1)
- [ ] **courses** - 2+ documents 
- [ ] **modules** - 2+ documents with courseId field
- [ ] **lessons** - 2+ documents with moduleId field
- [ ] **projects** - 1+ documents
- [ ] **assessments** - 1+ documents
- [ ] **jobs** - 2+ documents
- [ ] **mentors** - 2+ documents
- [ ] **content** - 2+ documents
- [ ] **stats** - 1 main document
- [ ] **activities** - Empty initially (logs real user activity)

---

## 🔐 Security Rules

After creating collections, update security rules:

1. Go to Firestore Database → **Rules** tab
2. Replace with (see FIRESTORE_SETUP_GUIDE.md for full rules)

**Key Points:**
- Students can only read their own data
- Admins can read and write all data
- Public collections (courses, jobs, mentors) readable by authenticated users
- Activities only editable by system

---

## 🧪 Testing the Setup

### Test 1: Verify Collections Exist
```bash
# In Firebase Console
1. Navigate to Firestore Database
2. Check Data tab
3. Should see 11 collections listed
```

### Test 2: Test Login
```bash
1. Start frontend: cd frontend && npm start
2. Go to http://localhost:3000
3. Login with:
   - Email: admin@sheflms.com
   - Password: SuperAdmin@123
4. You should see Admin Dashboard
```

### Test 3: Check Student Login
```bash
1. Go to http://localhost:3000/login
2. Login with:
   - Email: lqdeleon@gmail.com
   - Password: Admin@123
3. You should see Student Dashboard
```

### Test 4: Verify Data in Backend
```bash
# Query Firestore via backend
const usersRes = await firebaseService.getAll('users');
console.log(usersRes.data); // Should return user list
```

---

## 📱 Next Steps After Setup

### 1. Backend Configuration
```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY=your-private-key
# etc.

# Start backend
npm start
```

### 2. Frontend Configuration
```bash
cd frontend

# Copy environment template
cp .env.example .env.production

# Edit with your Firebase config
# REACT_APP_FIREBASE_API_KEY=your-api-key
# etc.

# Start frontend
npm start
```

### 3. Test Admin Features
```
1. Login as admin
2. Navigate to Admin Dashboard
3. Try:
   - View all students
   - Create new student (see IP address tracking)
   - Edit course information
   - View Analytics Dashboard
   - Create announcements
```

### 4. Test Student Features
```
1. Login as student
2. Navigate to Student Dashboard
3. Try:
   - View enrolled course
   - Watch lessons
   - Take assessments
   - View job board
   - Browse mentors
   - Request mentorship
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
cd backend
npm install firebase-admin
```

### Error: "firebase-admin-key.json not found"
```bash
# Follow Step 1 above to generate and save the key
```

### Error: "Permission denied" in Firestore
```bash
# Update Security Rules in Firebase Console
# (See FIRESTORE_SETUP_GUIDE.md)
```

### Error: "User document not found"
```bash
# Run seeding script again:
node scripts/seedFirestore.js

# Or manually add admin document in Firebase Console
```

### Data Not Showing in Frontend
```bash
1. Check backend is running: http://localhost:5000/api/auth
2. Check frontend API URL in .env
3. Check browser console for errors (F12)
4. Check Firestore security rules
```

---

## 📖 Complete Documentation

For detailed information, see:
- **FIRESTORE_SETUP_GUIDE.md** - Complete setup with field descriptions
- **firestore-sample-data.json** - All sample data in JSON format
- **backend/scripts/seedFirestore.js** - Automated seeding script

---

## 🎯 Database Schema Overview

### users
```
{
  name: string,
  email: string (unique),
  password: string (hashed),
  role: 'student' | 'admin',
  status: 'active' | 'inactive' | 'graduated' | 'suspended',
  enrollmentNumber: string,
  phone: string,
  address: string,
  course: string,
  lastLogin: {
    ipAddress: string,
    city: string,
    country: string,
    timestamp: date
  },
  createdAt: date,
  updatedAt: date
}
```

### courses
```
{
  title: string,
  description: string,
  duration: string,
  instructor: string,
  modules: number,
  price: string,
  status: 'active' | 'inactive' | 'coming-soon',
  enrollmentCount: number,
  createdAt: date,
  updatedAt: date
}
```

### modules
```
{
  name: string,
  courseId: string (reference),
  description: string,
  duration: string,
  lessons: number,
  order: number,
  status: 'active' | 'inactive',
  createdAt: date,
  updatedAt: date
}
```

*Continue for other collections as described in FIRESTORE_SETUP_GUIDE.md*

---

## 🚀 Deployment Ready Checklist

Before deploying to production:

- [ ] All 11 collections created
- [ ] Sample data populated
- [ ] Security Rules configured
- [ ] Admin account created
- [ ] Sample students created
- [ ] IP tracking working
- [ ] Toast notifications working
- [ ] Analytics dashboard tested
- [ ] All CRUD operations working
- [ ] Login/logout functional
- [ ] Responsive design verified
- [ ] Environment variables set
- [ ] Firebase billing enabled

---

## 💡 Tips & Best Practices

✅ **DO:**
- Back up your Firestore data regularly
- Use collections for organizing data
- Create indexes for frequently queried fields
- Use security rules to protect sensitive data
- Monitor Firestore usage in Firebase Console

❌ **DON'T:**
- Store plain text passwords (always hash!)
- Query entire collections (use pagination)
- Allow unrestricted write access
- Store sensitive data in activities log
- Commit .env files with secrets to Git

---

## 🎉 Success!

Your SHEF LMS Firestore database is now configured and ready to go!

**Quick Commands:**
```bash
# Seed database
node backend/scripts/seedFirestore.js

# Start backend
cd backend && npm start

# Start frontend (in new terminal)
cd frontend && npm start

# Login
- Admin: admin@sheflms.com / SuperAdmin@123
- Student: lqdeleon@gmail.com / Admin@123
```

---

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** ✅ Production Ready
