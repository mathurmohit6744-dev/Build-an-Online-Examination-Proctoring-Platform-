import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Subject,
  Question,
  Exam,
  ExamAttempt,
  ProctoringEvent,
  AuditLog,
} from '../types/index.ts';

interface DatabaseSchema {
  users: User[];
  subjects: Subject[];
  questions: Question[];
  exams: Exam[];
  attempts: ExamAttempt[];
  proctoringEvents: ProctoringEvent[];
  auditLogs: AuditLog[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'examsecure_db.json');

// Memory cache
let db: DatabaseSchema = {
  users: [],
  subjects: [],
  questions: [],
  exams: [],
  attempts: [],
  proctoringEvents: [],
  auditLogs: [],
};

// Seed helper
function generateSeedData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const teacherHash = bcrypt.hashSync('Teacher@123', salt);
  const studentHash = bcrypt.hashSync('Student@123', salt);

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Dr. Arthur Vance (Dean/Admin)',
      email: 'admin@examsecure.io',
      passwordHash: adminHash,
      role: 'ADMIN',
      department: 'School of Computing & Engineering',
      createdAt: '2026-01-15T08:00:00Z',
    },
    {
      id: 'usr-teacher-1',
      name: 'Prof. Elena Rostova',
      email: 'teacher@examsecure.io',
      passwordHash: teacherHash,
      role: 'TEACHER',
      department: 'Computer Science Department',
      createdAt: '2026-02-01T09:30:00Z',
    },
    {
      id: 'usr-teacher-2',
      name: 'Dr. Marcus Vance',
      email: 'marcus@examsecure.io',
      passwordHash: teacherHash,
      role: 'TEACHER',
      department: 'Cybersecurity & InfoSec',
      createdAt: '2026-02-10T10:00:00Z',
    },
    {
      id: 'usr-student-1',
      name: 'Mohit Mathur',
      email: 'student@examsecure.io',
      passwordHash: studentHash,
      role: 'STUDENT',
      studentId: 'CS2026-0491',
      department: 'Computer Science',
      createdAt: '2026-02-15T11:00:00Z',
    },
    {
      id: 'usr-student-2',
      name: 'Jane Doe',
      email: 'jane.doe@examsecure.io',
      passwordHash: studentHash,
      role: 'STUDENT',
      studentId: 'CS2026-0512',
      department: 'Software Engineering',
      createdAt: '2026-02-16T12:00:00Z',
    },
    {
      id: 'usr-student-3',
      name: 'Liam Chen',
      email: 'liam.chen@examsecure.io',
      passwordHash: studentHash,
      role: 'STUDENT',
      studentId: 'CS2026-0883',
      department: 'Computer Science',
      createdAt: '2026-02-17T14:20:00Z',
    },
  ];

  const subjects: Subject[] = [
    {
      id: 'sub-cs-301',
      code: 'CS-301',
      name: 'Full-Stack Web Architecture & Security',
      description: 'Covers modern client-server models, microservices, token authorization, RESTful patterns, and web vulnerabilities.',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'sub-cyber-204',
      code: 'CYBER-204',
      name: 'Cryptography & Network Defense',
      description: 'Symmetric and asymmetric encryption, digital certificates, TLS handshakes, packet sniffing, and zero-trust concepts.',
      createdAt: '2026-01-12T11:00:00Z',
    },
    {
      id: 'sub-ds-101',
      code: 'DS-101',
      name: 'Data Structures & Algorithms',
      description: 'Algorithmic complexity, balanced trees, graph traversal, dynamic programming, and memory allocation.',
      createdAt: '2026-01-14T09:00:00Z',
    },
  ];

  const questions: Question[] = [
    // Questions for CS-301
    {
      id: 'q-cs-1',
      subjectId: 'sub-cs-301',
      topic: 'Authentication & Tokens',
      questionText: 'Which HTTP header attribute prevents JavaScript from reading the session cookie, directly defending against Cross-Site Scripting (XSS) token theft?',
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      marks: 2,
      negativeMarks: 0.5,
      options: [
        { id: 'opt-1-1', text: 'SameSite=Strict', isCorrect: false },
        { id: 'opt-1-2', text: 'HttpOnly', isCorrect: true },
        { id: 'opt-1-3', text: 'Secure', isCorrect: false },
        { id: 'opt-1-4', text: 'Domain-Scoped', isCorrect: false },
      ],
      explanation: 'The `HttpOnly` flag directs the browser to block any client-side script from accessing document.cookie, mitigating XSS-based credential stealing.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'q-cs-2',
      subjectId: 'sub-cs-301',
      topic: 'API Design',
      questionText: 'Select ALL the HTTP methods that are considered idempotent according to RFC 9110 specification:',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      marks: 3,
      negativeMarks: 1,
      options: [
        { id: 'opt-2-1', text: 'GET', isCorrect: true },
        { id: 'opt-2-2', text: 'POST', isCorrect: false },
        { id: 'opt-2-3', text: 'PUT', isCorrect: true },
        { id: 'opt-2-4', text: 'DELETE', isCorrect: true },
        { id: 'opt-2-5', text: 'PATCH', isCorrect: false },
      ],
      explanation: 'GET, PUT, and DELETE are idempotent because executing them repeatedly results in identical resource state. POST creates new entries and PATCH can be non-idempotent.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T10:30:00Z',
      updatedAt: '2026-02-01T10:30:00Z',
    },
    {
      id: 'q-cs-3',
      subjectId: 'sub-cs-301',
      topic: 'State & Realtime',
      questionText: 'In a WebRTC peer-to-peer connection, the ICE (Interactive Connectivity Establishment) protocol is primarily responsible for traversing NATs and firewalls.',
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      marks: 1,
      negativeMarks: 0,
      options: [
        { id: 'opt-3-1', text: 'True', isCorrect: true },
        { id: 'opt-3-2', text: 'False', isCorrect: false },
      ],
      explanation: 'True. ICE coordinates STUN and TURN candidates to establish the shortest direct peer connection path across diverse NAT networks.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T11:00:00Z',
      updatedAt: '2026-02-01T11:00:00Z',
    },
    {
      id: 'q-cs-4',
      subjectId: 'sub-cs-301',
      topic: 'Security Mechanisms',
      questionText: 'What standard HTTP header is used by servers to declare which origins, scripts, and media resources the client browser is permitted to load?',
      type: 'SHORT_ANSWER',
      difficulty: 'MEDIUM',
      marks: 2,
      negativeMarks: 0,
      correctShortAnswer: 'Content-Security-Policy',
      explanation: 'Content-Security-Policy (CSP) specifies allowed domains and hashes for scripts, styles, frames, and images.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T11:20:00Z',
      updatedAt: '2026-02-01T11:20:00Z',
    },
    {
      id: 'q-cs-5',
      subjectId: 'sub-cs-301',
      topic: 'Architecture & Scalability',
      questionText: 'Explain the difference between Optimistic Concurrency Control and Pessimistic Locking in database transactions. When would you prefer Optimistic concurrency in a high-scale online examination platform?',
      type: 'DESCRIPTIVE',
      difficulty: 'HARD',
      marks: 5,
      negativeMarks: 0,
      sampleDescriptiveAnswer: 'Pessimistic locking acquires exclusive locks on records before modifying, blocking other transactions. Optimistic Concurrency Control allows reads and updates without locks, checking a version or timestamp at commit time. In an exam autosave system, Optimistic locking is superior because thousands of students update distinct attempt rows simultaneously without holding database locks, reducing row contention and maximizing throughput.',
      explanation: 'Requires manual grading by the teacher. Evaluated based on understanding of locks, contention, versioning columns, and high-concurrency exam autosave throughput.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T11:45:00Z',
      updatedAt: '2026-02-01T11:45:00Z',
    },
    {
      id: 'q-cs-6',
      subjectId: 'sub-cs-301',
      topic: 'Relational vs Non-Relational',
      questionText: 'Which normalization normal form (NF) requires removing transitive dependencies between non-key attributes?',
      type: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      marks: 2,
      negativeMarks: 0.5,
      options: [
        { id: 'opt-6-1', text: 'First Normal Form (1NF)', isCorrect: false },
        { id: 'opt-6-2', text: 'Second Normal Form (2NF)', isCorrect: false },
        { id: 'opt-6-3', text: 'Third Normal Form (3NF)', isCorrect: true },
        { id: 'opt-6-4', text: 'Boyce-Codd Normal Form (BCNF)', isCorrect: false },
      ],
      explanation: '3NF requires that the table is in 2NF and all non-key attributes depend only directly on the primary key, eliminating transitive dependencies.',
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-01T12:00:00Z',
      updatedAt: '2026-02-01T12:00:00Z',
    },

    // Questions for CYBER-204
    {
      id: 'q-cyb-1',
      subjectId: 'sub-cyber-204',
      topic: 'Asymmetric Cryptography',
      questionText: 'In RSA encryption, which mathematical problem provides the primary computational hardness that guarantees key secrecy?',
      type: 'SINGLE_CHOICE',
      difficulty: 'HARD',
      marks: 2,
      negativeMarks: 0.5,
      options: [
        { id: 'opt-c1-1', text: 'Discrete Logarithm Problem', isCorrect: false },
        { id: 'opt-c1-2', text: 'Prime Factorization of large integers', isCorrect: true },
        { id: 'opt-c1-3', text: 'Elliptic Curve Point Multiplication', isCorrect: false },
        { id: 'opt-c1-4', text: 'Knapsack subset sum problem', isCorrect: false },
      ],
      explanation: 'RSA relies on the practical impossibility of factoring the product of two very large prime numbers in polynomial time.',
      createdBy: 'usr-teacher-2',
      createdAt: '2026-02-05T09:00:00Z',
      updatedAt: '2026-02-05T09:00:00Z',
    },
    {
      id: 'q-cyb-2',
      subjectId: 'sub-cyber-204',
      topic: 'Network Attacks',
      questionText: 'Select the security controls that effectively mitigate ARP Poisoning / Spoofing on a Local Area Network switch:',
      type: 'MULTIPLE_CHOICE',
      difficulty: 'HARD',
      marks: 3,
      negativeMarks: 1,
      options: [
        { id: 'opt-c2-1', text: 'Dynamic ARP Inspection (DAI)', isCorrect: true },
        { id: 'opt-c2-2', text: 'DHCP Snooping binding database', isCorrect: true },
        { id: 'opt-c2-3', text: 'Increasing MTU packet size', isCorrect: false },
        { id: 'opt-c2-4', text: 'Static ARP table entries for gateways', isCorrect: true },
      ],
      explanation: 'DAI intercepts ARP packets and verifies IP-to-MAC mappings using the DHCP snooping table or static ARP entries.',
      createdBy: 'usr-teacher-2',
      createdAt: '2026-02-05T09:30:00Z',
      updatedAt: '2026-02-05T09:30:00Z',
    },
  ];

  const exams: Exam[] = [
    {
      id: 'exam-cs-301-midterm',
      code: 'CS-301-MID',
      title: 'CS-301: Midterm Examination — Web Architecture & Secure Systems',
      description: 'Comprehensive evaluation covering state management, HTTP security standards, WebRTC proctoring mechanisms, and concurrency control.',
      subjectId: 'sub-cs-301',
      durationMinutes: 45,
      totalMarks: 15,
      passPercentage: 50,
      instructions: [
        'Webcam & microphone must remain active throughout the session.',
        'Leaving fullscreen or switching tabs will generate automatic security flags.',
        'Answers are autosaved continuously to the server database.',
        'You may mark questions for review and revisit them using the palette before final submission.',
        'When the deadline arrives, answers will submit automatically.',
      ],
      status: 'PUBLISHED',
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-12-31T23:59:59Z', // Available now
      maxAttempts: 2,
      shuffleQuestions: false,
      shuffleOptions: false,
      proctoringRules: {
        requireCamera: true,
        requireMicrophone: true,
        preventTabSwitch: true,
        preventFullscreenExit: true,
        maxViolationsAllowed: 5,
        captureSnapshots: true,
      },
      assignedStudentIds: [],
      questionIds: ['q-cs-1', 'q-cs-2', 'q-cs-3', 'q-cs-4', 'q-cs-5', 'q-cs-6'],
      createdBy: 'usr-teacher-1',
      createdAt: '2026-02-10T14:00:00Z',
      updatedAt: '2026-02-10T14:00:00Z',
    },
    {
      id: 'exam-cyber-204-quiz',
      code: 'CYBER-QUIZ-1',
      title: 'CYBER-204: Cryptography & Defense Quiz (Evaluated)',
      description: 'Quick check covering asymmetric encryption, ARP inspection, and zero trust architecture.',
      subjectId: 'sub-cyber-204',
      durationMinutes: 20,
      totalMarks: 5,
      passPercentage: 60,
      instructions: [
        'Read questions carefully.',
        'Negative marking applies for incorrect multiple choice answers.',
      ],
      status: 'PUBLISHED',
      startTime: '2026-01-01T00:00:00Z',
      endTime: '2026-12-31T23:59:59Z',
      maxAttempts: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      proctoringRules: {
        requireCamera: true,
        requireMicrophone: false,
        preventTabSwitch: true,
        preventFullscreenExit: true,
        maxViolationsAllowed: 3,
        captureSnapshots: true,
      },
      assignedStudentIds: [],
      questionIds: ['q-cyb-1', 'q-cyb-2'],
      createdBy: 'usr-teacher-2',
      createdAt: '2026-02-12T10:00:00Z',
      updatedAt: '2026-02-12T10:00:00Z',
    },
  ];

  // Seed sample completed attempt for Jane Doe to populate teacher analytics & evaluation
  const attempts: ExamAttempt[] = [
    {
      id: 'att-jane-sample',
      examId: 'exam-cs-301-midterm',
      studentId: 'usr-student-2',
      attemptNumber: 1,
      status: 'EVALUATED',
      startedAt: '2026-02-20T10:00:00Z',
      deadlineAt: '2026-02-20T10:45:00Z',
      submittedAt: '2026-02-20T10:38:15Z',
      totalScore: 13,
      percentage: 86.6,
      isPassed: true,
      isProvisional: false,
      proctoringEventsCount: 1,
      answers: {
        'q-cs-1': {
          questionId: 'q-cs-1',
          selectedOptionIds: ['opt-1-2'],
          isAnswered: true,
          autoScore: 2,
          isEvaluated: true,
        },
        'q-cs-2': {
          questionId: 'q-cs-2',
          selectedOptionIds: ['opt-2-1', 'opt-2-3', 'opt-2-4'],
          isAnswered: true,
          autoScore: 3,
          isEvaluated: true,
        },
        'q-cs-3': {
          questionId: 'q-cs-3',
          selectedOptionIds: ['opt-3-1'],
          isAnswered: true,
          autoScore: 1,
          isEvaluated: true,
        },
        'q-cs-4': {
          questionId: 'q-cs-4',
          textAnswer: 'Content-Security-Policy',
          isAnswered: true,
          autoScore: 2,
          isEvaluated: true,
        },
        'q-cs-5': {
          questionId: 'q-cs-5',
          textAnswer: 'Pessimistic locking locks records on read or write, while optimistic locking verifies version numbers before saving. In online exams, optimistic locking avoids row locks during rapid autosaves.',
          isAnswered: true,
          manualScore: 5,
          feedback: 'Accurate and concise explanation of versioning and high-concurrency benefits.',
          isEvaluated: true,
          evaluatedBy: 'usr-teacher-1',
          evaluatedAt: '2026-02-21T09:00:00Z',
        },
        'q-cs-6': {
          questionId: 'q-cs-6',
          selectedOptionIds: ['opt-6-2'], // Jane answered wrong (2NF instead of 3NF)
          isAnswered: true,
          autoScore: 0,
          isEvaluated: true,
        },
      },
    },
  ];

  const proctoringEvents: ProctoringEvent[] = [
    {
      id: 'pe-jane-1',
      attemptId: 'att-jane-sample',
      studentId: 'usr-student-2',
      eventType: 'TAB_SWITCH',
      severity: 'HIGH',
      timestamp: '2026-02-20T10:14:22Z',
      details: 'Student switched browser tab for 4 seconds during question 3.',
      reviewed: true,
      reviewDecision: 'CLEARED',
      reviewNotes: 'Verified brief accidental trackpad gesture switch; student immediately returned.',
      reviewedBy: 'usr-teacher-1',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      userId: 'usr-admin-1',
      userName: 'Dr. Arthur Vance (Dean/Admin)',
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      details: 'ExamSecure environment initialized with database seeds and security policies.',
      timestamp: '2026-02-01T08:00:00Z',
    },
    {
      id: 'aud-2',
      userId: 'usr-teacher-1',
      userName: 'Prof. Elena Rostova',
      userRole: 'TEACHER',
      action: 'EXAM_PUBLISHED',
      details: 'Published exam "CS-301: Midterm Examination" with 6 questions.',
      timestamp: '2026-02-10T14:00:00Z',
    },
  ];

  return {
    users,
    subjects,
    questions,
    exams,
    attempts,
    proctoringEvents,
    auditLogs,
  };
}

export function initDatabase(): void {
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      // Ensure all arrays exist
      db.users = db.users || [];
      db.subjects = db.subjects || [];
      db.questions = db.questions || [];
      db.exams = db.exams || [];
      db.attempts = db.attempts || [];
      db.proctoringEvents = db.proctoringEvents || [];
      db.auditLogs = db.auditLogs || [];
    } else {
      db = generateSeedData();
      saveDatabase();
    }
  } catch (err) {
    console.error('Error initializing database, using generated seed in-memory:', err);
    db = generateSeedData();
  }
}

export function saveDatabase(): void {
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database to file:', err);
  }
}

export function getDb(): DatabaseSchema {
  return db;
}

export function resetToSeed(): DatabaseSchema {
  db = generateSeedData();
  saveDatabase();
  return db;
}
