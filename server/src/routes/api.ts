import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.ts';
import * as authCtrl from '../controllers/authController.ts';
import * as examCtrl from '../controllers/examController.ts';
import * as adminCtrl from '../controllers/adminController.ts';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ExamSecure Core API', time: new Date().toISOString() });
});

// Authentication
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.get('/auth/me', authenticate, authCtrl.getCurrentUser);
router.post('/auth/demo-switch', authCtrl.demoSwitch);

// Users (Admin Only)
router.get('/users', authenticate, requireRole('ADMIN'), adminCtrl.getUsers);
router.post('/users', authenticate, requireRole('ADMIN'), adminCtrl.createUser);
router.delete('/users/:id', authenticate, requireRole('ADMIN'), adminCtrl.deleteUser);

// Subjects
router.get('/subjects', authenticate, examCtrl.getSubjects);
router.post('/subjects', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.createSubject);

// Question Bank (Teacher/Admin only)
router.get('/questions', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.getQuestions);
router.post('/questions', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.createQuestion);
router.delete('/questions/:id', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.deleteQuestion);

// Exams
router.get('/exams', authenticate, examCtrl.getExams);
router.get('/exams/:id', authenticate, examCtrl.getExamById);
router.post('/exams', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.createExam);
router.delete('/exams/:id', authenticate, requireRole('ADMIN', 'TEACHER'), examCtrl.deleteExam);

// Attempts (Student Exam Taking & Autosave)
router.post('/attempts/start', authenticate, examCtrl.startExamAttempt);
router.post('/attempts/:id/save-answer', authenticate, examCtrl.saveAnswer);
router.post('/attempts/:id/submit', authenticate, examCtrl.submitExamAttempt);
router.post('/attempts/:id/proctoring-event', authenticate, examCtrl.logProctoringEvent);

// Manual Evaluation of Descriptive Answers (Teacher/Admin)
router.get('/evaluations/pending', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.getPendingDescriptiveAnswers);
router.post('/evaluations/grade', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.gradeDescriptiveAnswer);

// Proctoring Events & Teacher Review
router.get('/analytics/proctoring', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.getProctoringEvents);
router.post('/analytics/proctoring/:id/review', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.reviewProctoringEvent);

// Analytics Dashboard & CSV Export
router.get('/analytics/overview', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.getAnalyticsOverview);
router.get('/analytics/export/:examId', authenticate, requireRole('ADMIN', 'TEACHER'), adminCtrl.exportExamResultsCSV);

// Results & Detailed Breakdown
router.get('/results/:attemptId', authenticate, adminCtrl.getStudentAttemptResult);

// System Utility
router.post('/system/reset-db', authenticate, requireRole('ADMIN'), adminCtrl.resetDatabase);

export default router;
