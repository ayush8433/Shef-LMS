# 🏗️ LMS Architecture - Role-Based Access Control

## Complete System Design with Teacher Role

---

## 📊 **Role Hierarchy & Permissions**

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ Full system control                                         │
│  ✅ Create/manage teachers                                      │
│  ✅ Create/manage students                                      │
│  ✅ Create/manage batches                                       │
│  ✅ Create/manage courses                                       │
│  ✅ Assign teachers to courses                                  │
│  ✅ Assign students to batches                                  │
│  ✅ View all analytics                                          │
│  ✅ System configuration                                        │
│  ✅ Financial reports                                           │
└─────────────────────────────────────────────────────────────────┘
                          ↓ manages
┌─────────────────────────────────────────────────────────────────┐
│                   TEACHER/INSTRUCTOR                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ Create live classes for assigned courses                   │
│  ✅ View students in their batches only                         │
│  ✅ Start/manage their own classes                              │
│  ✅ Track attendance for their classes                          │
│  ✅ Upload course materials for their courses                   │
│  ✅ Grade assignments for their students                        │
│  ✅ View analytics for their batches                            │
│  ❌ Cannot create other teachers                                │
│  ❌ Cannot access other teachers' batches                       │
│  ❌ Cannot modify system settings                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓ teaches
┌─────────────────────────────────────────────────────────────────┐
│                   STUDENT/CANDIDATE                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ View classes for their batch/course only                    │
│  ✅ Join live classes                                           │
│  ✅ Access course materials for their course                    │
│  ✅ View their own progress                                     │
│  ✅ Submit assignments                                          │
│  ✅ Download certificates                                       │
│  ❌ Cannot see other batches' classes                           │
│  ❌ Cannot access admin features                                │
│  ❌ Cannot see other students' data                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema**

### **Users Collection**
```javascript
{
  id: "user_abc123",
  name: "Dr. Sarah Johnson",
  email: "teacher@sheflms.com",
  password: "hashed_password",
  role: "teacher", // "admin", "teacher", "student"
  
  // Teacher-specific fields
  assignedCourses: ["Data Science & AI", "Machine Learning"],
  department: "Data Science",
  qualifications: "PhD in Computer Science",
  experience: "10 years",
  
  // Student-specific fields
  enrollmentNumber: "SU-2026-001", // only for students
  currentCourse: "Data Science & AI", // only for students
  batchId: "DS_2026_JAN", // only for students
  
  // Common fields
  phone: "+91-9876543210",
  status: "active", // "active", "inactive", "suspended"
  createdAt: "2026-01-01T00:00:00Z",
  lastLogin: {
    timestamp: "2026-01-07T10:30:00Z",
    ipAddress: "192.168.1.1",
    city: "Mumbai",
    country: "India"
  }
}
```

### **Batches Collection** (NEW)
```javascript
{
  id: "DS_2026_JAN",
  name: "Data Science Batch - January 2026",
  course: "Data Science & AI",
  startDate: "2026-01-01",
  endDate: "2026-07-01",
  
  // Teacher assignment
  teacherId: "teacher_abc123",
  teacherName: "Dr. Sarah Johnson",
  
  // Students in this batch
  students: ["student_1", "student_2", "student_3", ...],
  maxStudents: 30,
  currentStudents: 25,
  
  // Schedule
  schedule: {
    days: ["Monday", "Wednesday", "Friday"],
    time: "10:00 AM - 12:00 PM",
    timezone: "Asia/Kolkata"
  },
  
  // Metadata
  status: "active", // "active", "completed", "upcoming"
  createdAt: "2025-12-01T00:00:00Z",
  createdBy: "admin_id"
}
```

### **Live Classes Collection** (UPDATED)
```javascript
{
  id: "class_xyz789",
  title: "Introduction to Machine Learning",
  description: "Fundamentals of ML algorithms and applications",
  
  // Course & Batch linking
  course: "Data Science & AI",
  batchId: "DS_2026_JAN", // Links to specific batch
  batchName: "Data Science Batch - January 2026",
  
  // Teacher info
  teacherId: "teacher_abc123",
  teacherName: "Dr. Sarah Johnson",
  instructor: "Dr. Sarah Johnson", // for compatibility
  
  // Zoom integration
  zoomMeetingId: "123456789",
  joinUrl: "https://zoom.us/j/123456789?pwd=...",
  startUrl: "https://zoom.us/s/123456789?...", // Only for teacher
  password: "abc123",
  
  // Scheduling
  scheduledDate: "2026-01-08",
  scheduledTime: "10:00",
  duration: "90 min",
  timezone: "Asia/Kolkata",
  
  // Students
  enrolledStudents: ["student_1", "student_2", "student_3"],
  attendedStudents: ["student_1", "student_2"],
  maxAttendees: 30,
  
  // Status tracking
  status: "scheduled", // "scheduled", "live", "completed", "cancelled"
  
  // Metadata
  createdBy: "teacher_abc123",
  createdAt: "2026-01-05T14:30:00Z",
  updatedAt: "2026-01-06T09:15:00Z"
}
```

### **Attendance Collection** (NEW)
```javascript
{
  id: "attendance_xyz",
  classId: "class_xyz789",
  batchId: "DS_2026_JAN",
  studentId: "student_1",
  studentName: "John Doe",
  joinedAt: "2026-01-08T10:05:00Z",
  leftAt: "2026-01-08T11:30:00Z",
  duration: 85, // minutes
  status: "present" // "present", "absent", "late"
}
```

---

## 🔄 **User Flows**

### **Flow 1: Admin Creates a Batch**
```
1. Admin logs in
2. Goes to "Batches" section
3. Clicks "Create Batch"
4. Fills form:
   - Batch Name: "Data Science Batch - January 2026"
   - Course: "Data Science & AI"
   - Teacher: Select from dropdown (Dr. Sarah Johnson)
   - Start Date: 2026-01-01
   - End Date: 2026-07-01
   - Schedule: Mon/Wed/Fri, 10:00 AM
5. Clicks "Create Batch"
6. System:
   - Creates batch document in Firestore
   - Links teacher to batch
   - Returns success message
```

### **Flow 2: Admin Assigns Students to Batch**
```
1. Admin goes to "Students" section
2. Selects students (checkboxes)
3. Clicks "Assign to Batch"
4. Selects batch from dropdown
5. Confirms assignment
6. System:
   - Updates student documents with batchId
   - Adds student IDs to batch.students array
   - Students can now see classes for this batch
```

### **Flow 3: Teacher Creates a Live Class**
```
1. Teacher logs in (teacher@sheflms.com / Teacher@123)
2. Dashboard shows:
   - Their assigned batches
   - Student count per batch
   - Upcoming classes
3. Goes to "My Classes" section
4. Clicks "Schedule Live Class"
5. Fills form:
   - Title: "Introduction to Machine Learning"
   - Batch: Select from their batches
   - Date: 2026-01-08
   - Time: 10:00
   - Duration: 90 mins
   - Description: "ML fundamentals"
6. Clicks "Create Class"
7. System:
   - Calls Zoom API → Creates meeting
   - Gets join URL and meeting ID
   - Creates class document in Firestore
   - Automatically links to batch students
   - Only students in that batch can see this class
8. Teacher receives:
   - Join URL (for students)
   - Start URL (for teacher to start meeting)
   - Meeting ID and password
```

### **Flow 4: Student Joins a Live Class**
```
1. Student logs in (lqdeleon@gmail.com / Admin@123)
2. Dashboard shows "Live Classes" section
3. System filters classes:
   - Only shows classes where:
     * class.batchId === student.batchId
     * class.status === "scheduled" or "live"
4. Student sees upcoming class:
   - Title: "Introduction to Machine Learning"
   - Date: Tomorrow, 10:00 AM
   - Instructor: Dr. Sarah Johnson
   - Duration: 90 mins
5. At class time, student clicks "📡 Join Live Class"
6. System:
   - Verifies student is in enrolled list
   - Records join time in attendance
   - Redirects to Zoom meeting
   - Increments attendedStudents count
7. Student enters Zoom meeting
```

### **Flow 5: Teacher Starts a Class**
```
1. Teacher goes to "My Classes"
2. Sees upcoming class with "Start Class" button
3. Clicks "Start Class"
4. System:
   - Updates class.status to "live"
   - Shows teacher the Start URL
   - Teacher clicks and enters as host
5. Teacher can:
   - See who joined (attendance tracking)
   - Manage participants
   - Record session
   - End class when done
6. After class:
   - System updates status to "completed"
   - Generates attendance report
   - Moves to "Past Classes" section
```

---

## 🔒 **API Endpoints & Permissions**

### **Auth Endpoints**
```
POST /api/auth/login
- Anyone can access
- Returns JWT with role embedded

POST /api/auth/register
- Admin only (for creating users)
```

### **Admin Endpoints**
```
POST /api/admin/teachers
- Create new teacher
- Admin only

POST /api/admin/students
- Create new student
- Admin only

POST /api/batches
- Create batch
- Admin only

PUT /api/batches/:id/students
- Assign students to batch
- Admin only

GET /api/admin/analytics
- View system-wide analytics
- Admin only
```

### **Teacher Endpoints**
```
GET /api/teacher/dashboard
- Get teacher's dashboard data
- Teacher/Admin only

GET /api/teacher/batches
- Get teacher's assigned batches
- Teacher/Admin only

GET /api/teacher/students
- Get students in teacher's batches
- Teacher/Admin only

POST /api/teacher/class
- Create live class
- Teacher/Admin only
- Validates teacher owns the batch

GET /api/teacher/classes
- Get teacher's classes
- Teacher/Admin only

DELETE /api/teacher/class/:id
- Delete class
- Teacher/Admin only
- Validates teacher owns the class
```

### **Student Endpoints**
```
GET /api/dashboard/classes
- Get classes for student's batch
- Student/Teacher/Admin

POST /api/zoom/join/:id
- Get join URL for class
- Student/Teacher/Admin
- Validates student is in enrolled list
- Records attendance
```

---

## 🎨 **UI/UX Design**

### **Teacher Dashboard Components**

```
┌─────────────────────────────────────────────────────────────┐
│  Teacher Dashboard                        [Dr. Sarah Johnson]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Quick Stats                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Batches  │ Students │ Classes  │ Today     │            │
│  │    3     │    75    │   12     │   2       │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                              │
│  📚 My Batches                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Data Science Batch - Jan 2026        [25 students]   │  │
│  │ Mon/Wed/Fri • 10:00 AM - 12:00 PM                    │  │
│  │ [View Students] [Schedule Class]                      │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Machine Learning Batch - Jan 2026    [30 students]   │  │
│  │ Tue/Thu • 2:00 PM - 4:00 PM                          │  │
│  │ [View Students] [Schedule Class]                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  📅 Upcoming Classes                                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Introduction to ML                                    │  │
│  │ Tomorrow, 10:00 AM • DS Batch Jan 2026               │  │
│  │ 25 students enrolled                                  │  │
│  │ [Start Class] [Edit] [Cancel]                        │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ Deep Learning Basics                                  │  │
│  │ Jan 10, 2:00 PM • ML Batch Jan 2026                  │  │
│  │ 30 students enrolled                                  │  │
│  │ [Start Class] [Edit] [Cancel]                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  [+ Schedule New Class]                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Student Dashboard - Filtered Classes**

```
┌─────────────────────────────────────────────────────────────┐
│  Student Dashboard                              [John Doe]  │
│  Data Science Batch - January 2026                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📡 My Live Classes                                          │
│  (Only showing classes for your batch)                       │
│                                                              │
│  🔴 Upcoming                                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Introduction to Machine Learning                      │  │
│  │ 📅 Tomorrow, 10:00 AM • 90 mins                      │  │
│  │ 👨‍🏫 Dr. Sarah Johnson                                │  │
│  │ 📝 ML fundamentals and algorithms                     │  │
│  │                                                        │  │
│  │ ⏰ Starts in 18 hours                                 │  │
│  │ [📡 Join Live Class]                                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ✅ Completed                                                │
│  • Python Basics - Jan 5, 2026                              │
│  • Data Structures - Jan 3, 2026                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 **Implementation Steps**

### **Phase 1: Backend Setup** ✅ DONE
- [x] Created roleAuth middleware
- [x] Created teacher routes
- [x] Created batches routes
- [x] Added demo teacher credentials
- [x] Updated server with new routes

### **Phase 2: Database Schema**
- [ ] Create sample batches in Firestore
- [ ] Assign students to batches
- [ ] Assign teachers to courses

### **Phase 3: Teacher Frontend**
- [ ] Create TeacherDashboard component
- [ ] Teacher can create classes
- [ ] Teacher can view their batches
- [ ] Teacher can see enrolled students

### **Phase 4: Student Frontend Updates**
- [ ] Filter classes by student's batchId
- [ ] Show only relevant classes
- [ ] Display batch information

### **Phase 5: Admin Frontend Updates**
- [ ] Batch management UI
- [ ] Teacher management UI
- [ ] Assign students to batches UI

---

## 🔧 **Demo Credentials**

```
Super Admin:
- Email: admin@sheflms.com
- Password: SuperAdmin@123
- Access: Full system control

Teacher:
- Email: teacher@sheflms.com
- Password: Teacher@123
- Access: Create classes, view batches

Student (Cyber Security):
- Email: lqdeleon@gmail.com
- Password: Admin@123
- Batch: Cyber Security Batch

Student (Data Science):
- Email: abhi@gmail.com
- Password: Admin@123
- Batch: Data Science Batch
```

---

## 📈 **Benefits of This Architecture**

1. **Scalability**: Can add unlimited teachers and batches
2. **Security**: Role-based access control prevents unauthorized access
3. **Isolation**: Teachers only see their data, students only see their classes
4. **Flexibility**: Easy to reassign students/teachers
5. **Professional**: Enterprise-grade multi-tenant system
6. **Maintainable**: Clear separation of concerns

---

**Next Steps**: Let me know when you want to proceed with creating the Teacher Dashboard frontend component!
