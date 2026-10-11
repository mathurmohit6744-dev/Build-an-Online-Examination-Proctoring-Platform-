export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  studentId?: string;
  createdAt: string;
}

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'DESCRIPTIVE';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  subjectId: string;
  topic: string;
  questionText: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: number;
  negativeMarks: number;
  options?: QuestionOption[];
  correctShortAnswer?: string; // case-insensitive or regex
  sampleDescriptiveAnswer?: string;
  explanation?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ExamProctoringRules {
  requireCamera: boolean;
  requireMicrophone: boolean;
  preventTabSwitch: boolean;
  preventFullscreenExit: boolean;
  maxViolationsAllowed: number;
  captureSnapshots: boolean;
}

export type ExamStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  subjectId: string;
  durationMinutes: number;
  totalMarks: number;
  passPercentage: number;
  instructions: string[];
  status: ExamStatus;
  startTime: string; // ISO
  endTime: string;   // ISO
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  proctoringRules: ExamProctoringRules;
  assignedStudentIds: string[]; // empty means all students enrolled in subject
  questionIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED' | 'DISQUALIFIED';

export interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  isMarkedForReview?: boolean;
  isAnswered: boolean;
  autoScore?: number;
  manualScore?: number;
  feedback?: string;
  isEvaluated?: boolean;
  evaluatedBy?: string;
  evaluatedAt?: string;
}

export type ProctoringEventType =
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH'
  | 'CAMERA_TRACK_LOST'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES'
  | 'AUDIO_SPIKE'
  | 'WINDOW_RESIZE'
  | 'RIGHT_CLICK_ATTEMPT';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProctoringEvent {
  id: string;
  attemptId: string;
  studentId: string;
  eventType: ProctoringEventType;
  severity: EventSeverity;
  timestamp: string;
  details: string;
  snapshotUrl?: string;
  reviewed: boolean;
  reviewDecision?: 'CLEARED' | 'FLAGGED' | 'DISMISSED';
  reviewNotes?: string;
  reviewedBy?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  answers: Record<string, SubmittedAnswer>;
  proctoringEventsCount: number;
  totalScore?: number;
  percentage?: number;
  isPassed?: boolean;
  isProvisional?: boolean; // true if awaiting descriptive grading
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
