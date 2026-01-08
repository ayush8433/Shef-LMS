const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { isAdmin } = require('../middleware/roleAuth');

// @route   POST /api/batches
// @desc    Create a new batch
// @access  Admin only
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, course, startDate, endDate, teacherId, teacherName, schedule } = req.body;

    if (!name || !course || !teacherId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, course, and teacher are required' 
      });
    }

    const batchData = {
      name,
      course,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      teacherId,
      teacherName,
      students: [],
      schedule: schedule || { days: [], time: '' },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const batchRef = await db.collection('batches').add(batchData);

    res.json({
      success: true,
      message: 'Batch created successfully',
      batch: {
        id: batchRef.id,
        ...batchData
      }
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create batch' 
    });
  }
});

// @route   GET /api/batches
// @desc    Get all batches
// @access  Private
router.get('/', async (req, res) => {
  try {
    const batchesSnapshot = await db.collection('batches').get();

    const batches = [];
    batchesSnapshot.forEach(doc => {
      batches.push({ id: doc.id, ...doc.data() });
    });

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

// @route   PUT /api/batches/:id/students
// @desc    Add students to a batch
// @access  Admin only
router.put('/:id/students', isAdmin, async (req, res) => {
  try {
    const batchId = req.params.id;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student IDs array is required' 
      });
    }

    const batchDoc = await db.collection('batches').doc(batchId).get();
    
    if (!batchDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Batch not found' 
      });
    }

    const batchData = batchDoc.data();
    const currentStudents = batchData.students || [];
    const updatedStudents = [...new Set([...currentStudents, ...studentIds])];

    await db.collection('batches').doc(batchId).update({
      students: updatedStudents
    });

    // Update students with batchId
    const updatePromises = studentIds.map(studentId => 
      db.collection('users').doc(studentId).update({ batchId })
    );
    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Students added to batch successfully'
    });
  } catch (error) {
    console.error('Error adding students to batch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add students to batch' 
    });
  }
});

module.exports = router;
