const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { isTeacher } = require('../middleware/roleAuth');
const zoomService = require('../services/zoomService');

// @route   GET /api/teacher/dashboard
// @desc    Get teacher dashboard data
// @access  Teacher only
router.get('/dashboard', isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher's courses
    const teacherDoc = await db.collection('users').doc(teacherId).get();
    const teacherData = teacherDoc.data();
    const assignedCourses = teacherData.assignedCourses || [];

    // Get teacher's batches
    const batchesSnapshot = await db.collection('batches')
      .where('teacherId', '==', teacherId)
      .get();

    const batches = [];
    batchesSnapshot.forEach(doc => {
      batches.push({ id: doc.id, ...doc.data() });
    });

    // Get students count for teacher's batches
    let totalStudents = 0;
    batches.forEach(batch => {
      totalStudents += batch.students?.length || 0;
    });

    // Get upcoming classes
    const classesSnapshot = await db.collection('liveClasses')
      .where('teacherId', '==', teacherId)
      .where('status', '==', 'scheduled')
      .get();

    const upcomingClasses = [];
    classesSnapshot.forEach(doc => {
      upcomingClasses.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacherId,
          name: teacherData.name,
          email: teacherData.email,
          assignedCourses
        },
        batches,
        totalStudents,
        upcomingClasses: upcomingClasses.length,
        stats: {
          totalBatches: batches.length,
          totalStudents,
          totalClasses: upcomingClasses.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load dashboard' 
    });
  }
});

// @route   GET /api/teacher/batches
// @desc    Get all batches assigned to teacher
// @access  Teacher only
router.get('/batches', isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;

    const batchesSnapshot = await db.collection('batches')
      .where('teacherId', '==', teacherId)
      .get();

    const batches = [];
    for (const doc of batchesSnapshot.docs) {
      const batchData = { id: doc.id, ...doc.data() };
      
      // Get students for this batch
      if (batchData.students && batchData.students.length > 0) {
        const studentsPromises = batchData.students.map(studentId => 
          db.collection('users').doc(studentId).get()
        );
        const studentsSnapshots = await Promise.all(studentsPromises);
        batchData.studentsList = studentsSnapshots
          .filter(snap => snap.exists)
          .map(snap => ({
            id: snap.id,
            ...snap.data(),
            password: undefined // Don't send passwords
          }));
      }

      batches.push(batchData);
    }

    res.json({
      success: true,
      batches
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch batches' 
    });
  }
});

// @route   GET /api/teacher/students
// @desc    Get all students in teacher's batches
// @access  Teacher only
router.get('/students', isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Get teacher's batches
    const batchesSnapshot = await db.collection('batches')
      .where('teacherId', '==', teacherId)
      .get();

    const studentIds = new Set();
    batchesSnapshot.forEach(doc => {
      const batch = doc.data();
      if (batch.students) {
        batch.students.forEach(id => studentIds.add(id));
      }
    });

    // Get student details
    const students = [];
    for (const studentId of studentIds) {
      const studentDoc = await db.collection('users').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        students.push({
          id: studentDoc.id,
          name: studentData.name,
          email: studentData.email,
          enrollmentNumber: studentData.enrollmentNumber,
          currentCourse: studentData.currentCourse,
          batchId: studentData.batchId,
          status: studentData.status
        });
      }
    }

    res.json({
      success: true,
      students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch students' 
    });
  }
});

// @route   POST /api/teacher/class
// @desc    Create a live class (with Zoom)
// @access  Teacher only
router.post('/class', isTeacher, async (req, res) => {
  try {
    const { title, batchId, scheduledDate, scheduledTime, duration, description } = req.body;
    const teacherId = req.user.id;
    const teacherName = req.user.name;

    // Validate required fields
    if (!title || !batchId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, batch, date, and time are required' 
      });
    }

    // Get batch details
    const batchDoc = await db.collection('batches').doc(batchId).get();
    if (!batchDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    const batchData = batchDoc.data();

    // Verify teacher owns this batch
    if (batchData.teacherId !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to create classes for this batch' 
      });
    }

    // Create Zoom meeting
    const startTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    const durationMinutes = parseInt(duration) || 60;

    const zoomResult = await zoomService.createMeeting({
      topic: title,
      startTime: startTime,
      duration: durationMinutes,
      agenda: description || '',
      timezone: 'Asia/Kolkata'
    });

    if (!zoomResult.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create Zoom meeting' 
      });
    }

    // Create live class document
    const classData = {
      title,
      course: batchData.course,
      batchId,
      batchName: batchData.name,
      teacherId,
      teacherName,
      instructor: teacherName,
      zoomMeetingId: zoomResult.meeting.id,
      joinUrl: zoomResult.meeting.joinUrl,
      startUrl: zoomResult.meeting.startUrl,
      password: zoomResult.meeting.password,
      scheduledDate,
      scheduledTime,
      date: scheduledDate, // for compatibility
      time: scheduledTime, // for compatibility
      duration: `${durationMinutes} min`,
      description: description || '',
      status: 'scheduled',
      enrolledStudents: batchData.students || [],
      attendedStudents: [],
      students: batchData.students?.length || 0,
      createdBy: teacherId,
      createdAt: new Date().toISOString()
    };

    const classRef = await db.collection('liveClasses').add(classData);

    res.json({
      success: true,
      message: 'Live class created successfully',
      class: {
        id: classRef.id,
        ...classData
      }
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create class' 
    });
  }
});

// @route   GET /api/teacher/classes
// @desc    Get all classes created by teacher
// @access  Teacher only
router.get('/classes', isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;

    const classesSnapshot = await db.collection('liveClasses')
      .where('teacherId', '==', teacherId)
      .get();

    const classes = [];
    classesSnapshot.forEach(doc => {
      classes.push({ id: doc.id, ...doc.data() });
    });

    // Sort by date
    classes.sort((a, b) => {
      const dateA = new Date(`${a.scheduledDate} ${a.scheduledTime}`);
      const dateB = new Date(`${b.scheduledDate} ${b.scheduledTime}`);
      return dateB - dateA;
    });

    res.json({
      success: true,
      classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch classes' 
    });
  }
});

// @route   DELETE /api/teacher/class/:id
// @desc    Delete a class
// @access  Teacher only
router.delete('/class/:id', isTeacher, async (req, res) => {
  try {
    const classId = req.params.id;
    const teacherId = req.user.id;

    const classDoc = await db.collection('liveClasses').doc(classId).get();
    
    if (!classDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    const classData = classDoc.data();

    // Verify teacher owns this class
    if (classData.teacherId !== teacherId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this class' 
      });
    }

    // Delete from Zoom if meeting ID exists
    if (classData.zoomMeetingId) {
      try {
        await zoomService.deleteMeeting(classData.zoomMeetingId);
      } catch (error) {
        console.log('Could not delete from Zoom:', error.message);
      }
    }

    // Delete from Firestore
    await db.collection('liveClasses').doc(classId).delete();

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete class' 
    });
  }
});

module.exports = router;
