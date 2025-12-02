const admin = require('firebase-admin');
require('dotenv').config({ path: '/root/Shef-LMS/backend/.env' });

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();

async function seedData() {
  try {
    console.log('🚀 Starting to seed data...\n');

    // 1. Add Courses
    console.log('📚 Adding courses...');
    const courses = [
      {
        title: 'Cyber Security & Ethical Hacking',
        description: 'Master cybersecurity fundamentals, ethical hacking techniques, penetration testing, and security analysis. Learn to protect systems and networks from cyber threats.',
        duration: '6 months',
        modules: 10,
        status: 'active',
        instructor: 'Shubham',
        price: 49999,
        image: '🔐',
        skills: ['Penetration Testing', 'Network Security', 'Ethical Hacking', 'VAPT', 'Linux', 'Kali Linux']
      },
      {
        title: 'Data Science & AI',
        description: 'Learn data analysis, machine learning, deep learning, and AI. Master Python, statistics, and build real-world AI applications.',
        duration: '6 months',
        modules: 12,
        status: 'active',
        instructor: 'SHEF Instructor',
        price: 59999,
        image: '🤖',
        skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Data Analysis', 'Statistics']
      }
    ];

    for (const course of courses) {
      const existing = await db.collection('courses').where('title', '==', course.title).get();
      if (existing.empty) {
        await db.collection('courses').add({
          ...course,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`  ✅ Added course: ${course.title}`);
      } else {
        console.log(`  ⏭️  Course already exists: ${course.title}`);
      }
    }

    // 2. Add Students
    console.log('\n👥 Adding students...');
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    const students = [
      {
        name: 'Leonardo De Leon',
        email: 'lqdeleon@gmail.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        enrollmentNumber: 'SU-2025-001',
        enrollmentDate: '2025-11-07',
        course: 'Cyber Security & Ethical Hacking',
        phone: '',
        address: ''
      },
      {
        name: 'Abhi',
        email: 'abhi@gmail.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        enrollmentNumber: 'SU-2025-002',
        enrollmentDate: '2025-12-01',
        course: 'Data Science & AI',
        phone: '',
        address: ''
      }
    ];

    for (const student of students) {
      const existing = await db.collection('users').where('email', '==', student.email).get();
      if (existing.empty) {
        await db.collection('users').add({
          ...student,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`  ✅ Added student: ${student.name} (${student.email})`);
      } else {
        console.log(`  ⏭️  Student already exists: ${student.email}`);
      }
    }

    console.log('\n🎉 Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
