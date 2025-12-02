import React, { useState, useEffect } from 'react';
import { firebaseService, COLLECTIONS } from '../services/firebaseService';
import { where } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { ToastContainer, showToast } from './Toast';
import './AdminDashboard.css';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [classroomVideos, setClassroomVideos] = useState([]);
  const [stats, setStats] = useState({});
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        coursesRes,
        modulesRes,
        lessonsRes,
        projectsRes,
        assessmentsRes,
        jobsRes,
        mentorsRes,
        classroomRes
      ] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.USERS, [where('role', '==', 'student')]),
        firebaseService.getAll(COLLECTIONS.COURSES),
        firebaseService.getAll(COLLECTIONS.MODULES),
        firebaseService.getAll(COLLECTIONS.LESSONS),
        firebaseService.getAll(COLLECTIONS.PROJECTS),
        firebaseService.getAll(COLLECTIONS.ASSESSMENTS),
        firebaseService.getAll(COLLECTIONS.JOBS),
        firebaseService.getAll(COLLECTIONS.MENTORS),
        firebaseService.getAll(COLLECTIONS.CLASSROOM)
      ]);

      if (studentsRes.success) setStudents(studentsRes.data); else setStudents([]);
      if (coursesRes.success) setCourses(coursesRes.data); else setCourses([]);
      if (modulesRes.success) setModules(modulesRes.data); else setModules([]);
      if (lessonsRes.success) setLessons(lessonsRes.data); else setLessons([]);
      if (projectsRes.success) setProjects(projectsRes.data); else setProjects([]);
      if (assessmentsRes.success) setAssessments(assessmentsRes.data); else setAssessments([]);
      if (jobsRes.success) setJobs(jobsRes.data); else setJobs([]);
      if (mentorsRes.success) setMentors(mentorsRes.data); else setMentors([]);
      if (classroomRes.success) setClassroomVideos(classroomRes.data); else setClassroomVideos([]);

      // Calculate stats using safe fallbacks
      calculateStats(studentsRes.success ? studentsRes.data : [], coursesRes.success ? coursesRes.data : [], jobsRes.success ? jobsRes.data : []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentData, courseData, jobData) => {
    const totalStudents = studentData.length;
    const activeStudents = studentData.filter(s => s.status === 'active').length;
    const totalCourses = courseData.length;
    const activeJobs = jobData.filter(j => j.status === 'active').length;
    const totalRevenue = studentData.reduce((sum, s) => sum + (s.tuitionPaid || 0), 0);

    setStats({
      totalStudents,
      activeStudents,
      totalCourses,
      activeJobs,
      totalRevenue,
      completionRate: totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(1) : 0
    });
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(item || getDefaultFormData(type));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  const getDefaultFormData = (type) => {
    const defaults = {
      student: { name: '', email: '', password: '', enrollmentNumber: '', course: '', status: 'active', role: 'student', phone: '', address: '' },
      course: { title: '', description: '', duration: '', modules: 0, status: 'active', instructor: '', price: '' },
      module: { name: '', courseId: '', description: '', duration: '', lessons: 0, order: 1 },
  lesson: { title: '', moduleId: '', content: '', duration: '', videoUrl: '', classLink: '', order: 1, resources: '' },
      project: { title: '', description: '', difficulty: 'Intermediate', duration: '', skills: [], requirements: '', deliverables: '' },
      assessment: { title: '', description: '', questions: 0, duration: '', difficulty: 'Medium', passingScore: 70 },
      job: { title: '', company: '', location: 'Remote', salary: '', type: 'Full-time', status: 'active', skills: [], description: '' },
      mentor: { name: '', title: '', company: '', experience: '', skills: [], bio: '', email: '', linkedin: '' },
      content: { type: 'announcement', title: '', content: '', targetAudience: 'all', priority: 'normal' },
      classroom: { title: '', date: '', instructor: '', duration: '', driveId: '', courseType: 'Cyber Security', type: 'Live Class' }
    };
    return defaults[type] || {};
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Validate required fields
      if (modalType === 'student') {
        if (!formData.name || !formData.email || (!editingItem && !formData.password) || !formData.enrollmentNumber) {
          alert('Please fill in all required fields (Name, Email, Password, Enrollment Number)');
          return;
        }

        // Special handling for student creation/update with password
        if (!editingItem) {
          // Creating new student - hash password before storing
          try {
            // Check if email already exists
            const existingUsers = await firebaseService.getAll(COLLECTIONS.USERS, [where('email', '==', formData.email)]);
            if (existingUsers.success && existingUsers.data.length > 0) {
              alert('A student with this email already exists!');
              return;
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(formData.password, salt);

            // Prepare student data with hashed password
            const studentData = {
              name: formData.name,
              email: formData.email,
              password: hashedPassword,
              enrollmentNumber: formData.enrollmentNumber,
              phone: formData.phone || '',
              address: formData.address || '',
              course: formData.course || '',
              status: formData.status || 'active',
              role: 'student'
            };

            const result = await firebaseService.create(COLLECTIONS.USERS, studentData);
            
            if (result.success) {
              showToast('Student created successfully! Email: ' + formData.email, 'success');
              closeModal();
              await loadAllData();
            } else {
              showToast('Error: ' + result.error, 'error');
            }
            return;
          } catch (error) {
            alert('Failed to create student: ' + error.message);
            return;
          }
        } else {
          // Editing existing student
          const updateData = {
            name: formData.name,
            email: formData.email,
            enrollmentNumber: formData.enrollmentNumber,
            phone: formData.phone || '',
            address: formData.address || '',
            course: formData.course || '',
            status: formData.status || 'active'
          };
          
          // Password cannot be updated during edit for security
          // User should use password reset feature
          
          const result = await firebaseService.update(COLLECTIONS.USERS, editingItem.id, updateData);
          if (result.success) {
            showToast('Student updated successfully!', 'success');
            closeModal();
            await loadAllData();
          } else {
            showToast('Error: ' + result.error, 'error');
          }
          return;
        }
      } else if (modalType === 'course') {
        if (!formData.title || !formData.description) {
          showToast('Please fill in all required fields (Title, Description)', 'warning');
          return;
        }
      } else if (modalType === 'module') {
        if (!formData.name || !formData.courseId) {
          showToast('Please fill in all required fields (Name, Course)', 'warning');
          return;
        }
      } else if (modalType === 'lesson') {
        if (!formData.title || !formData.moduleId || !formData.content) {
          showToast('Please fill in all required fields (Title, Module, Content)', 'warning');
          return;
        }
      } else if (modalType === 'project') {
        if (!formData.title || !formData.description) {
          showToast('Please fill in all required fields (Title, Description)', 'warning');
          return;
        }
      } else if (modalType === 'assessment') {
        if (!formData.title) {
          showToast('Please fill in the Assessment Title', 'warning');
          return;
        }
      } else if (modalType === 'job') {
        if (!formData.title || !formData.company) {
          showToast('Please fill in all required fields (Job Title, Company)', 'warning');
          return;
        }
      } else if (modalType === 'mentor') {
        if (!formData.name || !formData.title || !formData.company) {
          showToast('Please fill in all required fields (Name, Job Title, Company)', 'warning');
          return;
        }
      } else if (modalType === 'content') {
        if (!formData.title || !formData.content) {
          showToast('Please fill in all required fields (Title, Content)', 'warning');
          return;
        }
      }

      // Validate classroom fields
      if (modalType === 'classroom') {
        if (!formData.title || !formData.driveId || !formData.instructor) {
          showToast('Please fill in required fields (Title, Google Drive ID, Instructor)', 'warning');
          return;
        }
      }

      const collection = {
        student: COLLECTIONS.USERS,
        course: COLLECTIONS.COURSES,
        module: COLLECTIONS.MODULES,
        lesson: COLLECTIONS.LESSONS,
        project: COLLECTIONS.PROJECTS,
        assessment: COLLECTIONS.ASSESSMENTS,
        job: COLLECTIONS.JOBS,
        mentor: COLLECTIONS.MENTORS,
        content: COLLECTIONS.CONTENT,
        classroom: COLLECTIONS.CLASSROOM
      }[modalType];

      let result;
      if (editingItem?.id) {
        result = await firebaseService.update(collection, editingItem.id, formData);
      } else {
        result = await firebaseService.create(collection, formData);
      }

      if (result.success) {
        showToast(editingItem ? 'Updated successfully!' : 'Created successfully!', 'success');
        closeModal();
        await loadAllData();
      } else {
        showToast('Error: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save data: ' + error.message);
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collection, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const result = await firebaseService.delete(collection, id);
      if (result.success) {
        alert('Deleted successfully!');
        loadAllData();
      } else {
        alert('Error: ' + result.error);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar open">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/Shef_logo.png" alt="SHEF" className="logo-image" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="icon">📊</span>
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span className="icon">👥</span>
            <span>Students</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveSection('courses')}
          >
            <span className="icon">📚</span>
            <span>Courses</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'modules' ? 'active' : ''}`}
            onClick={() => setActiveSection('modules')}
          >
            <span className="icon">📖</span>
            <span>Modules</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveSection('lessons')}
          >
            <span className="icon">📝</span>
            <span>Lessons</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'classroom' ? 'active' : ''}`}
            onClick={() => setActiveSection('classroom')}
          >
            <span className="icon">🎥</span>
            <span>Classroom</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveSection('projects')}
          >
            <span className="icon">📁</span>
            <span>Projects</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'assessments' ? 'active' : ''}`}
            onClick={() => setActiveSection('assessments')}
          >
            <span className="icon">✏️</span>
            <span>Assessments</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveSection('jobs')}
          >
            <span className="icon">💼</span>
            <span>Job Board</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'mentors' ? 'active' : ''}`}
            onClick={() => setActiveSection('mentors')}
          >
            <span className="icon">👨‍🏫</span>
            <span>Mentors</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'content' ? 'active' : ''}`}
            onClick={() => setActiveSection('content')}
          >
            <span className="icon">📢</span>
            <span>Content</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span className="icon">📈</span>
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <span className="icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>



      {/* Main Content */}
      <main className="admin-main-content sidebar-open">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-left">
            <h1 className="page-title">Admin Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <button className="notification-btn">🔔</button>
              <div className="user-avatar">
                {user?.name?.charAt(0)}
              </div>
              <span className="user-name">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="admin-content">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="admin-section">
              <h2>Dashboard Overview</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{stats.totalStudents || 0}</h3>
                    <p>Total Students</p>
                    <span className="stat-change positive">+{stats.activeStudents || 0} active</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <h3>{stats.totalCourses || 0}</h3>
                    <p>Total Courses</p>
                    <span className="stat-change">Available</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💼</div>
                  <div className="stat-info">
                    <h3>{stats.activeJobs || 0}</h3>
                    <p>Active Jobs</p>
                    <span className="stat-change positive">Open positions</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <h3>{stats.completionRate || 0}%</h3>
                    <p>Completion Rate</p>
                    <span className="stat-change">Overall progress</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button onClick={() => openModal('student')} className="action-btn">
                    <span className="icon">➕</span>
                    <span>Add Student</span>
                  </button>
                  <button onClick={() => openModal('course')} className="action-btn">
                    <span className="icon">➕</span>
                    <span>Add Course</span>
                  </button>
                  <button onClick={() => openModal('job')} className="action-btn">
                    <span className="icon">➕</span>
                    <span>Add Job</span>
                  </button>
                  <button onClick={() => openModal('mentor')} className="action-btn">
                    <span className="icon">➕</span>
                    <span>Add Mentor</span>
                  </button>
                  <button onClick={() => openModal('content')} className="action-btn">
                    <span className="icon">📢</span>
                    <span>Post Announcement</span>
                  </button>
                  <button onClick={() => setActiveSection('analytics')} className="action-btn">
                    <span className="icon">📊</span>
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">👤</span>
                    <div className="activity-content">
                      <p><strong>New student enrolled</strong></p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">📚</span>
                    <div className="activity-content">
                      <p><strong>Course updated</strong></p>
                      <span className="activity-time">5 hours ago</span>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">💼</span>
                    <div className="activity-content">
                      <p><strong>New job posted</strong></p>
                      <span className="activity-time">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Section */}
          {activeSection === 'students' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Students</h2>
                <button onClick={() => openModal('student')} className="btn-add">
                  ➕ Add Student
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Enrollment No.</th>
                      <th>Course</th>
                      <th>Last Login IP</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.enrollmentNumber}</td>
                        <td>{student.course || 'N/A'}</td>
                        <td>
                          <span className="ip-address" title={student.lastLogin?.timestamp || 'Never logged in'}>
                            {student.lastLogin?.ipAddress || student.lastLoginIP || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {student.lastLogin?.city && student.lastLogin?.country 
                            ? `${student.lastLogin.city}, ${student.lastLogin.country}`
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`status-badge ${student.status}`}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => openModal('student', student)} className="btn-edit">✏️</button>
                          <button onClick={() => handleDelete(COLLECTIONS.USERS, student.id)} className="btn-delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <p className="no-data">No students found. Add your first student!</p>}
              </div>
            </div>
          )}

          {/* Courses Section */}
          {activeSection === 'courses' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Courses</h2>
                <button onClick={() => openModal('course')} className="btn-add">
                  ➕ Add Course
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Duration</th>
                      <th>Modules</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td>{course.title}</td>
                        <td>{course.description?.substring(0, 50)}...</td>
                        <td>{course.duration}</td>
                        <td>{course.modules}</td>
                        <td>
                          <span className={`status-badge ${course.status}`}>
                            {course.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => openModal('course', course)} className="btn-edit">✏️</button>
                          <button onClick={() => handleDelete(COLLECTIONS.COURSES, course.id)} className="btn-delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {courses.length === 0 && <p className="no-data">No courses found. Create your first course!</p>}
              </div>
            </div>
          )}

          {/* Modules Section */}
          {activeSection === 'modules' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Modules</h2>
                <button onClick={() => openModal('module')} className="btn-add">
                  ➕ Add Module
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Module Name</th>
                      <th>Course</th>
                      <th>Duration</th>
                      <th>Lessons</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(module => (
                      <tr key={module.id}>
                        <td>{module.name}</td>
                        <td>{courses.find(c => c.id === module.courseId)?.title || 'N/A'}</td>
                        <td>{module.duration}</td>
                        <td>{module.lessons}</td>
                        <td>{module.order}</td>
                        <td>
                          <button onClick={() => openModal('module', module)} className="btn-edit">✏️</button>
                          <button onClick={() => handleDelete(COLLECTIONS.MODULES, module.id)} className="btn-delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {modules.length === 0 && <p className="no-data">No modules found. Add modules to your courses!</p>}
              </div>
            </div>
          )}

          {/* Lessons Section */}
          {activeSection === 'lessons' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Lessons</h2>
                <button onClick={() => openModal('lesson')} className="btn-add">
                  ➕ Add Lesson
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lesson Title</th>
                      <th>Module</th>
                      <th>Duration</th>
                      <th>Order</th>
                      <th>Class</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map(lesson => (
                      <tr key={lesson.id}>
                        <td>{lesson.title}</td>
                        <td>{modules.find(m => m.id === lesson.moduleId)?.name || 'N/A'}</td>
                        <td>{lesson.duration}</td>
                        <td>{lesson.order}</td>
                        <td>
                          {lesson.classLink ? (
                            <a href={lesson.classLink} target="_blank" rel="noopener noreferrer" className="btn-join">Join</a>
                          ) : (
                            <span className="no-class">—</span>
                          )}
                        </td>
                        <td>
                          <button onClick={() => openModal('lesson', lesson)} className="btn-edit">✏️</button>
                          <button onClick={() => handleDelete(COLLECTIONS.LESSONS, lesson.id)} className="btn-delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lessons.length === 0 && <p className="no-data">No lessons found. Start adding lessons to modules!</p>}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {activeSection === 'projects' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Projects</h2>
                <button onClick={() => openModal('project')} className="btn-add">
                  ➕ Add Project
                </button>
              </div>

              <div className="cards-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="project-meta">
                      <span className="badge">{project.difficulty}</span>
                      <span>⏱️ {project.duration}</span>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => openModal('project', project)} className="btn-edit">✏️ Edit</button>
                      <button onClick={() => handleDelete(COLLECTIONS.PROJECTS, project.id)} className="btn-delete">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {projects.length === 0 && <p className="no-data">No projects found. Add capstone projects!</p>}
            </div>
          )}

          {/* Assessments Section */}
          {activeSection === 'assessments' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Assessments</h2>
                <button onClick={() => openModal('assessment')} className="btn-add">
                  ➕ Add Assessment
                </button>
              </div>

              <div className="cards-grid">
                {assessments.map(assessment => (
                  <div key={assessment.id} className="assessment-card">
                    <h3>{assessment.title}</h3>
                    <p>{assessment.description}</p>
                    <div className="assessment-meta">
                      <span>{assessment.questions} Questions</span>
                      <span>⏱️ {assessment.duration}</span>
                      <span className="badge">{assessment.difficulty}</span>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => openModal('assessment', assessment)} className="btn-edit">✏️ Edit</button>
                      <button onClick={() => handleDelete(COLLECTIONS.ASSESSMENTS, assessment.id)} className="btn-delete">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {assessments.length === 0 && <p className="no-data">No assessments found. Create practice tests!</p>}
            </div>
          )}

          {/* Jobs Section */}
          {activeSection === 'jobs' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Job Board</h2>
                <button onClick={() => openModal('job')} className="btn-add">
                  ➕ Add Job
                </button>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Location</th>
                      <th>Salary</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id}>
                        <td>{job.title}</td>
                        <td>{job.company}</td>
                        <td>{job.location}</td>
                        <td>{job.salary}</td>
                        <td>{job.type}</td>
                        <td>
                          <span className={`status-badge ${job.status}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => openModal('job', job)} className="btn-edit">✏️</button>
                          <button onClick={() => handleDelete(COLLECTIONS.JOBS, job.id)} className="btn-delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobs.length === 0 && <p className="no-data">No jobs found. Post job opportunities!</p>}
              </div>
            </div>
          )}

          {/* Mentors Section */}
          {activeSection === 'mentors' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Mentors</h2>
                <button onClick={() => openModal('mentor')} className="btn-add">
                  ➕ Add Mentor
                </button>
              </div>

              <div className="cards-grid">
                {mentors.map(mentor => (
                  <div key={mentor.id} className="mentor-card">
                    <div className="mentor-avatar">{mentor.name?.charAt(0)}</div>
                    <h3>{mentor.name}</h3>
                    <p className="mentor-title">{mentor.title}</p>
                    <p className="mentor-company">{mentor.company} | {mentor.experience}</p>
                    <div className="mentor-skills">
                      {mentor.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    <div className="card-actions">
                      <button onClick={() => openModal('mentor', mentor)} className="btn-edit">✏️ Edit</button>
                      <button onClick={() => handleDelete(COLLECTIONS.MENTORS, mentor.id)} className="btn-delete">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
              {mentors.length === 0 && <p className="no-data">No mentors found. Add industry mentors!</p>}
            </div>
          )}

          {/* Classroom Videos Section */}
          {activeSection === 'classroom' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Classroom Videos</h2>
                <button onClick={() => openModal('classroom')} className="btn-add">
                  ➕ Add Video
                </button>
              </div>

              <div className="info-box">
                <p>📹 Add live class recordings from Google Drive. Students can watch these videos in their Classroom section.</p>
                <p><strong>How to get Drive ID:</strong> Open your video in Google Drive → Click Share → Copy the ID from the URL (e.g., https://drive.google.com/file/d/<strong>YOUR_DRIVE_ID</strong>/view)</p>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Topic</th>
                      <th>Instructor</th>
                      <th>Duration</th>
                      <th>Course</th>
                      <th>Drive ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classroomVideos.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
                          No classroom videos added yet. Click "Add Video" to add your first recording.
                        </td>
                      </tr>
                    ) : (
                      classroomVideos
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(video => (
                          <tr key={video.id}>
                            <td>{video.date}</td>
                            <td><strong>{video.title}</strong></td>
                            <td>
                              <span className="instructor-badge">{video.instructor}</span>
                            </td>
                            <td>{video.duration}</td>
                            <td>
                              <span className={`course-badge ${video.courseType?.includes('Cyber') ? 'cyber' : 'data'}`}>
                                {video.courseType || 'General'}
                              </span>
                            </td>
                            <td>
                              <code className="drive-id">{video.driveId?.substring(0, 15)}...</code>
                            </td>
                            <td>
                              <div className="action-btns">
                                <button onClick={() => openModal('classroom', video)} className="btn-edit" title="Edit">✏️</button>
                                <button onClick={() => handleDelete(COLLECTIONS.CLASSROOM, video.id)} className="btn-delete" title="Delete">🗑️</button>
                                <a 
                                  href={`https://drive.google.com/file/d/${video.driveId}/view`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="btn-view"
                                  title="Preview"
                                >
                                  👁️
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Content Section */}
          {activeSection === 'content' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Content & Announcements</h2>
                <button onClick={() => openModal('content')} className="btn-add">
                  ➕ Add Content
                </button>
              </div>

              <div className="content-management">
                <p>Manage announcements, supplementary courses, and featured content displayed to students.</p>
                <div className="content-actions-grid">
                  <button className="action-card" onClick={() => openModal('content')}>
                    <span className="icon">📢</span>
                    <h4>Post Announcement</h4>
                    <p>Notify all students</p>
                  </button>
                  <button className="action-card">
                    <span className="icon">📚</span>
                    <h4>Add Supplementary Course</h4>
                    <p>Extra learning materials</p>
                  </button>
                  <button className="action-card">
                    <span className="icon">⭐</span>
                    <h4>Feature Content</h4>
                    <p>Highlight on dashboard</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="admin-section">
              <h2>Analytics & Reports</h2>
              
              <div className="analytics-summary">
                <div className="summary-card">
                  <div className="summary-icon" style={{background: '#e3f2fd'}}>📊</div>
                  <div className="summary-content">
                    <h4>Total Students</h4>
                    <p className="summary-number">{students.length}</p>
                    <span className="summary-change positive">+12% this month</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{background: '#f3e5f5'}}>📚</div>
                  <div className="summary-content">
                    <h4>Active Courses</h4>
                    <p className="summary-number">{courses.length}</p>
                    <span className="summary-change neutral">{modules.length} modules</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{background: '#e8f5e9'}}>💼</div>
                  <div className="summary-content">
                    <h4>Job Opportunities</h4>
                    <p className="summary-number">{jobs.filter(j => j.status === 'active').length}</p>
                    <span className="summary-change positive">+5 new jobs</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{background: '#fff3e0'}}>🎯</div>
                  <div className="summary-content">
                    <h4>Completion Rate</h4>
                    <p className="summary-number">87%</p>
                    <span className="summary-change positive">+3% from last month</span>
                  </div>
                </div>
              </div>

              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>📈 Student Enrollment Trend</h3>
                  <div className="bar-chart">
                    <div className="chart-bars">
                      <div className="bar-group">
                        <div className="bar" style={{height: '60%'}}></div>
                        <span className="bar-label">Jan</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{height: '75%'}}></div>
                        <span className="bar-label">Feb</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{height: '85%'}}></div>
                        <span className="bar-label">Mar</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{height: '70%'}}></div>
                        <span className="bar-label">Apr</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{height: '90%'}}></div>
                        <span className="bar-label">May</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{height: '100%'}}></div>
                        <span className="bar-label">Jun</span>
                      </div>
                    </div>
                    <div className="chart-stats">
                      <p>Total Enrollments: <strong>{students.length}</strong></p>
                      <p>Average per Month: <strong>{Math.round(students.length / 6)}</strong></p>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>📚 Course Distribution</h3>
                  <div className="progress-list">
                    {courses.slice(0, 5).map((course, idx) => (
                      <div key={course.id} className="progress-item">
                        <div className="progress-info">
                          <span className="progress-name">{course.title || `Course ${idx + 1}`}</span>
                          <span className="progress-value">{Math.round(Math.random() * 40 + 60)}%</span>
                        </div>
                        <div className="progress-bar-analytics">
                          <div className="progress-fill-analytics" style={{width: `${Math.round(Math.random() * 40 + 60)}%`}}></div>
                        </div>
                      </div>
                    ))}
                    {courses.length === 0 && <p className="no-data">No courses available</p>}
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>💼 Job Placement Stats</h3>
                  <div className="pie-chart-wrapper">
                    <div className="pie-chart">
                      <div className="pie-segment" style={{
                        background: `conic-gradient(
                          #667eea 0deg 252deg,
                          #48bb78 252deg 324deg,
                          #f59e0b 324deg 360deg
                        )`
                      }}></div>
                      <div className="pie-center">
                        <div className="pie-percentage">87%</div>
                        <div className="pie-label">Placed</div>
                      </div>
                    </div>
                    <div className="pie-legend">
                      <div className="legend-item">
                        <span className="legend-color" style={{background: '#667eea'}}></span>
                        <span>Placed (70%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color" style={{background: '#48bb78'}}></span>
                        <span>Interviewing (20%)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-color" style={{background: '#f59e0b'}}></span>
                        <span>Searching (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h3>👥 User Engagement</h3>
                  <div className="line-chart">
                    <div className="chart-area">
                      <svg viewBox="0 0 300 150" className="line-svg">
                        <polyline
                          points="0,120 50,100 100,80 150,90 200,60 250,40 300,30"
                          fill="none"
                          stroke="#667eea"
                          strokeWidth="3"
                        />
                        <polyline
                          points="0,120 50,100 100,80 150,90 200,60 250,40 300,30"
                          fill="url(#gradient)"
                          opacity="0.2"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="chart-stats">
                      <p>Daily Active Users: <strong>245</strong></p>
                      <p>Peak Hours: <strong>2PM - 6PM</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="reports-section">
                <h3>📄 Generate Reports</h3>
                <div className="report-buttons">
                  <button className="btn-report" onClick={() => showToast('Generating Student Progress Report...', 'info')}>
                    <span className="report-icon">📊</span>
                    <span className="report-text">
                      <strong>Student Progress Report</strong>
                      <small>Detailed progress of all students</small>
                    </span>
                  </button>
                  <button className="btn-report" onClick={() => showToast('Generating Course Completion Report...', 'info')}>
                    <span className="report-icon">✅</span>
                    <span className="report-text">
                      <strong>Course Completion Report</strong>
                      <small>Completion rates and analytics</small>
                    </span>
                  </button>
                  <button className="btn-report" onClick={() => showToast('Generating Revenue Report...', 'info')}>
                    <span className="report-icon">💰</span>
                    <span className="report-text">
                      <strong>Revenue Report</strong>
                      <small>Financial summary and trends</small>
                    </span>
                  </button>
                  <button className="btn-report" onClick={() => showToast('Generating Monthly Analytics...', 'info')}>
                    <span className="report-icon">📈</span>
                    <span className="report-text">
                      <strong>Monthly Analytics</strong>
                      <small>Comprehensive monthly overview</small>
                    </span>
                  </button>
                </div>
              </div>

              <div className="insights-section">
                <h3>💡 Key Insights</h3>
                <div className="insights-grid">
                  <div className="insight-card">
                    <span className="insight-icon">🎯</span>
                    <p>Top performing course: <strong>Cyber Security & Ethical Hacking</strong></p>
                  </div>
                  <div className="insight-card">
                    <span className="insight-icon">⏰</span>
                    <p>Average completion time: <strong>4.5 months</strong></p>
                  </div>
                  <div className="insight-card">
                    <span className="insight-icon">🌟</span>
                    <p>Student satisfaction rate: <strong>94%</strong></p>
                  </div>
                  <div className="insight-card">
                    <span className="insight-icon">📚</span>
                    <p>Most popular module: <strong>Penetration Testing</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Add'} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-content">
              {modalType === 'student' && (
                <>
                  {editingItem && editingItem.lastLogin && (
                    <div className="ip-info-display">
                      <h4>📍 Last Login Information</h4>
                      <div className="ip-details">
                        <p><strong>IP Address:</strong> {editingItem.lastLogin.ipAddress || editingItem.lastLoginIP || 'N/A'}</p>
                        <p><strong>Location:</strong> {editingItem.lastLogin.city}, {editingItem.lastLogin.country}</p>
                        <p><strong>ISP:</strong> {editingItem.lastLogin.isp || 'Unknown'}</p>
                        <p><strong>Time:</strong> {editingItem.lastLogin.timestamp ? new Date(editingItem.lastLogin.timestamp).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Name *"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  {!editingItem && (
                    <input
                      type="password"
                      placeholder="Password *"
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Enrollment Number *"
                    value={formData.enrollmentNumber || ''}
                    onChange={(e) => handleInputChange('enrollmentNumber', e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                  <textarea
                    placeholder="Address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows="2"
                  />
                  <select
                    value={formData.course || ''}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                  </select>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </>
              )}

              {modalType === 'course' && (
                <>
                  <input
                    type="text"
                    placeholder="Course Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Description *"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Instructor Name"
                    value={formData.instructor || ''}
                    onChange={(e) => handleInputChange('instructor', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 6 months)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Number of Modules"
                    value={formData.modules || ''}
                    onChange={(e) => handleInputChange('modules', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g., $999 or Free)"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="coming-soon">Coming Soon</option>
                  </select>
                </>
              )}

              {modalType === 'module' && (
                <>
                  <input
                    type="text"
                    placeholder="Module Name *"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <select
                    value={formData.courseId || ''}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    required
                  >
                    <option value="">Select Course *</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Module Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 4 weeks)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Number of Lessons"
                    value={formData.lessons || ''}
                    onChange={(e) => handleInputChange('lessons', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    placeholder="Order / Sequence"
                    value={formData.order || ''}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  />
                </>
              )}

              {modalType === 'lesson' && (
                <>
                  <input
                    type="text"
                    placeholder="Lesson Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <select
                    value={formData.moduleId || ''}
                    onChange={(e) => handleInputChange('moduleId', e.target.value)}
                    required
                  >
                    <option value="">Select Module *</option>
                    {modules.map(module => (
                      <option key={module.id} value={module.id}>
                        {module.name} {module.courseId && courses.find(c => c.id === module.courseId) ? `(${courses.find(c => c.id === module.courseId).title})` : ''}
                      </option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Lesson Content *"
                    value={formData.content || ''}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows="5"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 45 min)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="Video URL (YouTube, Vimeo, etc.)"
                    value={formData.videoUrl || ''}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="Class Link (Zoom / Google Meet)"
                    value={formData.classLink || ''}
                    onChange={(e) => handleInputChange('classLink', e.target.value)}
                  />
                  <textarea
                    placeholder="Additional Resources (links, PDFs, etc.)"
                    value={formData.resources || ''}
                    onChange={(e) => handleInputChange('resources', e.target.value)}
                    rows="2"
                  />
                  <input
                    type="number"
                    placeholder="Order / Sequence"
                    value={formData.order || ''}
                    onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                  />
                </>
              )}

              {modalType === 'project' && (
                <>
                  <input
                    type="text"
                    placeholder="Project Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Project Description *"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="4"
                    required
                  />
                  <textarea
                    placeholder="Requirements"
                    value={formData.requirements || ''}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    rows="3"
                  />
                  <textarea
                    placeholder="Deliverables"
                    value={formData.deliverables || ''}
                    onChange={(e) => handleInputChange('deliverables', e.target.value)}
                    rows="3"
                  />
                  <select
                    value={formData.difficulty || 'Intermediate'}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Duration (e.g., 3 weeks)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Skills Required (comma-separated)"
                    value={formData.skills?.join(', ') || ''}
                    onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  />
                </>
              )}

              {modalType === 'assessment' && (
                <>
                  <input
                    type="text"
                    placeholder="Assessment Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                  />
                  <input
                    type="number"
                    placeholder="Number of Questions"
                    value={formData.questions || ''}
                    onChange={(e) => handleInputChange('questions', parseInt(e.target.value) || 0)}
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g., 90 min)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Passing Score (%)"
                    value={formData.passingScore || 70}
                    onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value) || 70)}
                    min="0"
                    max="100"
                  />
                  <select
                    value={formData.difficulty || 'Medium'}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </>
              )}

              {modalType === 'job' && (
                <>
                  <input
                    type="text"
                    placeholder="Job Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Company *"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Job Description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g., Remote, New York, Hybrid)"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Salary Range (e.g., $95K - $130K)"
                    value={formData.salary || ''}
                    onChange={(e) => handleInputChange('salary', e.target.value)}
                  />
                  <select
                    value={formData.type || 'Full-time'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="filled">Filled</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Required Skills (comma-separated)"
                    value={formData.skills?.join(', ') || ''}
                    onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  />
                </>
              )}

              {modalType === 'mentor' && (
                <>
                  <input
                    type="text"
                    placeholder="Name *"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Job Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Company *"
                    value={formData.company || ''}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="LinkedIn Profile URL"
                    value={formData.linkedin || ''}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Experience (e.g., 10 years exp)"
                    value={formData.experience || ''}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Skills (comma-separated)"
                    value={formData.skills?.join(', ') || ''}
                    onChange={(e) => handleInputChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                  />
                  <textarea
                    placeholder="Bio / About"
                    value={formData.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows="4"
                  />
                </>
              )}

              {modalType === 'classroom' && (
                <>
                  <input
                    type="text"
                    placeholder="Video Title / Topic Name *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Google Drive Video ID *"
                    value={formData.driveId || ''}
                    onChange={(e) => handleInputChange('driveId', e.target.value)}
                    required
                  />
                  <small style={{color: '#888', marginTop: '-10px', display: 'block'}}>
                    Enter the Google Drive file ID (e.g., 1ABCdef123_xyz from the share link)
                  </small>
                  <input
                    type="text"
                    placeholder="Instructor Name *"
                    value={formData.instructor || ''}
                    onChange={(e) => handleInputChange('instructor', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Video Duration (e.g., 45 mins)"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Session Date"
                    value={formData.date || ''}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                  <select
                    value={formData.course || 'Data Science'}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                  >
                    <option value="Data Science">Data Science</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="General">General</option>
                  </select>
                  <select
                    value={formData.type || 'lecture'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <option value="lecture">Lecture</option>
                    <option value="workshop">Workshop</option>
                    <option value="qa">Q&A Session</option>
                    <option value="demo">Demo</option>
                    <option value="review">Review Session</option>
                  </select>
                </>
              )}

              {modalType === 'content' && (
                <>
                  <select
                    value={formData.type || 'announcement'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="feature">Featured Content</option>
                    <option value="supplementary">Supplementary Course</option>
                    <option value="news">News Update</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title *"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Content *"
                    value={formData.content || ''}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows="5"
                    required
                  />
                  <select
                    value={formData.targetAudience || 'all'}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active Students</option>
                    <option value="new">New Students</option>
                    <option value="graduated">Graduated Students</option>
                  </select>
                  <select
                    value={formData.priority || 'normal'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={handleSave} className="btn-save" disabled={saving}>
                {saving ? (editingItem ? 'Updating...' : 'Creating...') : (editingItem ? 'Update' : 'Create')}
              </button>
              <button onClick={closeModal} className="btn-cancel" disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default AdminDashboard;
