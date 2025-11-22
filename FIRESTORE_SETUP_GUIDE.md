# 🔥 Firestore Database Setup Guide for SHEF LMS

## Overview
This guide will help you set up all Firestore collections needed for the SHEF LMS platform. Follow the steps below to create each collection and configure security rules.

---

## 📋 Collections to Create

### 1. **users** - Student and Admin Profiles
**Fields:**
- `name` (String) - Full name
- `email` (String) - Email address (unique)
- `password` (String) - Hashed password (bcryptjs)
- `role` (String) - 'student' or 'admin'
- `status` (String) - 'active', 'inactive', 'graduated', 'suspended'
- `enrollmentNumber` (String) - Unique enrollment ID
- `phone` (String) - Phone number
- `address` (String) - Address
- `course` (String) - Current course name
- `enrollmentDate` (Timestamp) - When user enrolled
- `lastLogin` (Map) - { ipAddress, city, country, isp, timestamp }
- `lastLoginIP` (String) - Last login IP address
- `lastLoginTimestamp` (Timestamp) - Last login time
- `createdAt` (Timestamp) - Account creation date
- `updatedAt` (Timestamp) - Last update date

### 2. **courses** - Course Information
**Fields:**
- `title` (String) - Course name
- `description` (String) - Course description
- `duration` (String) - Duration (e.g., "6 months")
- `instructor` (String) - Instructor name
- `modules` (Number) - Number of modules
- `price` (String) - Course price
- `status` (String) - 'active', 'inactive', 'coming-soon'
- `startDate` (Timestamp) - Course start date
- `enrollmentCount` (Number) - Number of enrolled students
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 3. **modules** - Course Modules
**Fields:**
- `name` (String) - Module name
- `courseId` (String) - Reference to course
- `description` (String) - Module description
- `duration` (String) - Duration (e.g., "4 weeks")
- `lessons` (Number) - Number of lessons
- `order` (Number) - Sequence order
- `status` (String) - 'active', 'inactive'
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 4. **lessons** - Individual Lessons
**Fields:**
- `title` (String) - Lesson title
- `moduleId` (String) - Reference to module
- `content` (String) - Lesson content/description
- `duration` (String) - Duration (e.g., "45 min")
- `videoUrl` (String) - YouTube/Vimeo video link
- `classLink` (String) - Zoom/Google Meet class link
- `resources` (String) - Additional resources
- `order` (Number) - Sequence order
- `status` (String) - 'active', 'inactive'
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 5. **projects** - Student Projects/Capstone
**Fields:**
- `title` (String) - Project name
- `description` (String) - Project description
- `difficulty` (String) - 'Easy', 'Intermediate', 'Hard'
- `duration` (String) - Duration to complete
- `skills` (Array) - Required skills
- `requirements` (String) - Project requirements
- `deliverables` (String) - What students must submit
- `status` (String) - 'active', 'inactive'
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 6. **assessments** - Quizzes and Exams
**Fields:**
- `title` (String) - Assessment title
- `description` (String) - Assessment description
- `questions` (Number) - Number of questions
- `duration` (String) - Time limit (e.g., "1 hour")
- `difficulty` (String) - 'Easy', 'Medium', 'Hard'
- `passingScore` (Number) - Passing percentage (e.g., 70)
- `type` (String) - 'quiz', 'exam', 'challenge'
- `status` (String) - 'active', 'inactive'
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 7. **jobs** - Job Board Postings
**Fields:**
- `title` (String) - Job title
- `company` (String) - Company name
- `description` (String) - Job description
- `location` (String) - Job location (Remote, etc.)
- `salary` (String) - Salary range
- `type` (String) - 'Full-time', 'Part-time', 'Contract', 'Internship'
- `skills` (Array) - Required skills
- `status` (String) - 'active', 'inactive', 'filled'
- `postedDate` (Timestamp) - When job was posted
- `appliedCount` (Number) - Number of applications
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 8. **mentors** - Mentorship Program
**Fields:**
- `name` (String) - Mentor name
- `title` (String) - Job title
- `company` (String) - Company name
- `email` (String) - Contact email
- `linkedin` (String) - LinkedIn profile URL
- `experience` (String) - Years of experience
- `skills` (Array) - Expertise areas
- `bio` (String) - About mentor
- `menteeCount` (Number) - Number of mentees
- `availability` (String) - Availability status
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 9. **content** - Announcements & Featured Content
**Fields:**
- `type` (String) - 'announcement', 'feature', 'supplementary', 'news'
- `title` (String) - Content title
- `content` (String) - Main content
- `targetAudience` (String) - 'all', 'students', 'admins'
- `priority` (String) - 'normal', 'high', 'urgent'
- `views` (Number) - View count
- `published` (Boolean) - Is published
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### 10. **stats** - Platform Statistics
**Fields:**
- `totalStudents` (Number) - Total registered students
- `activeStudents` (Number) - Currently active students
- `totalCourses` (Number) - Total courses
- `activeCourses` (Number) - Active courses
- `totalJobs` (Number) - Total job postings
- `activeJobs` (Number) - Active job postings
- `totalMentors` (Number) - Total mentors
- `completionRate` (Number) - Overall completion %
- `lastUpdated` (Timestamp) - Last stats update

### 11. **activities** - User Activity Log
**Fields:**
- `userId` (String) - User who performed action
- `action` (String) - Action performed (login, viewed, completed, etc.)
- `type` (String) - 'course', 'lesson', 'project', 'job', etc.
- `itemId` (String) - ID of related item
- `itemName` (String) - Name of related item
- `details` (String) - Additional details
- `ipAddress` (String) - IP address of user
- `timestamp` (Timestamp) - When action occurred

---

## 🔧 How to Create Collections in Firebase Console

### Method 1: Manual Creation (UI)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your "Shef LMS" project

2. **Navigate to Firestore Database**
   - Click "Firestore Database" in left sidebar
   - Click "Start collection"

3. **Create First Collection**
   - Collection ID: `users`
   - Click "Next"

4. **Add First Document**
   - Document ID: (leave auto-generated or use `admin1`)
   - Add fields:
     ```
     name: "Super Admin" (String)
     email: "admin@sheflms.com" (String)
     password: "$2a$10$..." (hashed, String)
     role: "admin" (String)
     status: "active" (String)
     createdAt: (current date, Timestamp)
     ```
   - Click "Save"

5. **Repeat for Each Collection**
   - Click "Start collection" again
   - Create: `courses`, `modules`, `lessons`, `projects`, `assessments`, `jobs`, `mentors`, `content`, `stats`, `activities`

### Method 2: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Navigate to project directory
cd "c:\Users\hp\Desktop\Shef LMS\backend"

# Initialize Firebase in project
firebase init firestore

# Deploy sample data
firebase firestore:set-data collections.json
```

---

## 📝 Security Rules Setup

1. Go to Firestore Database → **Rules** tab
2. Replace existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own data
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || 
                                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Allow authenticated users to read courses, modules, lessons
    match /courses/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /modules/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /lessons/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Job postings and mentors
    match /jobs/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /mentors/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Content visible to all authenticated users
    match /content/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Activities only viewable/writable by admins
    match /activities/{document=**} {
      allow read, write: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Stats only viewable/writable by admins
    match /stats/{document=**} {
      allow read, write: if request.auth != null && 
                            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

3. Click **Publish**

---

## 🚀 Quick Start: Add Sample Data

Here are the exact steps to add initial data:

### Step 1: Create "users" collection
```
Collection: users
First Document:
  - Document ID: admin1
  - Fields:
    {
      "name": "Super Admin",
      "email": "admin@sheflms.com",
      "password": "$2a$10$XYZ...", // hashed password
      "role": "admin",
      "status": "active",
      "createdAt": (current date),
      "updatedAt": (current date)
    }

Second Document:
  - Document ID: student1
  - Fields:
    {
      "name": "Leonardo De Leon",
      "email": "lqdeleon@gmail.com",
      "password": "$2a$10$ABC...", // hashed password
      "role": "student",
      "status": "active",
      "enrollmentNumber": "SU-2025-001",
      "course": "Cyber Security & Ethical Hacking",
      "phone": "+1-234-567-8900",
      "address": "123 Main St, New York, NY",
      "createdAt": (current date),
      "updatedAt": (current date)
    }
```

### Step 2: Create "courses" collection
```
Collection: courses
Document ID: course1
  {
    "title": "Cyber Security & Ethical Hacking",
    "description": "Learn ethical hacking, penetration testing, and cybersecurity best practices",
    "duration": "6 months",
    "instructor": "John Smith",
    "modules": 6,
    "price": "$999",
    "status": "active",
    "startDate": (date 30 days from now),
    "enrollmentCount": 1,
    "createdAt": (current date),
    "updatedAt": (current date)
  }

Document ID: course2
  {
    "title": "Full Stack Web Development",
    "description": "Master frontend and backend web development",
    "duration": "5 months",
    "instructor": "Jane Doe",
    "modules": 5,
    "price": "$899",
    "status": "active",
    "startDate": (date 30 days from now),
    "enrollmentCount": 0,
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 3: Create "modules" collection
```
Collection: modules
Document ID: mod1
  {
    "name": "Networking Fundamentals",
    "courseId": "course1",
    "description": "Learn TCP/IP, DNS, HTTP protocols",
    "duration": "3 weeks",
    "lessons": 4,
    "order": 1,
    "status": "active",
    "createdAt": (current date),
    "updatedAt": (current date)
  }

Document ID: mod2
  {
    "name": "Security Tools & Frameworks",
    "courseId": "course1",
    "description": "Master penetration testing tools",
    "duration": "4 weeks",
    "lessons": 5,
    "order": 2,
    "status": "active",
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 4: Create "lessons" collection
```
Collection: lessons
Document ID: les1
  {
    "title": "Introduction to Networking",
    "moduleId": "mod1",
    "content": "Learn basics of computer networks and how data travels",
    "duration": "45 min",
    "videoUrl": "https://www.youtube.com/watch?v=...",
    "classLink": "https://zoom.us/meeting/...",
    "order": 1,
    "status": "active",
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 5: Create "projects" collection
```
Collection: projects
Document ID: proj1
  {
    "title": "Penetration Testing Capstone",
    "description": "Perform a complete security audit on a target system",
    "difficulty": "Hard",
    "duration": "2 weeks",
    "skills": ["Networking", "Security", "Tools"],
    "requirements": "Deploy test environment and document findings",
    "deliverables": "Written report, video walkthrough, tools used",
    "status": "active",
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 6: Create "assessments" collection
```
Collection: assessments
Document ID: assess1
  {
    "title": "CEH Practice Exam",
    "description": "50-question practice exam for CEH certification",
    "questions": 50,
    "duration": "2 hours",
    "difficulty": "Hard",
    "passingScore": 75,
    "type": "exam",
    "status": "active",
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 7: Create "jobs" collection
```
Collection: jobs
Document ID: job1
  {
    "title": "Security Analyst",
    "company": "Tech Corp",
    "description": "We're looking for a security analyst to monitor threats",
    "location": "Remote",
    "salary": "$95K - $130K",
    "type": "Full-time",
    "skills": ["Networking", "Security", "Certifications"],
    "status": "active",
    "postedDate": (current date),
    "appliedCount": 0,
    "createdAt": (current date),
    "updatedAt": (current date)
  }

Document ID: job2
  {
    "title": "Penetration Tester",
    "company": "SecureNet Inc",
    "description": "Conduct security assessments and penetration tests",
    "location": "New York, NY",
    "salary": "$110K - $150K",
    "type": "Full-time",
    "skills": ["Penetration Testing", "Networking", "Linux"],
    "status": "active",
    "postedDate": (current date),
    "appliedCount": 2,
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 8: Create "mentors" collection
```
Collection: mentors
Document ID: ment1
  {
    "name": "Alex Johnson",
    "title": "Senior Security Engineer",
    "company": "CyberGuard Solutions",
    "email": "alex@cyberguard.com",
    "linkedin": "https://linkedin.com/in/alexjohnson",
    "experience": "12 years",
    "skills": ["Penetration Testing", "Networking", "Forensics"],
    "bio": "Passionate about teaching the next generation of security professionals",
    "menteeCount": 3,
    "availability": "available",
    "createdAt": (current date),
    "updatedAt": (current date)
  }

Document ID: ment2
  {
    "name": "Sarah Williams",
    "title": "Chief Information Officer",
    "company": "Tech Innovations Ltd",
    "email": "sarah@techinnovations.com",
    "linkedin": "https://linkedin.com/in/sarahwilliams",
    "experience": "15 years",
    "skills": ["Security Strategy", "Risk Management", "Compliance"],
    "bio": "Mentor helping students navigate cybersecurity careers",
    "menteeCount": 5,
    "availability": "available",
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 9: Create "content" collection
```
Collection: content
Document ID: ann1
  {
    "type": "announcement",
    "title": "Welcome to SHEF LMS!",
    "content": "We're excited to have you here. Get started with our onboarding course.",
    "targetAudience": "all",
    "priority": "high",
    "views": 0,
    "published": true,
    "createdAt": (current date),
    "updatedAt": (current date)
  }

Document ID: feature1
  {
    "type": "feature",
    "title": "Live Classes Available",
    "content": "Join live sessions with experienced instructors every week",
    "targetAudience": "students",
    "priority": "normal",
    "views": 0,
    "published": true,
    "createdAt": (current date),
    "updatedAt": (current date)
  }
```

### Step 10: Create "stats" collection
```
Collection: stats
Document ID: main
  {
    "totalStudents": 1,
    "activeStudents": 1,
    "totalCourses": 2,
    "activeCourses": 2,
    "totalJobs": 2,
    "activeJobs": 2,
    "totalMentors": 2,
    "completionRate": 100,
    "lastUpdated": (current date)
  }
```

### Step 11: Create "activities" collection
```
Collection: activities
Document ID: act1
  {
    "userId": "student1",
    "action": "login",
    "type": "user",
    "itemId": "student1",
    "itemName": "Leonardo De Leon",
    "details": "User logged in successfully",
    "ipAddress": "192.168.1.100",
    "timestamp": (current date)
  }
```

---

## ✅ Verification Checklist

After creating all collections, verify:

- [ ] `users` collection has at least 1 admin and 1 student
- [ ] `courses` collection has sample courses
- [ ] `modules` collection linked to courses
- [ ] `lessons` collection linked to modules
- [ ] `projects` collection has sample projects
- [ ] `assessments` collection has sample tests
- [ ] `jobs` collection has job postings
- [ ] `mentors` collection has mentor profiles
- [ ] `content` collection has announcements
- [ ] `stats` collection has one document with platform stats
- [ ] `activities` collection tracking user actions
- [ ] Security Rules are published
- [ ] All collections are indexed if needed

---

## 🔑 Hashed Passwords Reference

For testing, here are pre-hashed passwords (generated with bcryptjs, salt rounds: 10):

```
Password: Admin@123
Hashed: $2a$10$XYZ... (use your own hash tool)

Password: SuperAdmin@123
Hashed: $2a$10$ABC... (use your own hash tool)
```

To generate hashes:
```bash
node -e "
const bcrypt = require('bcryptjs');
const saltRounds = 10;
bcrypt.hash('Admin@123', saltRounds, (err, hash) => {
  if (err) throw err;
  console.log('Hashed Password:', hash);
});
"
```

---

## 📞 Support & Resources

- **Firebase Docs:** https://firebase.google.com/docs/firestore
- **Firestore Best Practices:** https://firebase.google.com/docs/firestore/best-practices
- **Security Rules Guide:** https://firebase.google.com/docs/rules/basics

---

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Status:** ✅ Ready to Deploy
