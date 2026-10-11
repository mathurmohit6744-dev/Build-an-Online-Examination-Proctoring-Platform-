import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../db/index.ts';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  Exam,
  ExamAttempt,
  Question,
  SubmittedAnswer,
  ProctoringEvent,
  Subject,
} from '../types/index.ts';

// Get list of subjects
export function getSubjects(req: Request, res: Response): void {
  const db = getDb();
  res.json({ success: true, subjects: db.subjects });
}

export function createSubject(req: AuthenticatedRequest, res: Response): void {
  const { code, name, description } = req.body;
  if (!code || !name) {
    res.status(400).json({ success: false, message: 'Subject code and name are required.' });
    return;
  }
  const db = getDb();
  const existing = db.subjects.find((s) => s.code.toLowerCase() === code.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'A subject with this code already exists.' });
    return;
  }

  const subject: Subject = {
    id: `sub-${uuidv4().slice(0, 8)}`,
    code: code.toUpperCase(),
    name,
    description: description || '',
    createdAt: new Date().toISOString(),
  };
  db.subjects.push(subject);
  saveDatabase();
  res.status(201).json({ success: true, subject });
}

// Question Bank management
export function getQuestions(req: AuthenticatedRequest, res: Response): void {
  const { subjectId, type, difficulty, search } = req.query;
  const db = getDb();

  let list = [...db.questions];

  if (subjectId && typeof subjectId === 'string') {
    list = list.filter((q) => q.subjectId === subjectId);
  }
  if (type && typeof type === 'string') {
    list = list.filter((q) => q.type === type);
  }
  if (difficulty && typeof difficulty === 'string') {
    list = list.filter((q) => q.difficulty === difficulty);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (item) =>
        item.questionText.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, questions: list });
}

export function createQuestion(req: AuthenticatedRequest, res: Response): void {
  const user = req.user!;
  const {
    subjectId,
    topic,
    questionText,
    type,
    difficulty,
    marks,
    negativeMarks,
    options,
    correctShortAnswer,
    sampleDescriptiveAnswer,
    explanation,
  } = req.body;

  if (!subjectId || !questionText || !type || marks === undefined) {
    res.status(400).json({ success: false, message: 'Missing required question fields.' });
    return;
  }

  const db = getDb();
  const subject = db.subjects.find((s) => s.id === subjectId);
  if (!subject) {
    res.status(400).json({ success: false, message: 'Invalid subject specified.' });
    return;
  }

  // Format options with IDs
  let formattedOptions = options;
  if (Array.isArray(options)) {
    formattedOptions = options.map((opt: { id?: string; text: string; isCorrect: boolean }, idx: number) => ({
      id: opt.id || `opt-${uuidv4().slice(0, 6)}-${idx}`,
      text: opt.text,
      isCorrect: Boolean(opt.isCorrect),
    }));
  }

  const question: Question = {
    id: `q-${uuidv4().slice(0, 8)}`,
    subjectId,
    topic: topic || 'General',
    questionText,
    type,
    difficulty: difficulty || 'MEDIUM',
    marks: Number(marks),
    negativeMarks: Number(negativeMarks || 0),
    options: formattedOptions,
    correctShortAnswer: correctShortAnswer ? String(correctShortAnswer).trim() : undefined,
    sampleDescriptiveAnswer: sampleDescriptiveAnswer || undefined,
    explanation: explanation || undefined,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.questions.push(question);
  saveDatabase();
  res.status(201).json({ success: true, question });
}

export function deleteQuestion(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const db = getDb();
  const idx = db.questions.findIndex((q) => q.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Question not found.' });
    return;
  }
  db.questions.splice(idx, 1);
  saveDatabase();
  res.json({ success: true, message: 'Question deleted successfully.' });
}

// Exam Management
export function getExams(req: AuthenticatedRequest, res: Response): void {
  const user = req.user!;
  const db = getDb();

  let exams = [...db.exams];

  // If student, only return published exams and add student's attempt status
  if (user.role === 'STUDENT') {
    exams = exams.filter((e) => e.status === 'PUBLISHED');

    const mapped = exams.map((exam) => {
      const studentAttempts = db.attempts.filter(
        (a) => a.examId === exam.id && a.studentId === user.id
      );
      const latestAttempt = studentAttempts[studentAttempts.length - 1];
      const subject = db.subjects.find((s) => s.id === exam.subjectId);

      return {
        ...exam,
        subjectName: subject?.name || 'General',
        subjectCode: subject?.code || '',
        attemptsCount: studentAttempts.length,
        hasActiveAttempt: latestAttempt?.status === 'IN_PROGRESS',
        activeAttemptId: latestAttempt?.status === 'IN_PROGRESS' ? latestAttempt.id : null,
        latestAttempt,
      };
    });

    res.json({ success: true, exams: mapped });
    return;
  }

  // Teacher/Admin view: include subject details and attempt statistics
  const mapped = exams.map((exam) => {
    const attempts = db.attempts.filter((a) => a.examId === exam.id);
    const subject = db.subjects.find((s) => s.id === exam.subjectId);
    return {
      ...exam,
      subjectName: subject?.name || 'General',
      subjectCode: subject?.code || '',
      totalAttempts: attempts.length,
      completedAttempts: attempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'EVALUATED').length,
    };
  });

  res.json({ success: true, exams: mapped });
}

export function getExamById(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const user = req.user!;
  const db = getDb();

  const exam = db.exams.find((e) => e.id === id);
  if (!exam) {
    res.status(404).json({ success: false, message: 'Exam not found.' });
    return;
  }

  const subject = db.subjects.find((s) => s.id === exam.subjectId);
  const questions = db.questions.filter((q) => exam.questionIds.includes(q.id));

  // If student is viewing exam details before starting, DO NOT leak questions
  if (user.role === 'STUDENT') {
    const studentAttempts = db.attempts.filter(
      (a) => a.examId === exam.id && a.studentId === user.id
    );
    res.json({
      success: true,
      exam: {
        ...exam,
        subjectName: subject?.name,
        subjectCode: subject?.code,
        questionCount: exam.questionIds.length,
        attemptsCount: studentAttempts.length,
        canAttempt: studentAttempts.length < exam.maxAttempts,
      },
    });
    return;
  }

  // Teacher/Admin gets full questions including answers
  res.json({
    success: true,
    exam: {
      ...exam,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      questions,
    },
  });
}

export function createExam(req: AuthenticatedRequest, res: Response): void {
  const user = req.user!;
  const {
    title,
    code,
    description,
    subjectId,
    durationMinutes,
    totalMarks,
    passPercentage,
    instructions,
    startTime,
    endTime,
    maxAttempts,
    shuffleQuestions,
    shuffleOptions,
    proctoringRules,
    questionIds,
    status = 'PUBLISHED',
  } = req.body;

  if (!title || !code || !subjectId || !durationMinutes || !questionIds || questionIds.length === 0) {
    res.status(400).json({ success: false, message: 'Please provide all required exam parameters and select at least one question.' });
    return;
  }

  const db = getDb();
  const existing = db.exams.find((e) => e.code.toLowerCase() === code.toLowerCase());
  if (existing) {
    res.status(400).json({ success: false, message: 'An exam with this code already exists.' });
    return;
  }

  // Calculate total marks from questions if not provided
  const selectedQuestions = db.questions.filter((q) => questionIds.includes(q.id));
  const calculatedTotal = selectedQuestions.reduce((acc, q) => acc + q.marks, 0);

  const exam: Exam = {
    id: `exam-${uuidv4().slice(0, 8)}`,
    title,
    code: code.toUpperCase(),
    description: description || '',
    subjectId,
    durationMinutes: Number(durationMinutes),
    totalMarks: totalMarks ? Number(totalMarks) : calculatedTotal,
    passPercentage: Number(passPercentage || 40),
    instructions: Array.isArray(instructions) && instructions.length > 0 ? instructions : [
      'Maintain full focus during the session.',
      'Camera must remain unobstructed.',
      'Exiting fullscreen or switching windows will be flagged automatically.',
    ],
    status,
    startTime: startTime || new Date().toISOString(),
    endTime: endTime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    maxAttempts: Number(maxAttempts || 1),
    shuffleQuestions: Boolean(shuffleQuestions),
    shuffleOptions: Boolean(shuffleOptions),
    proctoringRules: proctoringRules || {
      requireCamera: true,
      requireMicrophone: true,
      preventTabSwitch: true,
      preventFullscreenExit: true,
      maxViolationsAllowed: 5,
      captureSnapshots: true,
    },
    assignedStudentIds: [],
    questionIds,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.exams.push(exam);
  db.auditLogs.unshift({
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'EXAM_CREATED',
    details: `Created exam "${exam.title}" (${exam.code})`,
    timestamp: new Date().toISOString(),
  });
  saveDatabase();

  res.status(201).json({ success: true, exam });
}

export function deleteExam(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params;
  const db = getDb();
  const idx = db.exams.findIndex((e) => e.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Exam not found.' });
    return;
  }
  const deleted = db.exams.splice(idx, 1)[0];
  saveDatabase();
  res.json({ success: true, message: `Exam ${deleted.title} deleted successfully.` });
}

// Student: Start Exam Attempt
export function startExamAttempt(req: AuthenticatedRequest, res: Response): void {
  const user = req.user!;
  const { examId } = req.body;

  if (!examId) {
    res.status(400).json({ success: false, message: 'examId is required.' });
    return;
  }

  const db = getDb();
  const exam = db.exams.find((e) => e.id === examId);
  if (!exam) {
    res.status(404).json({ success: false, message: 'Exam not found.' });
    return;
  }

  if (exam.status !== 'PUBLISHED') {
    res.status(400).json({ success: false, message: 'This exam is not currently published.' });
    return;
  }

  // Check existing attempts
  const existingAttempts = db.attempts.filter(
    (a) => a.examId === examId && a.studentId === user.id
  );

  // If there's an ongoing attempt, return it directly (reconnection recovery!)
  const inProgressAttempt = existingAttempts.find((a) => a.status === 'IN_PROGRESS');
  if (inProgressAttempt) {
    // Check if deadline passed
    const now = new Date();
    const deadline = new Date(inProgressAttempt.deadlineAt);
    if (now > deadline) {
      // Auto-submit expired attempt
      inProgressAttempt.status = 'SUBMITTED';
      inProgressAttempt.submittedAt = deadline.toISOString();
      saveDatabase();
      res.status(400).json({ success: false, message: 'Your exam time has expired.' });
      return;
    }

    // Return sanitized questions and current answers
    const sanitizedQuestions = getSanitizedQuestionsForExam(exam, db.questions);
    res.json({
      success: true,
      attempt: inProgressAttempt,
      exam,
      questions: sanitizedQuestions,
      isResumed: true,
    });
    return;
  }

  // Check attempt limit
  if (existingAttempts.length >= exam.maxAttempts) {
    res.status(400).json({
      success: false,
      message: `You have reached the maximum allowed attempts (${exam.maxAttempts}) for this exam.`,
    });
    return;
  }

  // Create new attempt
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

  const initialAnswers: Record<string, SubmittedAnswer> = {};
  exam.questionIds.forEach((qId: string) => {
    initialAnswers[qId] = {
      questionId: qId,
      selectedOptionIds: [],
      textAnswer: '',
      isMarkedForReview: false,
      isAnswered: false,
    };
  });

  const newAttempt: ExamAttempt = {
    id: `att-${uuidv4().slice(0, 8)}`,
    examId: exam.id,
    studentId: user.id,
    attemptNumber: existingAttempts.length + 1,
    status: 'IN_PROGRESS',
    startedAt: startedAt.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    answers: initialAnswers,
    proctoringEventsCount: 0,
  };

  db.attempts.push(newAttempt);
  db.auditLogs.unshift({
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'EXAM_STARTED',
    details: `Started attempt #${newAttempt.attemptNumber} for exam ${exam.title}`,
    timestamp: startedAt.toISOString(),
  });
  saveDatabase();

  const sanitizedQuestions = getSanitizedQuestionsForExam(exam, db.questions);

  res.status(201).json({
    success: true,
    attempt: newAttempt,
    exam,
    questions: sanitizedQuestions,
    isResumed: false,
  });
}

// Helper: Sanitize questions for student exam taking (strip answer keys!)
function getSanitizedQuestionsForExam(exam: Exam, allQuestions: Question[]) {
  const questions = allQuestions.filter((q) => exam.questionIds.includes(q.id));

  let ordered = [...questions];
  if (exam.shuffleQuestions) {
    ordered = ordered.sort(() => Math.random() - 0.5);
  }

  return ordered.map((q) => {
    let options = q.options ? [...q.options] : undefined;
    if (options) {
      if (exam.shuffleOptions) {
        options = options.sort(() => Math.random() - 0.5);
      }
      // Remove isCorrect flag from student view!
      options = options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: false, // never reveal
      }));
    }

    return {
      id: q.id,
      subjectId: q.subjectId,
      topic: q.topic,
      questionText: q.questionText,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      options,
      // Do NOT send correctShortAnswer, sampleDescriptiveAnswer, or explanation!
    };
  });
}

// Student: Autosave answers
export function saveAnswer(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params; // attemptId
  const user = req.user!;
  const { questionId, selectedOptionIds, textAnswer, isMarkedForReview } = req.body;

  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === id);

  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found.' });
    return;
  }

  if (attempt.studentId !== user.id && user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Unauthorized attempt modification.' });
    return;
  }

  if (attempt.status !== 'IN_PROGRESS') {
    res.status(400).json({ success: false, message: 'Cannot save answers on a submitted or expired attempt.' });
    return;
  }

  // Grace period 60s for network lag
  const now = new Date();
  const deadlineWithGrace = new Date(new Date(attempt.deadlineAt).getTime() + 60000);
  if (now > deadlineWithGrace) {
    res.status(400).json({ success: false, message: 'Submission deadline has passed.' });
    return;
  }

  // Update answer
  const isAnswered =
    (Array.isArray(selectedOptionIds) && selectedOptionIds.length > 0) ||
    (typeof textAnswer === 'string' && textAnswer.trim().length > 0);

  attempt.answers[questionId] = {
    questionId,
    selectedOptionIds: selectedOptionIds || [],
    textAnswer: textAnswer !== undefined ? textAnswer : (attempt.answers[questionId]?.textAnswer || ''),
    isMarkedForReview: isMarkedForReview !== undefined ? isMarkedForReview : (attempt.answers[questionId]?.isMarkedForReview || false),
    isAnswered: Boolean(isAnswered),
  };

  saveDatabase();
  res.json({ success: true, message: 'Answer saved.' });
}

// Student: Submit Exam Attempt & Automated Evaluation
export function submitExamAttempt(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params; // attemptId
  const user = req.user!;

  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === id);

  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found.' });
    return;
  }

  if (attempt.studentId !== user.id && user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  if (attempt.status !== 'IN_PROGRESS') {
    res.status(400).json({ success: false, message: 'This attempt has already been submitted.' });
    return;
  }

  const exam = db.exams.find((e) => e.id === attempt.examId);
  if (!exam) {
    res.status(404).json({ success: false, message: 'Associated exam not found.' });
    return;
  }

  // Automated Evaluation
  let totalScore = 0;
  let hasDescriptivePending = false;

  exam.questionIds.forEach((qId: string) => {
    const q = db.questions.find((item) => item.id === qId);
    if (!q) return;

    const answer = attempt.answers[qId] || {
      questionId: qId,
      selectedOptionIds: [],
      textAnswer: '',
      isAnswered: false,
    };

    if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
      const correctOpt = q.options?.find((opt: any) => opt.isCorrect);
      const chosenOpt = answer.selectedOptionIds?.[0];

      if (chosenOpt) {
        if (correctOpt && chosenOpt === correctOpt.id) {
          answer.autoScore = q.marks;
        } else {
          // Negative marking if configured
          answer.autoScore = -(q.negativeMarks || 0);
        }
      } else {
        answer.autoScore = 0; // Unanswered
      }
      answer.isEvaluated = true;
      totalScore += answer.autoScore;
    } else if (q.type === 'MULTIPLE_CHOICE') {
      const correctOptIds = (q.options || []).filter((opt: any) => opt.isCorrect).map((opt: any) => opt.id);
      const chosenOptIds = answer.selectedOptionIds || [];

      if (chosenOptIds.length === 0) {
        answer.autoScore = 0;
      } else {
        const correctChosen = chosenOptIds.filter((cid: string) => correctOptIds.includes(cid));
        const incorrectChosen = chosenOptIds.filter((cid: string) => !correctOptIds.includes(cid));

        if (incorrectChosen.length === 0 && correctChosen.length === correctOptIds.length) {
          // 100% correct
          answer.autoScore = q.marks;
        } else if (incorrectChosen.length > 0) {
          // Penalty for choosing wrong options
          answer.autoScore = -(q.negativeMarks || 0);
        } else {
          // Partial credit for partial correct with NO wrong selections
          const ratio = correctChosen.length / correctOptIds.length;
          answer.autoScore = Number((q.marks * ratio).toFixed(2));
        }
      }
      answer.isEvaluated = true;
      totalScore += answer.autoScore;
    } else if (q.type === 'SHORT_ANSWER') {
      const studentText = (answer.textAnswer || '').trim().toLowerCase();
      const expectedText = (q.correctShortAnswer || '').trim().toLowerCase();

      if (studentText.length > 0 && expectedText.length > 0) {
        if (studentText === expectedText) {
          answer.autoScore = q.marks;
        } else {
          answer.autoScore = -(q.negativeMarks || 0);
        }
      } else {
        answer.autoScore = 0;
      }
      answer.isEvaluated = true;
      totalScore += answer.autoScore;
    } else if (q.type === 'DESCRIPTIVE') {
      // Descriptive question: needs teacher evaluation
      hasDescriptivePending = true;
      answer.isEvaluated = false;
      answer.manualScore = undefined;
    }

    attempt.answers[qId] = answer;
  });

  // Clamp minimum total score to 0
  totalScore = Math.max(0, Number(totalScore.toFixed(2)));
  const percentage = Number(((totalScore / exam.totalMarks) * 100).toFixed(1));
  const isPassed = percentage >= exam.passPercentage;

  attempt.status = hasDescriptivePending ? 'SUBMITTED' : 'EVALUATED';
  attempt.isProvisional = hasDescriptivePending;
  attempt.submittedAt = new Date().toISOString();
  attempt.totalScore = totalScore;
  attempt.percentage = percentage;
  attempt.isPassed = isPassed;

  db.auditLogs.unshift({
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'EXAM_SUBMITTED',
    details: `Submitted attempt #${attempt.attemptNumber} for exam ${exam.title}. Score: ${totalScore}/${exam.totalMarks} (${hasDescriptivePending ? 'Provisional - Descriptive pending' : 'Final'})`,
    timestamp: attempt.submittedAt,
  });

  saveDatabase();

  res.json({
    success: true,
    message: 'Exam submitted successfully.',
    attempt,
  });
}

// Log Proctoring Event
export function logProctoringEvent(req: AuthenticatedRequest, res: Response): void {
  const { id } = req.params; // attemptId
  const user = req.user!;
  const { eventType, severity = 'MEDIUM', details, snapshotUrl } = req.body;

  if (!eventType) {
    res.status(400).json({ success: false, message: 'eventType is required.' });
    return;
  }

  const db = getDb();
  const attempt = db.attempts.find((a) => a.id === id);
  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found.' });
    return;
  }

  const event: ProctoringEvent = {
    id: `pe-${uuidv4().slice(0, 8)}`,
    attemptId: attempt.id,
    studentId: user.id,
    eventType,
    severity,
    timestamp: new Date().toISOString(),
    details: details || `Recorded ${eventType} event`,
    snapshotUrl: snapshotUrl || undefined,
    reviewed: false,
  };

  db.proctoringEvents.push(event);
  attempt.proctoringEventsCount = (attempt.proctoringEventsCount || 0) + 1;
  saveDatabase();

  res.status(201).json({ success: true, event });
}
