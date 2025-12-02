const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// Demo Credentials
// Student: lqdeleon@gmail.com / Admin@123
// Admin: admin@sheflms.com / SuperAdmin@123

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!usersSnapshot.empty) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('users').add(userData);

    const payload = {
      user: {
        id: docRef.id,
        name,
        email,
        role: role || 'student'
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'shef_lms_secret_key_2025',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, ipAddress, ipDetails } = req.body;

    // Get IP from request headers as fallback
    const clientIP = ipAddress || 
                     req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     'Unknown';

    // Store login timestamp and IP
    const loginInfo = {
      timestamp: new Date().toISOString(),
      ipAddress: clientIP,
      city: ipDetails?.city || 'Unknown',
      country: ipDetails?.country || 'Unknown',
      isp: ipDetails?.isp || 'Unknown'
    };

    // Check for demo student credentials - Cybersecurity Course
    if (email === 'lqdeleon@gmail.com' && password === 'Admin@123') {
      const demoUser = {
        id: 'leonardo_deleon_user_id',
        name: 'Leonardo De Leon',
        email: 'lqdeleon@gmail.com',
        role: 'student',
        enrollmentDate: '2025-11-07',
        enrollmentNumber: 'SU-2025-001',
        currentCourse: 'Cyber Security & Ethical Hacking',
        courseDuration: '6 months',
        lastLogin: loginInfo
      };

      const payload = { user: demoUser };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'shef_lms_secret_key_2025',
        { expiresIn: '7d' }
      );

      return res.json({ token, user: demoUser });
    }

    // Check for demo student credentials - Data Science & AI Course
    if (email === 'abhi@gmail.com' && password === 'Admin@123') {
      const demoUser = {
        id: 'abhi_datascience_user_id',
        name: 'Abhi',
        email: 'abhi@gmail.com',
        role: 'student',
        enrollmentDate: '2025-12-01',
        enrollmentNumber: 'SU-2025-002',
        currentCourse: 'Data Science & AI',
        courseDuration: '6 months',
        lastLogin: loginInfo
      };

      const payload = { user: demoUser };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'shef_lms_secret_key_2025',
        { expiresIn: '7d' }
      );

      return res.json({ token, user: demoUser });
    }

    // Check for demo admin credentials
    if (email === 'admin@sheflms.com' && password === 'SuperAdmin@123') {
      const adminUser = {
        id: 'super_admin_user_id',
        name: 'Super Admin',
        email: 'admin@sheflms.com',
        role: 'admin',
        lastLogin: loginInfo
      };

      const payload = { user: adminUser };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'shef_lms_secret_key_2025',
        { expiresIn: '7d' }
      );

      return res.json({ token, user: adminUser });
    }

    // Check Firebase for user
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let userData;
    let userId;
    usersSnapshot.forEach(doc => {
      userId = doc.id;
      userData = doc.data();
    });

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update user's last login info in Firestore
    await db.collection('users').doc(userId).update({
      lastLogin: loginInfo,
      lastLoginIP: clientIP,
      lastLoginTimestamp: new Date().toISOString()
    });

    const payload = {
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        lastLogin: loginInfo
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'shef_lms_secret_key_2025',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shef_lms_secret_key_2025');
    res.json({ user: decoded.user });
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

module.exports = router;
