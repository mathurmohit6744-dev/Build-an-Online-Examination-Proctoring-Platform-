import {
  User,
  Exam,
  ExamAttempt,
  Question,
  Subject,
  ProctoringEvent,
  AuditLog,
} from '../types/index.ts';

const API_BASE = '/api';

function getHeaders(customHeaders: Record<string, string> = {}) {
  const token = localStorage.getItem('examsecure_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ success: boolean; token: string; user: User }>(res);
  },

  async register(userData: Partial<User> & { password: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse<{ success: boolean; token: string; user: User }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; user: User }>(res);
  },

  async demoSwitch(role: string) {
    const res = await fetch(`${API_BASE}/auth/demo-switch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse<{ success: boolean; token: string; user: User }>(res);
  },

  // Subjects
  async getSubjects() {
    const res = await fetch(`${API_BASE}/subjects`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; subjects: Subject[] }>(res);
  },

  async createSubject(subject: Partial<Subject>) {
    const res = await fetch(`${API_BASE}/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(subject),
    });
    return handleResponse<{ success: boolean; subject: Subject }>(res);
  },

  // Questions
  async getQuestions(filters: Record<string, string> = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/questions?${params}`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; questions: Question[] }>(res);
  },

  async createQuestion(question: Partial<Question>) {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(question),
    });
    return handleResponse<{ success: boolean; question: Question }>(res);
  },

  async deleteQuestion(id: string) {
    const res = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Exams
  async getExams() {
    const res = await fetch(`${API_BASE}/exams`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; exams: any[] }>(res);
  },

  async getExamById(id: string) {
    const res = await fetch(`${API_BASE}/exams/${id}`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; exam: any }>(res);
  },

  async createExam(exam: Partial<Exam>) {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(exam),
    });
    return handleResponse<{ success: boolean; exam: Exam }>(res);
  },

  async deleteExam(id: string) {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  // Student Attempt
  async startAttempt(examId: string) {
    const res = await fetch(`${API_BASE}/attempts/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ examId }),
    });
    return handleResponse<{
      success: boolean;
      attempt: ExamAttempt;
      exam: Exam;
      questions: Question[];
      isResumed: boolean;
    }>(res);
  },

  async saveAnswer(
    attemptId: string,
    payload: {
      questionId: string;
      selectedOptionIds?: string[];
      textAnswer?: string;
      isMarkedForReview?: boolean;
    }
  ) {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/save-answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async submitAttempt(attemptId: string) {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{
      success: boolean;
      message: string;
      attempt: ExamAttempt;
    }>(res);
  },

  async logProctoringEvent(
    attemptId: string,
    event: {
      eventType: string;
      severity?: string;
      details?: string;
      snapshotUrl?: string;
    }
  ) {
    const res = await fetch(`${API_BASE}/attempts/${attemptId}/proctoring-event`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    return handleResponse<{ success: boolean; event: ProctoringEvent }>(res);
  },

  // Manual Evaluation (Teacher/Admin)
  async getPendingEvaluations() {
    const res = await fetch(`${API_BASE}/evaluations/pending`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; pendingAnswers: any[] }>(res);
  },

  async gradeAnswer(payload: {
    attemptId: string;
    questionId: string;
    score: number;
    feedback?: string;
  }) {
    const res = await fetch(`${API_BASE}/evaluations/grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ success: boolean; message: string; attempt: ExamAttempt }>(res);
  },

  // Proctoring Timeline
  async getProctoringEvents(filters: Record<string, string> = {}) {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/analytics/proctoring?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; events: any[] }>(res);
  },

  async reviewProctoringEvent(id: string, decision: string, notes?: string) {
    const res = await fetch(`${API_BASE}/analytics/proctoring/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, notes }),
    });
    return handleResponse<{ success: boolean; event: ProctoringEvent }>(res);
  },

  // Analytics & CSV
  async getAnalyticsOverview() {
    const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; stats: any }>(res);
  },

  getExportCSVUrl(examId: string) {
    return `${API_BASE}/analytics/export/${examId}`;
  },

  // Results
  async getAttemptResult(attemptId: string) {
    const res = await fetch(`${API_BASE}/results/${attemptId}`, { headers: getHeaders() });
    return handleResponse<{
      success: boolean;
      attempt: ExamAttempt;
      exam: Exam;
      subject: Subject;
      student: any;
      breakdown: Array<{ question: Question; submittedAnswer: any }>;
    }>(res);
  },

  // Admin users & system
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
    return handleResponse<{ success: boolean; users: User[] }>(res);
  },

  async createUser(user: Partial<User> & { password: string }) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse<{ success: boolean; user: User }>(res);
  },

  async deleteUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/system/reset-db`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
