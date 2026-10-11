import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase, resetToSeed } from '../db/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { User, UserRole, ProctoringEvent } from '../types/index.ts';

// User Management
export function getUsers(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);
  res.json({ success: true, users: safeUsers });
}

export function createUser(req: AuthenticatedRequest, res: Response): void {
  const { name, email, password, role, department, studentId } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    return;
  }

  const db = getDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ success: false, message: 'User with this email already exists.' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${uuidv4().slice(0, 8)}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role as UserRole,
    department: department || 'General',
    studentId: role === 'STUDENT' ? (studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase();

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
}

export function deleteUser(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const db = getDb();

  // Protect primary admin from deletion
  if (id === 'usr-admin-1') {
    res.status(400).json({ success: false, message: 'Cannot delete primary root administrator.' });
    return;
  }

  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  db.users.splice(idx, 1);
  saveDatabase();
  res.json({ success: true, message: 'User deleted.' });
}

// Manual Grading of Descriptive Answers
export function getPendingDescriptiveAnswers(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const pendingItems: Array<{
    attemptId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    examId: string;
    examTitle: string;
    questionId: string;
    questionText: string;
    marks: number;
    sampleDescriptiveAnswer?: string;
    studentAnswerText: string;
    submittedAt?: string;
  }> = [];

  db.attempts.forEach((attempt) => {
    if (attempt.status === 'SUBMITTED' || attempt.isProvisional) {
      const student = db.users.find((u) => u.id === attempt.studentId);
      const exam = db.exams.find((e) => e.id === attempt.examId);

      Object.values(attempt.answers).forEach((ans: any) => {
        const q = db.questions.find((item) => item.id === ans.questionId);
        if (q && q.type === 'DESCRIPTIVE' && !ans.isEvaluated) {
          pendingItems.push({
            attemptId: attempt.id,
            studentId: attempt.studentId,
            studentName: student?.name || 'Unknown Student',
            studentEmail: student?.email || '',
            examId: attempt.examId,
            examTitle: exam?.title || 'Unknown Exam',
            questionId: q.id,
            questionText: q.questionText,
            marks: q.marks,
            sampleDescriptiveAnswer: q.sampleDescriptiveAnswer,
            studentAnswerText: ans.textAnswer || '(No answer provided)',
            submittedAt: attempt.submittedAt,
          });
        }
      });
    }
  });

  res.json({ success: true, pendingAnswers: pendingItems });
}

export function gradeDescriptiveAnswer(req: AuthenticatedRequest, res: Response): void {
  const teacher = req.user!;
  const { attemptId, questionId, score, feedback } = req.body;

  if (!attemptId || !questionId || score === undefined) {
    res.status(400).json({ success: false, message: 'attemptId, questionId, and score are required.' });
    return;
  }

  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === attemptId);
  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found.' });
    return;
  }

  const question = db.questions.find((q) => q.id === questionId);
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }

  const clampedScore = Math.min(question.marks, Math.max(0, Number(score)));

  // Record evaluation
  if (!attempt.answers[questionId]) {
    attempt.answers[questionId] = {
      questionId,
      isAnswered: true,
    };
  }

  attempt.answers[questionId].manualScore = clampedScore;
  attempt.answers[questionId].feedback = feedback || '';
  attempt.answers[questionId].isEvaluated = true;
  attempt.answers[questionId].evaluatedBy = teacher.id;
  attempt.answers[questionId].evaluatedAt = new Date().toISOString();

  // Check if all answers in attempt are now evaluated
  const exam = db.exams.find((e) => e.id === attempt.examId);
  let totalScore = 0;
  let allEvaluated = true;

  if (exam) {
    exam.questionIds.forEach((qid: string) => {
      const ans = attempt.answers[qid];
      const q = db.questions.find((item) => item.id === qid);
      if (ans) {
        const itemScore = (ans.autoScore || 0) + (ans.manualScore || 0);
        totalScore += itemScore;
        if (q?.type === 'DESCRIPTIVE' && !ans.isEvaluated) {
          allEvaluated = false;
        }
      }
    });

    totalScore = Math.max(0, Number(totalScore.toFixed(2)));
    const percentage = Number(((totalScore / exam.totalMarks) * 100).toFixed(1));

    attempt.totalScore = totalScore;
    attempt.percentage = percentage;
    attempt.isPassed = percentage >= exam.passPercentage;

    if (allEvaluated) {
      attempt.status = 'EVALUATED';
      attempt.isProvisional = false;
    }
  }

  saveDatabase();

  res.json({
    success: true,
    message: 'Descriptive answer successfully evaluated.',
    attempt,
  });
}

// Proctoring Reviews
export function getProctoringEvents(req: AuthenticatedRequest, res: Response): void {
  const { examId, studentId, unreviewedOnly } = req.query;
  const db = getDb();

  let events = [...db.proctoringEvents];

  if (examId && typeof examId === 'string') {
    const attemptIds = db.attempts.filter((a) => a.examId === examId).map((a) => a.id);
    events = events.filter((e) => attemptIds.includes(e.attemptId));
  }

  if (studentId && typeof studentId === 'string') {
    events = events.filter((e) => e.studentId === studentId);
  }

  if (unreviewedOnly === 'true') {
    events = events.filter((e) => !e.reviewed);
  }

  // Enrich with student & exam details
  const enriched = events.map((ev) => {
    const student = db.users.find((u) => u.id === ev.studentId);
    const attempt = db.attempts.find((a) => a.id === ev.attemptId);
    const exam = attempt ? db.exams.find((e) => e.id === attempt.examId) : null;

    return {
      ...ev,
      studentName: student?.name || 'Unknown Student',
      studentEmail: student?.email || '',
      examTitle: exam?.title || 'Unknown Exam',
      examCode: exam?.code || '',
    };
  });

  res.json({ success: true, events: enriched });
}

export function reviewProctoringEvent(req: AuthenticatedRequest, res: Response): void {
  const user = req.user!;
  const { id } = req.params;
  const { decision, notes } = req.body;

  const db = getDb();
  const event = db.proctoringEvents.find((e) => e.id === id);
  if (!event) {
    res.status(404).json({ success: false, message: 'Event not found.' });
    return;
  }

  event.reviewed = true;
  event.reviewDecision = decision || 'CLEARED';
  event.reviewNotes = notes || '';
  event.reviewedBy = user.id;

  saveDatabase();
  res.json({ success: true, event });
}

// Platform Analytics Dashboard
export function getAnalyticsOverview(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();

  const totalStudents = db.users.filter((u) => u.role === 'STUDENT').length;
  const totalTeachers = db.users.filter((u) => u.role === 'TEACHER').length;
  const totalExams = db.exams.length;
  const totalQuestions = db.questions.length;

  const completedAttempts = db.attempts.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'EVALUATED'
  );
  const activeAttempts = db.attempts.filter((a) => a.status === 'IN_PROGRESS');

  const scores = completedAttempts.map((a) => a.percentage || 0);
  const avgScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const passedCount = completedAttempts.filter((a) => a.isPassed).length;
  const passPercentage = completedAttempts.length > 0
    ? Number(((passedCount / completedAttempts.length) * 100).toFixed(1))
    : 0;

  // Proctoring flags summary
  const totalProctoringEvents = db.proctoringEvents.length;
  const unreviewedEvents = db.proctoringEvents.filter((e) => !e.reviewed).length;
  const flaggedEvents = db.proctoringEvents.filter((e) => e.reviewDecision === 'FLAGGED').length;

  // Score distribution bins (0-20, 21-40, 41-60, 61-80, 81-100)
  const scoreDistribution = [
    { range: '0-20%', count: scores.filter((s) => s <= 20).length },
    { range: '21-40%', count: scores.filter((s) => s > 20 && s <= 40).length },
    { range: '41-60%', count: scores.filter((s) => s > 40 && s <= 60).length },
    { range: '61-80%', count: scores.filter((s) => s > 60 && s <= 80).length },
    { range: '81-100%', count: scores.filter((s) => s > 80).length },
  ];

  // Subject-wise performance
  const subjectPerformance = db.subjects.map((subj) => {
    const subjExams = db.exams.filter((e) => e.subjectId === subj.id).map((e) => e.id);
    const subjAttempts = completedAttempts.filter((a) => subjExams.includes(a.examId));
    const subjScores = subjAttempts.map((a) => a.percentage || 0);
    const avg = subjScores.length > 0 ? Number((subjScores.reduce((a, b) => a + b, 0) / subjScores.length).toFixed(1)) : 0;
    return {
      subject: subj.name,
      code: subj.code,
      averageScore: avg,
      attemptsCount: subjAttempts.length,
    };
  });

  // Proctoring event type frequencies
  const eventTypesCount: Record<string, number> = {};
  db.proctoringEvents.forEach((ev) => {
    eventTypesCount[ev.eventType] = (eventTypesCount[ev.eventType] || 0) + 1;
  });

  const proctoringBreakdown = Object.entries(eventTypesCount).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }));

  res.json({
    success: true,
    stats: {
      totalStudents,
      totalTeachers,
      totalExams,
      totalQuestions,
      completedAttemptsCount: completedAttempts.length,
      activeAttemptsCount: activeAttempts.length,
      avgScore,
      highestScore,
      lowestScore,
      passPercentage,
      totalProctoringEvents,
      unreviewedEvents,
      flaggedEvents,
      scoreDistribution,
      subjectPerformance,
      proctoringBreakdown,
    },
  });
}

// CSV Export
export function exportExamResultsCSV(req: AuthenticatedRequest, res: Response): void {
  const { examId } = req.params;
  const db = getDb();

  const exam = db.exams.find((e) => e.id === examId);
  if (!exam) {
    res.status(404).json({ success: false, message: 'Exam not found.' });
    return;
  }

  const attempts = db.attempts.filter((a) => a.examId === examId);

  // Build CSV headers
  const headers = [
    'Attempt ID',
    'Student ID',
    'Student Name',
    'Student Email',
    'Status',
    'Score Obtained',
    'Total Marks',
    'Percentage (%)',
    'Result Status',
    'Proctoring Violations',
    'Started At',
    'Submitted At',
  ];

  const rows = attempts.map((a) => {
    const student = db.users.find((u) => u.id === a.studentId);
    return [
      `"${a.id}"`,
      `"${student?.studentId || 'N/A'}"`,
      `"${student?.name || 'Unknown'}"`,
      `"${student?.email || 'N/A'}"`,
      `"${a.status}"`,
      a.totalScore !== undefined ? a.totalScore : 'N/A',
      exam.totalMarks,
      a.percentage !== undefined ? `${a.percentage}%` : 'N/A',
      a.isPassed !== undefined ? (a.isPassed ? 'PASS' : 'FAIL') : 'PENDING',
      a.proctoringEventsCount || 0,
      `"${a.startedAt}"`,
      `"${a.submittedAt || 'In-Progress'}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${exam.code}_results.csv"`);
  res.send(csvContent);
}

// Student Results details with authorized feedback
export function getStudentAttemptResult(req: AuthenticatedRequest, res: Response): void {
  const { attemptId } = req.params;
  const user = req.user!;
  const db = getDb();

  const attempt = db.attempts.find((a) => a.id === attemptId);
  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found.' });
    return;
  }

  // Authorization check: student can only view their own result
  if (user.role === 'STUDENT' && attempt.studentId !== user.id) {
    res.status(403).json({ success: false, message: 'Unauthorized to view this attempt result.' });
    return;
  }

  const exam = db.exams.find((e) => e.id === attempt.examId);
  const subject = exam ? db.subjects.find((s) => s.id === exam.subjectId) : null;
  const student = db.users.find((u) => u.id === attempt.studentId);

  // Return questions with explanation and full answer breakdown
  const questionsBreakdown = exam?.questionIds.map((qId: string) => {
    const q = db.questions.find((item) => item.id === qId);
    const ans = attempt.answers[qId];
    return {
      question: q,
      submittedAnswer: ans,
    };
  });

  res.json({
    success: true,
    attempt,
    exam,
    subject,
    student: {
      name: student?.name,
      email: student?.email,
      studentId: student?.studentId,
    },
    breakdown: questionsBreakdown,
  });
}

// Reset Database API (for easy testing)
export function resetDatabase(req: AuthenticatedRequest, res: Response): void {
  resetToSeed();
  res.json({ success: true, message: 'Database reset to initial demo seeds successfully.' });
}
