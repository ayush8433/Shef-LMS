import React, { useState, useEffect, useCallback } from 'react';
import { firebaseService, COLLECTIONS } from '../services/firebaseService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModule, setSelectedModule] = useState(1);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Course content state
  const [courseContent, setCourseContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});
  
  // Progress tracking state
  const [viewedFiles, setViewedFiles] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Classroom videos from Firebase
  const [classroomVideos, setClassroomVideos] = useState([]);

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]

    }));
  };

  // Determine the course slug from user's enrolled course
  const getCourseSlug = useCallback(() => {
    const courseName = user?.currentCourse || '';
    if (courseName.toLowerCase().includes('data science') || courseName.toLowerCase().includes('ai')) {
      return 'data-science';
    }
    if (courseName.toLowerCase().includes('cyber') || courseName.toLowerCase().includes('ethical')) {
      return 'cyber-security';
    }
    return 'data-science'; // default
  }, [user?.currentCourse]);

  // Load user's progress from Firebase
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const progressRef = doc(db, 'userProgress', user.id);
      const progressDoc = await getDoc(progressRef);
      if (progressDoc.exists()) {
        const data = progressDoc.data();
        setViewedFiles(data.viewedFiles || []);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  }, [user?.id]);

  // Save progress to Firebase
  const saveUserProgress = async (newViewedFiles) => {
    if (!user?.id) return;
    try {
      const progressRef = doc(db, 'userProgress', user.id);
      await setDoc(progressRef, {
        viewedFiles: newViewedFiles,
        lastUpdated: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user progress:', error);
    }
  };

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!courseContent || !courseContent.totalFiles) return 0;
    const totalFiles = courseContent.totalFiles;
    const viewed = viewedFiles.length;
    return Math.round((viewed / totalFiles) * 100);
  }, [courseContent, viewedFiles]);

  // Update progress when viewedFiles or courseContent changes
  useEffect(() => {
    const newProgress = calculateProgress();
    setProgressPercent(newProgress);
  }, [calculateProgress]);

  // Load classroom videos from Firebase
  const loadClassroomVideos = useCallback(async () => {
    try {
      const result = await firebaseService.getAll(COLLECTIONS.CLASSROOM);
      if (result.success) {
        // Filter videos based on user's course
        const courseName = user?.currentCourse || '';
        const isDataScienceCourse = courseName.toLowerCase().includes('data science') || 
                                    courseName.toLowerCase().includes('ai');
        
        const filteredVideos = result.data.filter(video => {
          const videoCourseLower = (video.courseType || '').toLowerCase();
          if (isDataScienceCourse) {
            return videoCourseLower.includes('data science') || videoCourseLower.includes('ai');
          } else {
            return videoCourseLower.includes('cyber') || videoCourseLower.includes('security');
          }
        });
        
        // Sort by date, newest first
        const sortedVideos = filteredVideos.sort((a, b) => {
          return new Date(b.date) - new Date(a.date);
        });
        
        setClassroomVideos(sortedVideos);
      } else {
        setClassroomVideos([]);
      }
    } catch (error) {
      console.error('Error loading classroom videos:', error);
      setClassroomVideos([]);
    }
  }, [user?.currentCourse]);

  // Load classroom videos on mount and when course changes
  useEffect(() => {
    if (user?.currentCourse) {
      loadClassroomVideos();
    }
  }, [user?.currentCourse, loadClassroomVideos]);

  // Load user progress on mount
  useEffect(() => {
    loadUserProgress();
  }, [loadUserProgress]);

  // Load course content from API
  const loadCourseContent = useCallback(async () => {
    const slug = getCourseSlug();
    setContentLoading(true);
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
      const response = await fetch(`${apiUrl}/content/${slug}`);
      const data = await response.json();
      if (data.success) {
        setCourseContent(data);
        if (data.modules && data.modules.length > 0) {
          setSelectedModule(data.modules[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading course content:', error);
    }
    setContentLoading(false);
  }, [getCourseSlug]);

  // Handle file click - open in Colab for notebooks, otherwise download/view
  const handleFileClick = (file) => {
    // Mark file as viewed for progress tracking
    const fileKey = file.path || file.name;
    if (!viewedFiles.includes(fileKey)) {
      const newViewedFiles = [...viewedFiles, fileKey];
      setViewedFiles(newViewedFiles);
      saveUserProgress(newViewedFiles);
    }
    
    if (file.canOpenInColab) {
      // Open notebook in Google Colab
      const fileUrl = `https://learnwithshef.com${file.path}`;
      const colabUrl = `https://colab.research.google.com/drive/`;
      // Since we're serving from our own server, we'll open a viewer or download
      // For now, open directly which will trigger download, or use nbviewer
      window.open(fileUrl, '_blank');
    } else if (file.extension === '.pdf') {
      // Open PDF in new tab
      window.open(`https://learnwithshef.com${file.path}`, '_blank');
    } else if (file.extension === '.sql') {
      // Download SQL file
      window.open(`https://learnwithshef.com${file.path}`, '_blank');
    } else {
      // Default: download the file
      window.open(`https://learnwithshef.com${file.path}`, '_blank');
    }
  };

  // Check if user is Data Science or Cybersecurity
  const isDataScience = () => {
    const courseName = user?.currentCourse || '';
    return courseName.toLowerCase().includes('data science') || courseName.toLowerCase().includes('ai');
  };

  // Use classroom videos from Firebase (already filtered by course)
  const classroomSessions = classroomVideos.map((video, index) => ({
    id: video.id || `video-${index}`,
    date: video.date || new Date().toISOString().split('T')[0],
    title: video.title || 'Untitled Class',
    type: video.type || 'Live Class',
    instructor: video.instructor || 'Instructor',
    instructorInitial: (video.instructor || 'I').charAt(0).toUpperCase(),
    instructorColor: video.instructorColor || '#E91E63',
    duration: video.duration || 'N/A',
    driveId: video.driveId || '',
    videoUrl: video.videoUrl || '', // Zoom recording URL
    source: video.source || 'drive', // 'drive' or 'zoom'
    downloadUrl: video.downloadUrl || '' // Zoom download URL
  }));

  // Helper function to format date like "Fri 29 Nov"
  const formatClassDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Group sessions by date
  const groupedSessions = classroomSessions.reduce((groups, session) => {
    const date = session.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {});

  // Complete Course Curriculum - DATA SCIENCE & AI
  const dsCourseData = {
    title: 'Full Stack Data Science & AI',
    duration: '6 months',
    modules: 10,
    progress: 0,
    lessons: '0/157',
    modules_detail: [
      {
        id: 1,
        name: 'Module 1: Introduction to Computer Programming',
        duration: '3 weeks',
        lessons: 15,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Python Fundamentals',
            lessons: ['Introduction to Python', 'Variables and Data Types', 'Control Flow Statements']
          },
          {
            id: 2,
            title: 'Data Structures in Python',
            lessons: ['Lists and Tuples', 'Dictionaries and Sets', 'String Manipulation']
          }
        ]
      },
      {
        id: 2,
        name: 'Module 2: Statistics for Data Science',
        duration: '4 weeks',
        lessons: 18,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Descriptive Statistics',
            lessons: ['Mean, Median, Mode', 'Variance and Standard Deviation', 'Data Distribution']
          },
          {
            id: 2,
            title: 'Inferential Statistics',
            lessons: ['Hypothesis Testing', 'Confidence Intervals', 'P-values and Significance']
          }
        ]
      },
      {
        id: 3,
        name: 'Module 3: Data Analysis with Python',
        duration: '4 weeks',
        lessons: 16,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'NumPy Fundamentals',
            lessons: ['NumPy Arrays', 'Array Operations', 'Broadcasting and Vectorization']
          },
          {
            id: 2,
            title: 'Pandas for Data Analysis',
            lessons: ['DataFrames and Series', 'Data Cleaning', 'Data Aggregation']
          }
        ]
      },
      {
        id: 4,
        name: 'Module 4: Data Visualization',
        duration: '3 weeks',
        lessons: 14,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Matplotlib & Seaborn',
            lessons: ['Basic Plotting', 'Statistical Visualizations', 'Customizing Charts']
          },
          {
            id: 2,
            title: 'Interactive Visualization',
            lessons: ['Plotly Basics', 'Dashboard Creation', 'Storytelling with Data']
          }
        ]
      },
      {
        id: 5,
        name: 'Module 5: SQL and Database Management',
        duration: '3 weeks',
        lessons: 12,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'SQL Fundamentals',
            lessons: ['SELECT Queries', 'JOINs and Subqueries', 'Aggregations and Grouping']
          },
          {
            id: 2,
            title: 'Database Design',
            lessons: ['Normalization', 'Entity Relationships', 'Database Optimization']
          }
        ]
      },
      {
        id: 6,
        name: 'Module 6: Machine Learning Fundamentals',
        duration: '5 weeks',
        lessons: 20,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Supervised Learning',
            lessons: ['Linear Regression', 'Logistic Regression', 'Decision Trees']
          },
          {
            id: 2,
            title: 'Unsupervised Learning',
            lessons: ['K-Means Clustering', 'Hierarchical Clustering', 'PCA and Dimensionality Reduction']
          }
        ]
      },
      {
        id: 7,
        name: 'Module 7: Advanced Machine Learning',
        duration: '4 weeks',
        lessons: 16,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Ensemble Methods',
            lessons: ['Random Forests', 'Gradient Boosting', 'XGBoost and LightGBM']
          },
          {
            id: 2,
            title: 'Model Optimization',
            lessons: ['Hyperparameter Tuning', 'Cross-Validation', 'Feature Engineering']
          }
        ]
      },
      {
        id: 8,
        name: 'Module 8: Deep Learning',
        duration: '5 weeks',
        lessons: 18,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Neural Networks',
            lessons: ['Perceptrons and MLPs', 'Activation Functions', 'Backpropagation']
          },
          {
            id: 2,
            title: 'Deep Learning Frameworks',
            lessons: ['TensorFlow Basics', 'Keras API', 'PyTorch Introduction']
          }
        ]
      },
      {
        id: 9,
        name: 'Module 9: Natural Language Processing',
        duration: '4 weeks',
        lessons: 14,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Text Processing',
            lessons: ['Tokenization', 'TF-IDF', 'Word Embeddings']
          },
          {
            id: 2,
            title: 'NLP Models',
            lessons: ['Sentiment Analysis', 'Named Entity Recognition', 'Transformers and BERT']
          }
        ]
      },
      {
        id: 10,
        name: 'Module 10: MLOps and Deployment',
        duration: '3 weeks',
        lessons: 14,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Model Deployment',
            lessons: ['Flask and FastAPI', 'Docker Containerization', 'Cloud Deployment']
          },
          {
            id: 2,
            title: 'MLOps Best Practices',
            lessons: ['Model Monitoring', 'CI/CD for ML', 'A/B Testing']
          }
        ]
      }
    ]
  };

  // Complete Course Curriculum - Cyber Security & Ethical Hacking
  const cyberCourseData = {
    title: 'Cyber Security & Ethical Hacking',
    duration: '6 months',
    modules: 10,
    progress: 0,
    lessons: '0/520',
    modules_detail: [
      {
        id: 1,
        name: 'Module 1: Introduction to Cyber Security and Ethical Hacking',
        duration: '3 weeks',
        lessons: 52,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Basics of Cyber Security and Threat Landscape',
            lessons: ['What is Cyber Security?', 'Common Cyber Threats and Attack Vectors', 'Security Goals and CIA Triad']
          },
          {
            id: 2,
            title: 'Ethical Hacking Concepts and Types of Hackers',
            lessons: ['Understanding Ethical Hacking', 'Black Hat, White Hat, and Grey Hat Hackers', 'Legal and Ethical Responsibilities']
          },
          {
            id: 3,
            title: 'Phases of Ethical Hacking',
            lessons: ['Reconnaissance', 'Scanning and Enumeration', 'Exploitation, Post-Exploitation, and Reporting']
          },
          {
            id: 4,
            title: 'Security and Risk Management',
            lessons: ['Risk Identification and Assessment', 'Risk Mitigation and Control Measures', 'Security Policies and Frameworks']
          }
        ]
      },
      {
        id: 2,
        name: 'Module 2: Networking Fundamentals for Cyber Security',
        duration: '4 weeks',
        lessons: 48,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Networking Concepts',
            lessons: ['OSI and TCP/IP Models', 'IP Addressing and Subnetting', 'Network Devices and Topologies']
          },
          {
            id: 2,
            title: 'Networking Protocols',
            lessons: ['HTTP, DNS, FTP, SMTP Overview', 'How Protocols Are Exploited', 'Securing Common Network Protocols']
          },
          {
            id: 3,
            title: 'Network Security Devices',
            lessons: ['Firewalls and Their Configuration', 'IDS and IPS Fundamentals', 'Proxy Servers and VPNs']
          },
          {
            id: 4,
            title: 'Packet Analysis and Monitoring',
            lessons: ['Introduction to Wireshark', 'Capturing and Inspecting Packets', 'Identifying Suspicious Network Traffic']
          }
        ]
      },
      {
        id: 3,
        name: 'Module 3: Linux Fundamentals',
        duration: '4 weeks',
        lessons: 56,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Introduction to Linux',
            lessons: ['Basics of the Linux Operating System', 'Linux Distributions for Cyber Security (Kali, Parrot OS)', 'Setting Up the Lab Environment']
          },
          {
            id: 2,
            title: 'Linux File System and Directory Structure',
            lessons: ['Navigating File Systems', 'File Permissions and Ownership', 'Hidden Files and Configuration Paths']
          },
          {
            id: 3,
            title: 'Command Line and System Management',
            lessons: ['Essential Linux Commands for Security Tasks', 'Managing Users, Groups, and Permissions', 'Process Management and System Monitoring']
          },
          {
            id: 4,
            title: 'Shell Scripting for Cyber Security',
            lessons: ['Basics of Bash Scripting', 'Writing Security Automation Scripts', 'Task Scheduling and Automation with Cron Jobs']
          }
        ]
      },
      {
        id: 4,
        name: 'Module 4: Reconnaissance and Footprinting',
        duration: '4 weeks',
        lessons: 50,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Active and Passive Reconnaissance',
            lessons: ['OSINT Techniques and Data Sources', 'Passive Scanning and Metadata Extraction', 'Active Network Probing']
          },
          {
            id: 2,
            title: 'Information Gathering Tools',
            lessons: ['WHOIS, NSLookup, and Dig', 'Recon-ng and Maltego', 'Shodan and Censys for Network Discovery']
          },
          {
            id: 3,
            title: 'Network Scanning with Nmap',
            lessons: ['Nmap Basics and Syntax', 'Service Version and OS Detection', 'Vulnerability Scanning with Nmap Scripts']
          },
          {
            id: 4,
            title: 'Identifying Devices and Open Ports',
            lessons: ['Network Mapping', 'Device Fingerprinting', 'Service Enumeration and Banner Grabbing']
          }
        ]
      },
      {
        id: 5,
        name: 'Module 5: Vulnerability Analysis',
        duration: '4 weeks',
        lessons: 54,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Vulnerability Assessment Methodologies',
            lessons: ['Understanding Vulnerability Management', 'Assessment Phases and Workflows', 'Vulnerability Scoring Systems (CVSS)']
          },
          {
            id: 2,
            title: 'Tools for Vulnerability Scanning',
            lessons: ['Nessus Overview and Setup', 'OWASP ZAP for Web Scanning', 'Comparing Automated and Manual Scans']
          },
          {
            id: 3,
            title: 'Identifying CVEs and Exploits',
            lessons: ['Using Exploit Databases (Exploit-DB, CVE Details)', 'Mapping Vulnerabilities to Exploits', 'Validating Vulnerabilities']
          },
          {
            id: 4,
            title: 'Analyzing Vulnerability Reports',
            lessons: ['Report Interpretation and Prioritization', 'False Positive Analysis', 'Remediation Planning']
          }
        ]
      },
      {
        id: 6,
        name: 'Module 6: System Hacking',
        duration: '4 weeks',
        lessons: 52,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Password Cracking Techniques',
            lessons: ['Dictionary and Brute-Force Attacks', 'Tools (Hydra, John the Ripper, Hashcat)', 'Password Policy Enforcement']
          },
          {
            id: 2,
            title: 'Privilege Escalation',
            lessons: ['Windows Privilege Escalation', 'Linux Privilege Escalation', 'Maintaining Access']
          },
          {
            id: 3,
            title: 'Backdoors and Trojans',
            lessons: ['Creating and Detecting Backdoors', 'RATs and Persistence Mechanisms', 'Defense Against Backdoors']
          },
          {
            id: 4,
            title: 'Anti-Forensics Techniques',
            lessons: ['Covering Tracks and Clearing Logs', 'Steganography and Data Hiding', 'Rootkits and Evasion']
          }
        ]
      },
      {
        id: 7,
        name: 'Module 7: Web Application Security',
        duration: '4 weeks',
        lessons: 56,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'OWASP Top 10 Vulnerabilities',
            lessons: ['Injection Attacks (SQLi, Command Injection)', 'Authentication and Session Issues', 'Security Misconfigurations']
          },
          {
            id: 2,
            title: 'Hands-On Labs (Juice Shop, DVWA)',
            lessons: ['Setting Up Vulnerable Web Apps', 'Exploiting Common Vulnerabilities', 'Writing Secure Code to Prevent Attacks']
          },
          {
            id: 3,
            title: 'Exploiting Web Vulnerabilities',
            lessons: ['SQL Injection Exploits', 'XSS and CSRF Attacks', 'File Upload and Directory Traversal']
          },
          {
            id: 4,
            title: 'Web Security Tools',
            lessons: ['Burp Suite for Interception', 'SQLmap for Injection Testing', 'ZAP Proxy for Automated Scans']
          }
        ]
      },
      {
        id: 8,
        name: 'Module 8: Wireless Network Security',
        duration: '4 weeks',
        lessons: 52,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Wireless Network Fundamentals',
            lessons: ['Wi-Fi Standards and Protocols', 'Authentication Mechanisms', 'Encryption (WEP, WPA, WPA2, WPA3)']
          },
          {
            id: 2,
            title: 'Wireless Attacks and Tools',
            lessons: ['Packet Capture and Sniffing', 'Deauthentication and Handshake Captures', 'WPA/WPA2 Cracking Tools']
          },
          {
            id: 3,
            title: 'Wireless Network Exploitation',
            lessons: ['Evil Twin Attacks', 'Rogue AP Setup', 'MITM on Wireless Networks']
          },
          {
            id: 4,
            title: 'Securing Wireless Networks',
            lessons: ['Implementing WPA3 and MAC Filtering', 'Wireless IDS/IPS', 'Secure Network Configuration Practices']
          }
        ]
      },
      {
        id: 9,
        name: 'Module 9: Penetration Testing Methodologies',
        duration: '5 weeks',
        lessons: 60,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Planning and Scoping',
            lessons: ['Defining Engagement Rules', 'Scoping and Legal Considerations', 'Project Documentation Templates']
          },
          {
            id: 2,
            title: 'Penetration Testing Process',
            lessons: ['Pre-Engagement Activities', 'Execution and Reporting', 'Validation of Findings']
          },
          {
            id: 3,
            title: 'Reporting and Documentation',
            lessons: ['Writing Professional Pen Test Reports', 'Communicating Findings to Clients', 'Mitigation Recommendations']
          },
          {
            id: 4,
            title: 'Real-World Simulations',
            lessons: ['Simulated Enterprise Network Attack', 'Exploitation to Post-Exploitation', 'Defensive Countermeasures']
          }
        ]
      },
      {
        id: 10,
        name: 'Module 10: Advanced Topics in Cyber Security',
        duration: '4 weeks',
        lessons: 44,
        progress: 0,
        chapters: [
          {
            id: 1,
            title: 'Cloud Security',
            lessons: ['Common Cloud Vulnerabilities', 'Cloud Security Controls and IAM', 'Securing Cloud Applications']
          },
          {
            id: 2,
            title: 'IoT Security',
            lessons: ['IoT Architecture and Attack Surface', 'Common IoT Threats', 'Securing IoT Devices']
          },
          {
            id: 3,
            title: 'Threat Hunting and Mitigation',
            lessons: ['Understanding Threat Intelligence', 'Detection and Response Strategies', 'Using SIEM Tools for Threat Analysis']
          }
        ]
      }
    ]
  };

  // Select courseData based on user's enrolled course
  const courseData = isDataScience() ? dsCourseData : cyberCourseData;

  // Course-specific Capstone Projects
  const dsCapstoneProjects = [
    { id: 1, icon: '📊', color: '#e6f3ff', title: 'Customer Churn Prediction', description: 'End-to-End ML Pipeline' },
    { id: 2, icon: '🏠', color: '#fff0e6', title: 'Real Estate Price Prediction', description: 'Regression Analysis with Feature Engineering' },
    { id: 3, icon: '🎬', color: '#f0e6ff', title: 'Movie Recommendation System', description: 'Collaborative Filtering & Content-Based' },
    { id: 4, icon: '📈', color: '#e6ffe6', title: 'Stock Market Analysis', description: 'Time Series Forecasting with LSTM' },
    { id: 5, icon: '🛒', color: '#ffe6e6', title: 'E-commerce Analytics Dashboard', description: 'Data Visualization & BI' }
  ];

  const cyberCapstoneProjects = [
    { id: 1, icon: '🔐', color: '#ffe6e6', title: 'Enterprise Network Penetration Test', description: 'End-to-End Security Assessment' },
    { id: 2, icon: '🌐', color: '#fff0e6', title: 'Web Application Security Audit', description: 'OWASP Top 10 Vulnerability Assessment' },
    { id: 3, icon: '📡', color: '#e6f0ff', title: 'Wireless Network Security Analysis', description: 'Wi-Fi Penetration Testing & Security' },
    { id: 4, icon: '🛡️', color: '#f0e6ff', title: 'Incident Response Simulation', description: 'Threat Detection & Response Plan' },
    { id: 5, icon: '🔍', color: '#e6ffe6', title: 'Digital Forensics Investigation', description: 'Evidence Collection & Analysis' }
  ];

  const capstoneProjects = isDataScience() ? dsCapstoneProjects : cyberCapstoneProjects;

  // Course-specific Practice Assessments
  const dsPracticeAssessments = [
    { id: 1, icon: '🐍', title: 'Python Coding Challenges', meta: '15 Questions | 60 Min' },
    { id: 2, icon: '📊', title: 'Statistics & Probability Quiz', meta: '20 Questions | 45 Min' },
    { id: 3, icon: '🤖', title: 'Machine Learning Concepts', meta: '25 Questions | 90 Min' }
  ];

  const cyberPracticeAssessments = [
    { id: 1, icon: '🔐', title: 'Network Security Challenges', meta: '8 Questions | 90 Min' },
    { id: 2, icon: '🛡️', title: 'Web Application Security Lab', meta: '6 Questions | 120 Min' },
    { id: 3, icon: '⚔️', title: 'CTF Challenges', meta: '10 Questions | 180 Min' }
  ];

  const practiceAssessments = isDataScience() ? dsPracticeAssessments : cyberPracticeAssessments;

  // Course-specific Quiz Assessments
  const dsQuizAssessments = [
    { id: 1, icon: 'SQL', title: 'SQL Proficiency Test', iconClass: 'nn-icon' },
    { id: 2, icon: '📊', title: 'Data Visualization Quiz', iconClass: 'microsoft-icon' },
    { id: 3, icon: '🧠', title: 'Deep Learning Fundamentals', iconClass: 'meta-icon' }
  ];

  const cyberQuizAssessments = [
    { id: 1, icon: 'CEH', title: 'CEH Mock Exam', iconClass: 'nn-icon' },
    { id: 2, icon: '🔒', title: 'CompTIA Security+ Practice Test', iconClass: 'microsoft-icon' },
    { id: 3, icon: '🌐', title: 'OSCP Preparation Quiz', iconClass: 'meta-icon' }
  ];

  const quizAssessments = isDataScience() ? dsQuizAssessments : cyberQuizAssessments;

  // Course-specific Supplementary Courses
  const dsSupplementaryCourses = [
    { id: 1, badge: 'A', color: '#e6f3ff', title: 'Advanced Analytics', meta: '📚 25 Lessons • ⏱️ 15000 min', desc: 'Business Intelligence, A/B Testing, and Advanced Statistical Methods...' },
    { id: 2, badge: 'B', color: '#f0e6ff', title: 'Big Data Technologies', meta: '📚 30 Lessons • ⏱️ 18000 min', desc: 'Spark, Hadoop, and distributed computing for large-scale data processing...' },
    { id: 3, badge: 'C', color: '#e6ffe6', title: 'Cloud ML Platforms', meta: '📚 22 Lessons • ⏱️ 13200 min', desc: 'AWS SageMaker, Google Vertex AI, and Azure ML for cloud-based ML...' }
  ];

  const cyberSupplementaryCourses = [
    { id: 1, badge: 'K', color: '#e6f3ff', title: 'Kali Linux Mastery', meta: '📚 32 Lessons • ⏱️ 18000 min', desc: 'Master Kali Linux tools and techniques for penetration testing and...' },
    { id: 2, badge: 'C', color: '#e6d9ff', title: 'Cloud Security', meta: '📚 28 Lessons • ⏱️ 16200 min', desc: 'AWS, Azure, and GCP security best practices, IAM, and cloud archi...' },
    { id: 3, badge: 'M', color: '#d9f0e6', title: 'Malware Analysis', meta: '📚 30 Lessons • ⏱️ 17400 min', desc: 'Reverse engineering, dynamic analysis, and threat detection techn...' }
  ];

  const supplementaryCourses = isDataScience() ? dsSupplementaryCourses : cyberSupplementaryCourses;

  // Course-specific Job Types
  const dsJobTypes = ['Data Scientist', 'ML Engineer', 'Data Analyst', 'AI Engineer', 'Business Analyst'];
  const cyberJobTypes = ['Security Analyst', 'Penetration Tester', 'SOC Analyst', 'Security Engineer', 'Threat Hunter'];
  const relevantJobTypes = isDataScience() ? dsJobTypes : cyberJobTypes;

  useEffect(() => {
    fetchDashboardData();
    
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load course content when switching to Learn section
  useEffect(() => {
    if (activeSection === 'courses' && !courseContent) {
      loadCourseContent();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    try {
      // Set minimum loading time to 2 seconds
      const startTime = Date.now();
      
      // Fetch all data from Firebase
      const [coursesRes, modulesRes, lessonsRes, projectsRes, jobsRes, mentorsRes, contentRes, liveClassesRes] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.COURSES),
        firebaseService.getAll(COLLECTIONS.MODULES),
        firebaseService.getAll(COLLECTIONS.LESSONS),
        firebaseService.getAll(COLLECTIONS.PROJECTS),
        firebaseService.getAll(COLLECTIONS.JOBS),
        firebaseService.getAll(COLLECTIONS.MENTORS),
        firebaseService.getAll(COLLECTIONS.CONTENT),
        firebaseService.getAll(COLLECTIONS.LIVE_CLASSES)
      ]);

      // Extract data
      const coursesData = coursesRes.success ? coursesRes.data : [];
      const modulesData = modulesRes.success ? modulesRes.data : [];
      const lessonsData = lessonsRes.success ? lessonsRes.data : [];
      const projectsData = projectsRes.success ? projectsRes.data : [];
      const jobsData = jobsRes.success ? jobsRes.data : [];
      const mentorsData = mentorsRes.success ? mentorsRes.data : [];
      const contentData = contentRes.success ? contentRes.data : [];
      const liveClassesData = liveClassesRes.success ? liveClassesRes.data : [];

      // Calculate stats from real data
      const calculatedStats = {
        enrolled: coursesData.length,
        completed: 0,
        inProgress: coursesData.length,
        totalHours: coursesData.length * 40, // Estimate 40 hours per course
        certificates: 0,
        upcomingClasses: lessonsData.length
      };

      // Map courses with real data
      const mappedCourses = coursesData.map(course => ({
        ...course,
        progress: 0,
        modules: modulesData.filter(m => m.courseId === course.id).length,
        lessons: lessonsData.filter(l => {
          const module = modulesData.find(m => m.id === l.moduleId);
          return module && module.courseId === course.id;
        }).length
      }));

      // Create recent activities from content
      const recentActivities = contentData
        .filter(c => c.type === 'announcement')
        .slice(0, 5)
        .map(announcement => ({
          type: 'announcement',
          title: announcement.title,
          description: announcement.content,
          time: announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'
        }));

      setStats(calculatedStats);
      setCourses(mappedCourses);
  setLessons(lessonsData);
      setActivities(recentActivities);
      setProjects(projectsData);
      setJobs(jobsData.filter(j => j.status === 'active'));
      setMentors(mentorsData);
      setLiveClasses(liveClassesData);
      
      // Store additional data for other sections
      window.dashboardData = {
        courses: coursesData,
        modules: modulesData,
        lessons: lessonsData,
        projects: projectsData,
        jobs: jobsData,
        mentors: mentorsData,
        content: contentData,
        liveClasses: liveClassesData
      };
      
      // Ensure loading animation shows for at least 2 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(2000 - elapsedTime, 0);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Reset to 0 on error
      setStats({ enrolled: 0, completed: 0, inProgress: 0, totalHours: 0, certificates: 0, upcomingClasses: 0 });
      setCourses([]);
      setActivities([]);
      
      // Still respect 2-second minimum on error
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar open">
        <div className="sidebar-header">
          <div className="logo">
            <img src="/Shef_logo.png" alt="SHEF" className="logo-image" />
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveSection('overview'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Home"
          >
            <span className="icon">🏠</span>
            <span>Home</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'liveClasses' ? 'active' : ''}`}
            onClick={() => { setActiveSection('liveClasses'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Live Classes"
          >
            <span className="icon">📡</span>
            <span>Live Classes</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'classroom' ? 'active' : ''}`}
            onClick={() => { setActiveSection('classroom'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Classroom"
          >
            <span className="icon">🎥</span>
            <span>Classroom</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'courses' ? 'active' : ''}`}
            onClick={() => { setActiveSection('courses'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Learn"
          >
            <span className="icon">📖</span>
            <span>Learn</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'activity' ? 'active' : ''}`}
            onClick={() => { setActiveSection('activity'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Practice"
          >
            <span className="icon">✏️</span>
            <span>Practice</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'projects' ? 'active' : ''}`}
            onClick={() => { setActiveSection('projects'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Projects"
          >
            <span className="icon">📁</span>
            <span>Projects</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'career' ? 'active' : ''}`}
            onClick={() => { setActiveSection('career'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Career"
          >
            <span className="icon">🎯</span>
            <span>Career</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'mentorship' ? 'active' : ''}`}
            onClick={() => { setActiveSection('mentorship'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Mentorship"
          >
            <span className="icon">👨‍🏫</span>
            <span>Mentorship</span>
          </button>
          <button 
            className={`nav-item ${activeSection === 'jobboard' ? 'active' : ''}`}
            onClick={() => { setActiveSection('jobboard'); if (window.innerWidth <= 1024) setSidebarOpen(false); }}
            title="Job Board"
          >
            <span className="icon">💼</span>
            <span>Job Board</span>
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
      <main className="main-content sidebar-open">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <img src="/Shef_logo.png" alt="SHEF" className="header-logo" />
          </div>
          <div className="header-right">
            <div className="user-menu">
              <button className="notification-btn">🔔</button>
              <button 
                className="user-avatar-btn"
                onClick={() => setShowProfileModal(true)}
                title="View Profile"
              >
                {user?.name?.charAt(0)}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <>
              {/* Hero Section with Featured Program */}
              <div className="featured-program">
                <div className="featured-content">
                  <h2>Welcome to Shef USA Learning Platform</h2>
                  <p>{isDataScience() 
                    ? 'Master Data Science & AI with live classes, top instructors, and 100% job assistance' 
                    : 'Advance your cybersecurity skills with industry-recognized certification and hands-on labs'}</p>
                  <div className="featured-buttons">
                    <button className="btn-primary" onClick={() => window.open('https://shefusa.com/courses-registration/', '_blank')}>Explore Programs</button>
                    <button className="btn-secondary" onClick={() => window.open('tel:+18889277072', '_self')}>📞 +1 (888) 927-7072</button>
                    <button className="btn-tertiary" onClick={() => window.open('https://shefusa.com/', '_blank')}>Visit ShefUSA.com</button>
                  </div>
                </div>
                <div className="featured-image">
                  <div className="image-placeholder">🎓 12.5K+ Students Enrolled</div>
                </div>
              </div>

              {/* Current Course Section */}
              <div className="section">
                <div className="section-header">
                  <h2>Start Your Learning Journey</h2>
                  <div className="section-meta">
                    <span className="duration">{courseData.duration}</span>
                    <span className="modules">{courseData.modules} modules</span>
                  </div>
                </div>

                {/* Main Course Card */}
                <div className="main-course-card">
                  <div className="course-header">
                    <h3>{courseData.title}</h3>
                    <span className="course-tag">Get Started</span>
                  </div>
                  
                  <div className="course-modules">
                    <div className="module-item">
                      <span className="module-icon">📚</span>
                      <span className="module-name">First Module</span>
                      <span className="module-desc">{courseData.modules_detail[0]?.name?.replace(/^Module \d+:\s*/, '') || 'Introduction'}</span>
                    </div>
                    <div className="module-item">
                      <span className="module-icon">📖</span>
                      <span className="module-name">First Lesson</span>
                      <span className="module-desc">{courseData.modules_detail[0]?.chapters?.[0]?.lessons?.[0] || 'Getting Started'}</span>
                    </div>
                  </div>

                  <div className="course-progress">
                    <div className="progress-bar-large">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                    <span className="progress-text">0%</span>
                  </div>

                  <button className="btn-continue" onClick={() => setActiveSection('courses')}>Start Learning →</button>
                </div>

                {/* Dashboard Walkthrough */}
                <div className="dashboard-info">
                  <div className="info-card">
                    <div className="info-icon">📊</div>
                    <h4>Dashboard Walkthrough</h4>
                    <p>Learn how to navigate your learning dashboard</p>
                    <button className="btn-small">View Classroom</button>
                  </div>
                  <div className="upcoming-classes">
                      <h4>📅 Upcoming Live Classes</h4>
                      <div className="classes-list">
                        {/* Show next 3 lessons that have a classLink */}
                        {lessons && lessons.filter(l => l.classLink).slice(0,3).map((lesson) => (
                          <div key={lesson.id} className="class-item">
                            <div className="class-info">
                              <strong>{lesson.title}</strong>
                              <div className="class-meta">{lesson.duration || 'TBD'}</div>
                            </div>
                            <div className="class-actions">
                              <a href={lesson.classLink} target="_blank" rel="noopener noreferrer" className="btn-join">Join class</a>
                            </div>
                          </div>
                        ))}
                        {!lessons || lessons.filter(l => l.classLink).length === 0 ? (
                          <p>No upcoming live classes scheduled.</p>
                        ) : null}
                      </div>
                  </div>
                </div>
              </div>

              {/* Practice Coding Assessments */}
              <div className="section">
                <div className="section-header">
                  <h2>{isDataScience() ? 'Practice Data Science Challenges' : 'Practice Security Challenges'}</h2>
                  <button className="view-all-btn">See all</button>
                </div>
                <div className="practice-assessments-grid">
                  {practiceAssessments.map((assessment) => (
                    <div key={assessment.id} className="assessment-card">
                      <div className="assessment-header">
                        <div className="assessment-icon">{assessment.icon}</div>
                      </div>
                      <div className="assessment-content">
                        <h4>{assessment.title}</h4>
                        <p className="assessment-meta">{assessment.meta}</p>
                        <button className="btn-start">Start now →</button>
                        <button className="btn-share">⤓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practice Quiz Assessments */}
              <div className="section">
                <div className="section-header">
                  <h2>Practice Quiz Assessments</h2>
                  <button className="view-all-btn">See all</button>
                </div>
                <div className="practice-assessments-grid">
                  {quizAssessments.map((quiz) => (
                    <div key={quiz.id} className="assessment-card">
                      <div className="assessment-header">
                        <div className={`assessment-icon ${quiz.iconClass}`}>{quiz.icon}</div>
                      </div>
                      <div className="assessment-content">
                        <h4>{quiz.title}</h4>
                        <button className="btn-start">Start now →</button>
                        <button className="btn-share">⤓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capstone Projects */}
              <div className="section">
                <div className="section-header">
                  <h2>Capstone Projects</h2>
                  <button className="view-all-btn">See all →</button>
                </div>
                <div className="capstone-projects-grid">
                  {capstoneProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="capstone-card">
                      <div className="capstone-icon" style={{ background: project.color }}>{project.icon}</div>
                      <h4>{project.title}</h4>
                      <p className="capstone-course">{project.description}</p>
                      <button className="btn-start">Start now →</button>
                      <button className="btn-share">⬆️</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explore Supplementary Courses */}
              <div className="section">
                <div className="section-header">
                  <h2>Explore Supplementary Course</h2>
                  <button className="view-all-btn">See all →</button>
                </div>
                <div className="supplementary-courses-grid">
                  {supplementaryCourses.map((course) => (
                    <div key={course.id} className="supplementary-card">
                      <div className="supplementary-badge" style={{ background: course.color }}>{course.badge}</div>
                      <h4>{course.title}</h4>
                      <p className="supplementary-meta">{course.meta}</p>
                      <p className="supplementary-desc">{course.desc}</p>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '0%' }}></div>
                      </div>
                      <span className="progress-percent">0%</span>
                      <div className="supplementary-actions">
                        <button className="btn-view">View →</button>
                        <button className="btn-share">⬆️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeSection === 'courses' && (
            <div className="learn-section-accordion">
              {/* Course Hero Card with Progress Circle */}
              <div className="course-hero-card">
                <div className="course-hero-left">
                  <h2>{user?.currentCourse || courseData.title}</h2>
                  <div className="course-meta-info">
                    <span>{courseData.duration}</span>
                    <span>•</span>
                    <span>{courseContent?.modulesCount || courseData.modules} modules</span>
                  </div>
                  <p className="course-description">
                    {isDataScience() 
                      ? 'Data Science is an increasingly important field as companies struggle to make sense of the vast quantities of data they generate. This Full Stack Data Science course is the perfect way for students to learn the skills necessary to excel in this exciting field. With electives in Business Analytics, Data Engineering, and Advanced Machine Learning, this immersive program covers everything from data acquisition and storage to analysis, visualization, and machine learning...'
                      : 'Cyber Security is one of the fastest-growing fields in technology. This comprehensive Cyber Security & Ethical Hacking course will teach you everything from basic network security concepts to advanced penetration testing techniques. With hands-on labs, real-world scenarios, and industry-recognized certifications preparation, you\'ll be ready to protect organizations from cyber threats...'}
                  </p>
                  <div className="continue-from">
                    <span className="continue-label">Continue from where you left,</span>
                    <div className="continue-info">
                      <div className="continue-item">
                        <span className="continue-title">Module</span>
                        <span className="continue-value">{courseContent?.modules?.[0]?.displayName || courseData.modules_detail[0]?.name?.replace(/^Module \d+:\s*/, '')}</span>
                      </div>
                      <div className="continue-item">
                        <span className="continue-title">Lesson</span>
                        <span className="continue-value">{courseContent?.modules?.[0]?.files?.[0]?.displayName || courseData.modules_detail[0]?.chapters?.[0]?.lessons?.[0]}</span>
                      </div>
                    </div>
                    <button className="btn-resume" onClick={() => {
                      if (courseContent?.modules?.[0]) {
                        setExpandedModules(prev => ({ ...prev, [courseContent.modules[0].id]: true }));
                      }
                    }}>
                      Resume Learning
                    </button>
                  </div>
                </div>
                <div className="course-hero-right">
                  <div className="medal-icon">🏅</div>
                  <div className="progress-circle-container">
                    <svg className="progress-circle" viewBox="0 0 120 120">
                      <circle className="progress-bg" cx="60" cy="60" r="54" />
                      <circle 
                        className="progress-fill-circle" 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
                      />
                    </svg>
                    <div className="progress-text-center">
                      <span className="progress-number">{progressPercent}%</span>
                      <span className="progress-label">Progress</span>
                    </div>
                  </div>
                  <div className="lessons-count">
                    <span className="lessons-label">Lessons:</span>
                    <span className="lessons-value">{viewedFiles.length}/{courseContent?.totalFiles || 157}</span>
                  </div>
                </div>
              </div>

              {/* Module Accordions */}
              <div className="section-header modules-header">
                <h3>Course Modules</h3>
                <p className="course-subtitle">
                  {courseContent ? `${courseContent.modulesCount} modules • ${courseContent.totalFiles} files` : 'Loading...'}
                </p>
              </div>

              {contentLoading ? (
                <div className="loading-container">
                  <div className="loader"></div>
                  <p>Loading course content...</p>
                </div>
              ) : courseContent && courseContent.modules && courseContent.modules.length > 0 ? (
                <div className="modules-accordion">
                  {courseContent.modules.map((module) => (
                    <div key={module.id} className={`accordion-module ${expandedModules[module.id] ? 'expanded' : ''}`}>
                      <div className="accordion-header" onClick={() => toggleModule(module.id)}>
                        <div className="accordion-left">
                          <span className="module-label">Module {module.id}</span>
                          <h3 className="module-title">{module.displayName || module.name}</h3>
                          <div className="module-meta">
                            <span>{module.filesCount} Lessons</span>
                            <span>•</span>
                            <span>4 weeks</span>
                            <span>•</span>
                            <span>5 credits</span>
                            <span>•</span>
                            <a href="#" className="ebook-link" onClick={(e) => e.stopPropagation()}>EBook ↗</a>
                          </div>
                        </div>
                        <div className="accordion-right">
                          <div className="progress-info">
                            <span className="progress-label">Progress ⓘ</span>
                            <div className="progress-bar-container">
                              <span className="progress-percent">0%</span>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '0%' }}></div>
                              </div>
                            </div>
                          </div>
                          <button className="accordion-toggle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points={expandedModules[module.id] ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {expandedModules[module.id] && (
                        <div className="accordion-content">
                          <div className="files-grid">
                            {module.files && module.files.map((file) => {
                              const fileKey = file.path || file.name;
                              const isViewed = viewedFiles.includes(fileKey);
                              return (
                                <div 
                                  key={file.id} 
                                  className={`file-card ${file.canOpenInColab ? 'notebook' : ''} ${isViewed ? 'viewed' : ''}`}
                                  onClick={() => handleFileClick(file)}
                                >
                                  {isViewed && <span className="viewed-check">✓</span>}
                                  <span className="file-icon-large">{file.icon}</span>
                                  <div className="file-details">
                                    <span className="file-name">{file.displayName || file.name}</span>
                                    <span className="file-type-badge">{file.type}</span>
                                  </div>
                                  {file.canOpenInColab && (
                                    <span className="colab-tag">Colab</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback to static course data for Cybersecurity */
                <div className="modules-accordion">
                  {courseData.modules_detail.map((module) => (
                    <div key={module.id} className={`accordion-module ${expandedModules[module.id] ? 'expanded' : ''}`}>
                      <div className="accordion-header" onClick={() => toggleModule(module.id)}>
                        <div className="accordion-left">
                          <span className="module-label">Module {module.id}</span>
                          <h3 className="module-title">{module.name.replace(/^Module \d+:\s*/, '')}</h3>
                          <div className="module-meta">
                            <span>{module.lessons} Lessons</span>
                            <span>•</span>
                            <span>{module.duration}</span>
                            <span>•</span>
                            <span>5 credits</span>
                            <span>•</span>
                            <a href="#" className="ebook-link" onClick={(e) => e.stopPropagation()}>EBook ↗</a>
                          </div>
                        </div>
                        <div className="accordion-right">
                          <div className="progress-info">
                            <span className="progress-label">Progress ⓘ</span>
                            <div className="progress-bar-container">
                              <span className="progress-percent">{module.progress}%</span>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${module.progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <button className="accordion-toggle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points={expandedModules[module.id] ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {expandedModules[module.id] && (
                        <div className="accordion-content">
                          <div className="chapters-accordion">
                            {module.chapters.map((chapter) => (
                              <div key={chapter.id} className="chapter-card">
                                <div className="chapter-header-acc">
                                  <span className="chapter-num">Chapter {chapter.id}</span>
                                  <h4>{chapter.title}</h4>
                                </div>
                                <div className="lessons-grid">
                                  {chapter.lessons.map((lesson, idx) => (
                                    <div key={idx} className="lesson-card">
                                      <span className="lesson-icon">📖</span>
                                      <span className="lesson-text">{lesson}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'activity' && (
            <div className="section">
              <div className="section-header">
                <h2>Practice Cyber Security</h2>
                <p className="section-subtitle">Hands-on labs and challenges to sharpen your hacking skills</p>
              </div>

              {/* Practice Security Challenges */}
              <div className="practice-section">
                <h3>Security Challenges</h3>
                <div className="practice-assessments-grid">
                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">🔐</div>
                    </div>
                    <div className="assessment-content">
                      <h4>Network Security Challenges</h4>
                      <p className="assessment-meta">8 Questions | 90 Min</p>
                      <p className="assessment-desc">Test your network security skills with real-world scenarios</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">🛡️</div>
                    </div>
                    <div className="assessment-content">
                      <h4>Web Application Security Lab</h4>
                      <p className="assessment-meta">6 Questions | 120 Min</p>
                      <p className="assessment-desc">Exploit vulnerabilities in web applications</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">⚔️</div>
                    </div>
                    <div className="assessment-content">
                      <h4>CTF Challenges</h4>
                      <p className="assessment-meta">10 Questions | 180 Min</p>
                      <p className="assessment-desc">Capture the flag challenges for advanced hackers</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">🔓</div>
                    </div>
                    <div className="assessment-content">
                      <h4>Cryptography Lab</h4>
                      <p className="assessment-meta">5 Questions | 60 Min</p>
                      <p className="assessment-desc">Crack encryption and decode messages</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">🎭</div>
                    </div>
                    <div className="assessment-content">
                      <h4>Social Engineering Scenarios</h4>
                      <p className="assessment-meta">7 Questions | 75 Min</p>
                      <p className="assessment-desc">Master the art of social engineering attacks</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon">🔍</div>
                    </div>
                    <div className="assessment-content">
                      <h4>Forensics Investigation</h4>
                      <p className="assessment-meta">9 Questions | 150 Min</p>
                      <p className="assessment-desc">Investigate digital crimes and analyze evidence</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Practice Quizzes */}
              <div className="practice-section">
                <h3>Certification Practice Tests</h3>
                <div className="practice-assessments-grid">
                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon nn-icon">CEH</div>
                    </div>
                    <div className="assessment-content">
                      <h4>CEH Mock Exam</h4>
                      <p className="assessment-desc">125 Questions | 4 Hours</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon microsoft-icon">🔒</div>
                    </div>
                    <div className="assessment-content">
                      <h4>CompTIA Security+ Practice Test</h4>
                      <p className="assessment-desc">90 Questions | 90 Min</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>

                  <div className="assessment-card">
                    <div className="assessment-header">
                      <div className="assessment-icon meta-icon">🌐</div>
                    </div>
                    <div className="assessment-content">
                      <h4>OSCP Preparation Quiz</h4>
                      <p className="assessment-desc">50 Questions | 120 Min</p>
                      <button className="btn-start">Start now →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="section">
              <div className="section-header">
                <h2>{isDataScience() ? 'Data Science Projects' : 'Cyber Security Projects'}</h2>
                <p className="section-subtitle">Build real-world projects to demonstrate your skills</p>
              </div>

              {/* Capstone Projects */}
              <div className="projects-section">
                <h3>Capstone Projects</h3>
                {projects.length > 0 ? (
                  <div className="capstone-projects-grid">
                    {projects.map((project, index) => {
                      const colors = ['#ffe6e6', '#fff0e6', '#e6f0ff', '#e6ffe6', '#f0e6ff', '#ffe6f0'];
                      const icons = isDataScience() 
                        ? ['📊', '🏠', '🎬', '📈', '🛒', '🤖', '📉', '💹']
                        : ['🔐', '🌐', '📡', '🦠', '☁️', '🔴', '🎯', '🛡️'];
                      return (
                        <div key={project.id} className="capstone-card">
                          <div className="capstone-icon" style={{ background: colors[index % colors.length] }}>
                            {icons[index % icons.length]}
                          </div>
                          <h4>{project.title}</h4>
                          <p className="capstone-course">{project.difficulty || 'Intermediate'} Level Project</p>
                          <p className="project-desc">{project.description}</p>
                          {project.requirements && (
                            <p className="project-requirements"><strong>Requirements:</strong> {project.requirements}</p>
                          )}
                          {project.deliverables && (
                            <p className="project-deliverables"><strong>Deliverables:</strong> {project.deliverables}</p>
                          )}
                          <div className="project-meta">
                            {project.duration && <span>⏱️ {project.duration}</span>}
                            {project.difficulty && <span>🎯 {project.difficulty}</span>}
                          </div>
                          {project.skills && project.skills.length > 0 && (
                            <div className="project-skills">
                              {project.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          )}
                          <button className="btn-start">Start Project →</button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Show static capstone projects if no Firebase projects */
                  <div className="capstone-projects-grid">
                    {capstoneProjects.map((project) => (
                      <div key={project.id} className="capstone-card">
                        <div className="capstone-icon" style={{ background: project.color }}>
                          {project.icon}
                        </div>
                        <h4>{project.title}</h4>
                        <p className="capstone-course">{project.description}</p>
                        <button className="btn-start">Start Project →</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'career' && (
            <div className="section">
              <div className="section-header">
                <h2>Career Development</h2>
                <p className="section-subtitle">Launch your {isDataScience() ? 'data science' : 'cybersecurity'} career with expert guidance</p>
              </div>

              {/* Career Resources */}
              <div className="career-section">
                <div className="career-stats">
                  <div className="career-stat-card">
                    <div className="stat-icon">💼</div>
                    <h3>{isDataScience() ? '1200+' : '850+'}</h3>
                    <p>Job Opportunities</p>
                  </div>
                  <div className="career-stat-card">
                    <div className="stat-icon">🏢</div>
                    <h3>{isDataScience() ? '350+' : '200+'}</h3>
                    <p>Hiring Partners</p>
                  </div>
                  <div className="career-stat-card">
                    <div className="stat-icon">💰</div>
                    <h3>{isDataScience() ? '$120K' : '$95K'}</h3>
                    <p>Average Salary</p>
                  </div>
                  <div className="career-stat-card">
                    <div className="stat-icon">📈</div>
                    <h3>92%</h3>
                    <p>Placement Rate</p>
                  </div>
                </div>

                <h3>Career Services</h3>
                <div className="career-services-grid">
                  <div className="service-card">
                    <div className="service-icon">📝</div>
                    <h4>Resume Building</h4>
                    <p>Get expert help crafting an ATS-friendly {isDataScience() ? 'data science' : 'cybersecurity'} resume that stands out</p>
                    <button className="btn-secondary">Build Resume</button>
                  </div>

                  <div className="service-card">
                    <div className="service-icon">🎤</div>
                    <h4>Interview Preparation</h4>
                    <p>Practice with mock interviews and get feedback from industry professionals</p>
                    <button className="btn-secondary">Start Practice</button>
                  </div>

                  <div className="service-card">
                    <div className="service-icon">🎯</div>
                    <h4>Career Counseling</h4>
                    <p>One-on-one sessions with career advisors to plan your {isDataScience() ? 'data science' : 'cybersecurity'} path</p>
                    <button className="btn-secondary">Book Session</button>
                  </div>

                  <div className="service-card">
                    <div className="service-icon">🌐</div>
                    <h4>LinkedIn Optimization</h4>
                    <p>Optimize your LinkedIn profile to attract recruiters and opportunities</p>
                    <button className="btn-secondary">Optimize Profile</button>
                  </div>

                  <div className="service-card">
                    <div className="service-icon">📚</div>
                    <h4>Portfolio Development</h4>
                    <p>Build a professional portfolio showcasing your projects and skills</p>
                    <button className="btn-secondary">Create Portfolio</button>
                  </div>

                  <div className="service-card">
                    <div className="service-icon">🤝</div>
                    <h4>Networking Events</h4>
                    <p>Connect with industry professionals at exclusive networking events</p>
                    <button className="btn-secondary">View Events</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'mentorship' && (
            <div className="section">
              <div className="section-header">
                <h2>Mentorship Program</h2>
                <p className="section-subtitle">Learn from experienced cybersecurity professionals</p>
              </div>

              {/* Mentors Grid */}
              <div className="mentorship-section">
                <h3>Available Mentors</h3>
                <div className="mentors-grid">
                  <div className="mentor-card">
                    <div className="mentor-avatar">👨‍💻</div>
                    <h4>John Smith</h4>
                    <p className="mentor-title">Senior Penetration Tester</p>
                    <p className="mentor-company">Google | 12 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">Pentesting</span>
                      <span className="skill-tag">Web Security</span>
                      <span className="skill-tag">Network Security</span>
                    </div>
                    <p className="mentor-desc">Specialized in web application security and penetration testing</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>

                  <div className="mentor-card">
                    <div className="mentor-avatar">👩‍💻</div>
                    <h4>Sarah Johnson</h4>
                    <p className="mentor-title">Security Architect</p>
                    <p className="mentor-company">Microsoft | 10 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">Cloud Security</span>
                      <span className="skill-tag">IAM</span>
                      <span className="skill-tag">Compliance</span>
                    </div>
                    <p className="mentor-desc">Expert in cloud security architecture and compliance frameworks</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>

                  <div className="mentor-card">
                    <div className="mentor-avatar">👨‍💼</div>
                    <h4>Michael Chen</h4>
                    <p className="mentor-title">Red Team Lead</p>
                    <p className="mentor-company">Amazon | 8 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">Red Teaming</span>
                      <span className="skill-tag">OSINT</span>
                      <span className="skill-tag">Social Engineering</span>
                    </div>
                    <p className="mentor-desc">Leads red team operations and advanced threat simulations</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>

                  <div className="mentor-card">
                    <div className="mentor-avatar">👩‍🔬</div>
                    <h4>Emily Davis</h4>
                    <p className="mentor-title">Malware Analyst</p>
                    <p className="mentor-company">CrowdStrike | 9 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">Malware Analysis</span>
                      <span className="skill-tag">Reverse Engineering</span>
                      <span className="skill-tag">Threat Intel</span>
                    </div>
                    <p className="mentor-desc">Specializes in advanced malware analysis and threat intelligence</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>

                  <div className="mentor-card">
                    <div className="mentor-avatar">👨‍🏫</div>
                    <h4>David Martinez</h4>
                    <p className="mentor-title">Security Consultant</p>
                    <p className="mentor-company">Deloitte | 15 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">GRC</span>
                      <span className="skill-tag">Risk Management</span>
                      <span className="skill-tag">Auditing</span>
                    </div>
                    <p className="mentor-desc">Expert in governance, risk, and compliance strategies</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>

                  <div className="mentor-card">
                    <div className="mentor-avatar">👩‍⚖️</div>
                    <h4>Lisa Anderson</h4>
                    <p className="mentor-title">Incident Response Lead</p>
                    <p className="mentor-company">FireEye | 11 years exp</p>
                    <div className="mentor-skills">
                      <span className="skill-tag">Incident Response</span>
                      <span className="skill-tag">Forensics</span>
                      <span className="skill-tag">SIEM</span>
                    </div>
                    <p className="mentor-desc">Leads incident response teams and digital forensics investigations</p>
                    <button className="btn-primary">Request Mentorship</button>
                  </div>
                </div>

                <div className="mentorship-benefits">
                  <h3>Mentorship Benefits</h3>
                  <div className="benefits-grid">
                    <div className="benefit-item">
                      <span className="benefit-icon">🎯</span>
                      <p>Personalized career guidance</p>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">💡</span>
                      <p>Industry insights and trends</p>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">🔍</span>
                      <p>Code and project reviews</p>
                    </div>
                    <div className="benefit-item">
                      <span className="benefit-icon">🤝</span>
                      <p>Networking opportunities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'jobboard' && (
            <div className="section">
              <div className="section-header">
                <h2>Job Board</h2>
                <p className="section-subtitle">Find your dream cybersecurity job</p>
              </div>

              {/* Job Filters */}
              <div className="job-filters">
                <input type="text" placeholder="Search jobs..." className="search-input" />
                <select className="filter-select">
                  <option>All Locations</option>
                  <option>Remote</option>
                  <option>On-site</option>
                  <option>Hybrid</option>
                </select>
                <select className="filter-select">
                  <option>All Experience Levels</option>
                  <option>Entry Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                </select>
                <select className="filter-select">
                  <option>All Job Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>

              {/* Job Listings */}
              <div className="jobs-section">
                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Penetration Tester</h4>
                      <p className="company-name">Google</p>
                    </div>
                    <span className="job-badge new">New</span>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 Remote</span>
                    <span className="job-detail">💰 $95K - $130K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 2 days ago</span>
                  </div>
                  <p className="job-description">
                    We're seeking an experienced penetration tester to join our security team. You'll conduct security assessments and help protect our infrastructure.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">Pentesting</span>
                    <span className="skill-tag">Kali Linux</span>
                    <span className="skill-tag">Burp Suite</span>
                    <span className="skill-tag">Python</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>

                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Security Analyst</h4>
                      <p className="company-name">Microsoft</p>
                    </div>
                    <span className="job-badge">Featured</span>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 Seattle, WA</span>
                    <span className="job-detail">💰 $80K - $110K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 5 days ago</span>
                  </div>
                  <p className="job-description">
                    Join our security operations center and monitor threats, investigate incidents, and implement security controls.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">SIEM</span>
                    <span className="skill-tag">Incident Response</span>
                    <span className="skill-tag">Threat Analysis</span>
                    <span className="skill-tag">Splunk</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>

                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Cloud Security Engineer</h4>
                      <p className="company-name">Amazon Web Services</p>
                    </div>
                    <span className="job-badge new">New</span>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 Remote</span>
                    <span className="job-detail">💰 $110K - $150K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 1 day ago</span>
                  </div>
                  <p className="job-description">
                    Design and implement security solutions for cloud infrastructure. Experience with AWS security services required.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">AWS</span>
                    <span className="skill-tag">Cloud Security</span>
                    <span className="skill-tag">IAM</span>
                    <span className="skill-tag">Terraform</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>

                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Cybersecurity Consultant</h4>
                      <p className="company-name">Deloitte</p>
                    </div>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 New York, NY</span>
                    <span className="job-detail">💰 $90K - $125K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 1 week ago</span>
                  </div>
                  <p className="job-description">
                    Work with clients to assess security posture, develop strategies, and implement security frameworks and controls.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">GRC</span>
                    <span className="skill-tag">Risk Assessment</span>
                    <span className="skill-tag">NIST</span>
                    <span className="skill-tag">ISO 27001</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>

                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Malware Analyst</h4>
                      <p className="company-name">CrowdStrike</p>
                    </div>
                    <span className="job-badge">Featured</span>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 Remote</span>
                    <span className="job-detail">💰 $100K - $140K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 3 days ago</span>
                  </div>
                  <p className="job-description">
                    Analyze malware samples, reverse engineer threats, and develop detection signatures for our threat intelligence platform.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">Reverse Engineering</span>
                    <span className="skill-tag">IDA Pro</span>
                    <span className="skill-tag">Assembly</span>
                    <span className="skill-tag">Malware Analysis</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>

                <div className="job-card">
                  <div className="job-header">
                    <div className="company-logo">🏢</div>
                    <div className="job-title-section">
                      <h4>Application Security Engineer</h4>
                      <p className="company-name">Facebook (Meta)</p>
                    </div>
                  </div>
                  <div className="job-details">
                    <span className="job-detail">📍 Menlo Park, CA</span>
                    <span className="job-detail">💰 $120K - $160K</span>
                    <span className="job-detail">⏱️ Full-time</span>
                    <span className="job-detail">📅 Posted 4 days ago</span>
                  </div>
                  <p className="job-description">
                    Secure our applications by conducting code reviews, security testing, and implementing secure development practices.
                  </p>
                  <div className="job-skills">
                    <span className="skill-tag">AppSec</span>
                    <span className="skill-tag">SAST/DAST</span>
                    <span className="skill-tag">OWASP</span>
                    <span className="skill-tag">Secure Coding</span>
                  </div>
                  <button className="btn-primary">Apply Now</button>
                </div>
              </div>
            </div>
          )}

          {/* Live Classes Section */}
          {activeSection === 'liveClasses' && (
            <div className="section live-classes-section">
              <div className="section-header">
                <h2>📡 Live Classes</h2>
                <p className="section-subtitle">Join your scheduled live Zoom sessions</p>
              </div>

              {(() => {
                // Filter live classes for user's course
                const userCourse = user?.currentCourse || '';
                const filteredClasses = liveClasses.filter(cls => {
                  if (userCourse.toLowerCase().includes('data science') || userCourse.toLowerCase().includes('ai')) {
                    return cls.course?.includes('Data Science');
                  }
                  if (userCourse.toLowerCase().includes('cyber') || userCourse.toLowerCase().includes('ethical')) {
                    return cls.course?.includes('Cyber Security');
                  }
                  return true; // Show all if course not matched
                });

                // Separate upcoming and past classes
                const now = new Date();
                const upcomingClasses = filteredClasses
                  .filter(cls => {
                    const classDateTime = new Date(cls.scheduledDate + ' ' + cls.scheduledTime);
                    return classDateTime >= now;
                  })
                  .sort((a, b) => new Date(a.scheduledDate + ' ' + a.scheduledTime) - new Date(b.scheduledDate + ' ' + b.scheduledTime));

                const pastClasses = filteredClasses
                  .filter(cls => {
                    const classDateTime = new Date(cls.scheduledDate + ' ' + cls.scheduledTime);
                    return classDateTime < now;
                  })
                  .sort((a, b) => new Date(b.scheduledDate + ' ' + b.scheduledTime) - new Date(a.scheduledDate + ' ' + a.scheduledTime));

                return (
                  <>
                    {/* Upcoming Classes */}
                    <div className="live-classes-upcoming">
                      <h3 style={{marginBottom: '20px', color: '#2c3e50'}}>
                        🔴 Upcoming Sessions
                      </h3>
                      
                      {upcomingClasses.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">📅</div>
                          <p>No upcoming live classes scheduled yet.</p>
                          <p className="empty-note">New sessions will be announced soon!</p>
                        </div>
                      ) : (
                        <div className="live-classes-grid">
                          {upcomingClasses.map(cls => {
                            const classDateTime = new Date(cls.scheduledDate + ' ' + cls.scheduledTime);
                            const isToday = classDateTime.toDateString() === new Date().toDateString();
                            const timeUntil = Math.ceil((classDateTime - now) / (1000 * 60 * 60)); // hours

                            return (
                              <div key={cls.id} className="live-class-card upcoming">
                                {isToday && <div className="today-badge">TODAY</div>}
                                
                                <div className="class-header">
                                  <h4>{cls.title}</h4>
                                  <span className="course-tag">{cls.course}</span>
                                </div>

                                <div className="class-details">
                                  <div className="detail-row">
                                    <span className="icon">📅</span>
                                    <span>{new Date(cls.scheduledDate).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="icon">⏰</span>
                                    <span>{cls.scheduledTime} ({cls.duration})</span>
                                  </div>
                                  {cls.instructor && (
                                    <div className="detail-row">
                                      <span className="icon">👨‍🏫</span>
                                      <span>{cls.instructor}</span>
                                    </div>
                                  )}
                                  {timeUntil <= 24 && (
                                    <div className="detail-row time-until">
                                      <span className="icon">⏳</span>
                                      <span className="highlight">Starts in {timeUntil} hour{timeUntil !== 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                </div>

                                {cls.description && (
                                  <p className="class-description">{cls.description}</p>
                                )}

                                <button 
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('token');
                                      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
                                      const response = await fetch(`${apiUrl}/api/zoom/join/${cls.id}`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      });
                                      const data = await response.json();
                                      
                                      if (data.success && data.joinUrl) {
                                        // Open Zoom meeting in new tab
                                        window.open(data.joinUrl, '_blank');
                                      } else if (cls.zoomLink) {
                                        // Fallback to direct link
                                        window.open(cls.zoomLink, '_blank');
                                      } else {
                                        alert('Unable to join meeting. Please contact support.');
                                      }
                                    } catch (error) {
                                      console.error('Error joining meeting:', error);
                                      // Fallback to direct link if API fails
                                      if (cls.zoomLink) {
                                        window.open(cls.zoomLink, '_blank');
                                      }
                                    }
                                  }}
                                  className="join-class-btn"
                                >
                                  📡 Join Live Class
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Past Classes */}
                    {pastClasses.length > 0 && (
                      <div className="live-classes-past" style={{marginTop: '40px'}}>
                        <h3 style={{marginBottom: '20px', color: '#2c3e50'}}>
                          ✅ Past Sessions
                        </h3>
                        <div className="past-classes-list">
                          {pastClasses.slice(0, 5).map(cls => (
                            <div key={cls.id} className="past-class-item">
                              <div className="past-class-info">
                                <h4>{cls.title}</h4>
                                <span className="past-date">
                                  {new Date(cls.scheduledDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} • {cls.scheduledTime}
                                </span>
                              </div>
                              <span className="completed-badge">Completed</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Classroom Section */}
          {activeSection === 'classroom' && (
            <div className="section classroom-section">
              <div className="section-header">
                <h2>🎥 Classroom</h2>
                <p className="section-subtitle">Your live class sessions and recordings</p>
              </div>

              {classroomSessions.length === 0 ? (
                /* No videos available message */
                <div className="empty-classroom">
                  <div className="empty-icon">📹</div>
                  <h3>No Recordings Available Yet</h3>
                  <p>Class recordings for {isDataScience() ? 'Data Science' : 'Cyber Security'} will appear here once live sessions begin.</p>
                  <p className="empty-note">Stay tuned! New recordings will be added after each live class session.</p>
                </div>
              ) : selectedVideo ? (
                /* Video Player View */
                <div className="video-player-container">
                  <button 
                    className="back-to-videos-btn"
                    onClick={() => setSelectedVideo(null)}
                  >
                    ← Back to Classes
                  </button>
                  
                  <div className="video-player-wrapper">
                    {selectedVideo.source === 'zoom' && selectedVideo.videoUrl ? (
                      // Zoom recording player
                      <iframe
                        src={selectedVideo.videoUrl}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        title={selectedVideo.title}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    ) : selectedVideo.driveId ? (
                      // Google Drive player
                      <>
                        <iframe
                          src={`https://drive.google.com/file/d/${selectedVideo.driveId}/preview`}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          title={selectedVideo.title}
                          sandbox="allow-scripts allow-same-origin"
                        />
                        {/* Overlay to block Google Drive redirect buttons */}
                        <div className="video-overlay-top"></div>
                        <div className="video-overlay-bottom"></div>
                      </>
                    ) : (
                      <div className="no-video-message">Video not available</div>
                    )}
                  </div>

                  <div className="video-info-panel">
                    <h3>{selectedVideo.title}</h3>
                    <div className="video-meta">
                      <span>📅 {formatClassDate(selectedVideo.date)}</span>
                      <span>⏱️ {selectedVideo.duration}</span>
                      <span>👨‍🏫 {selectedVideo.instructor}</span>
                      {selectedVideo.source === 'zoom' && (
                        <span>☁️ Zoom Recording</span>
                      )}
                    </div>
                    {selectedVideo.source === 'zoom' && selectedVideo.downloadUrl && (
                      <a 
                        href={selectedVideo.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="download-btn"
                      >
                        📥 Download Recording
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Class List View */
                <div className="classroom-timeline">
                  {Object.keys(groupedSessions)
                    .sort((a, b) => new Date(b) - new Date(a))
                    .map((date) => (
                      <div key={date} className="date-group">
                        <div className="date-header">
                          <div className="date-line"></div>
                          <span className="date-text">{formatClassDate(date)}</span>
                        </div>
                        
                        {groupedSessions[date].map((session) => (
                          <div key={session.id} className="class-session-card">
                            <div className="session-type-badge">{session.type}</div>
                            
                            <div className="session-main">
                              <div className="session-left">
                                <h3 className="session-title">{session.title}</h3>
                                
                                <div className="session-details">
                                  <div className="detail-item instructor">
                                    <span className="detail-label">INSTRUCTOR</span>
                                    <div className="instructor-info">
                                      <span 
                                        className="instructor-avatar" 
                                        style={{ backgroundColor: session.instructorColor }}
                                      >
                                        {session.instructorInitial}
                                      </span>
                                      <span className="instructor-name">{session.instructor}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="detail-item">
                                    <span className="detail-label">DURATION</span>
                                    <div className="detail-value">
                                      <span className="detail-icon">⏱️</span>
                                      {session.duration}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="session-right">
                                <div className="session-actions">
                                  <button 
                                    className="btn-recording"
                                    onClick={() => setSelectedVideo(session)}
                                  >
                                    Recording
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              )}

              <div className="classroom-info-box">
                <h4>📢 Note for Students</h4>
                <p>New class recordings are added within 24 hours after each live session. Click on "Recording" to watch the class.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Profile</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="profile-content">
              <div className="profile-avatar-section">
                <div className="large-avatar">{user?.name?.charAt(0)}</div>
              </div>

              <div className="profile-details">
                <div className="detail-group">
                  <label>Full Name</label>
                  <p>{user?.name || 'N/A'}</p>
                </div>

                <div className="detail-group">
                  <label>Email Address</label>
                  <p>{user?.email || 'N/A'}</p>
                </div>

                <div className="detail-group">
                  <label>Student ID</label>
                  <p>{user?.enrollmentNumber || 'SU-2025-001'}</p>
                </div>

                <div className="detail-group">
                  <label>Role</label>
                  <p className="badge-role">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Student'}</p>
                </div>

                <div className="detail-group">
                  <label>Current Course</label>
                  <p>{user?.currentCourse || 'Cyber Security & Ethical Hacking'}</p>
                </div>

                <div className="detail-group">
                  <label>Progress</label>
                  <p>0% - Just Started</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-edit">Edit Profile</button>
              <button className="btn-download">Download Certificate</button>
              <button className="btn-close" onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Button */}
      <button 
        className="help-button"
        onClick={() => setShowHelpMenu(!showHelpMenu)}
        title="Help"
      >
        <span className="help-icon">?</span>
        <span className="help-text">Help</span>
      </button>

      {/* Help Menu Popup */}
      {showHelpMenu && (
        <div className="help-menu">
          <button className="help-menu-item" onClick={() => alert('Live Support coming soon!')}>
            <span className="help-menu-icon">💬</span>
            <span>Live Support</span>
          </button>
          <button className="help-menu-item" onClick={() => alert('Resources coming soon!')}>
            <span className="help-menu-icon">📚</span>
            <span>Resources</span>
          </button>
          <button className="help-menu-item" onClick={() => alert('Raise a ticket coming soon!')}>
            <span className="help-menu-icon">🎫</span>
            <span>Raise a ticket</span>
          </button>
          <button className="help-menu-item" onClick={() => alert('AI Chat coming soon!')}>
            <span className="help-menu-icon">🤖</span>
            <span>AI Chat</span>
          </button>
          <button 
            className="help-menu-close"
            onClick={() => setShowHelpMenu(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
