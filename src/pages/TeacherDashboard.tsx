import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Exam, Question, Subject, ProctoringEvent } from '../types/index.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Eye,
  Trash2,
  Award,
  Video,
  ShieldAlert,
  Users,
  Check,
  X,
  FileSpreadsheet,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardProps {
  initialSubTab?: string;
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ initialSubTab = 'exams' }) => {
  const [subTab, setSubTab] = useState<'exams' | 'questions' | 'grading' | 'proctoring' | 'analytics'>(
    initialSubTab as any
  );
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingGrading, setPendingGrading] = useState<any[]>([]);
  const [proctoringEvents, setProctoringEvents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState<boolean>(false);

  // New Exam Form
  const [examForm, setExamForm] = useState({
    title: '',
    code: '',
    subjectId: '',
    durationMinutes: 30,
    totalMarks: 10,
    passPercentage: 50,
    questionIds: [] as string[],
    requireCamera: true,
    requireMicrophone: true,
    preventTabSwitch: true,
    preventFullscreenExit: true,
    maxViolationsAllowed: 5,
  });

  // New Question Form
  const [qForm, setQForm] = useState({
    subjectId: '',
    topic: '',
    questionText: '',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    correctShortAnswer: '',
    sampleDescriptiveAnswer: '',
    explanation: '',
  });

  // Manual grading inline form
  const [gradingScores, setGradingScores] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [examsRes, qRes, subRes, pendingRes, proctorRes, statsRes] = await Promise.all([
        api.getExams(),
        api.getQuestions(),
        api.getSubjects(),
        api.getPendingEvaluations(),
        api.getProctoringEvents(),
        api.getAnalyticsOverview(),
      ]);

      setExams(examsRes.exams || []);
      setQuestions(qRes.questions || []);
      setSubjects(subRes.subjects || []);
      setPendingGrading(pendingRes.pendingAnswers || []);
      setProctoringEvents(proctorRes.events || []);
      setAnalytics(statsRes.stats || null);

      if (subRes.subjects && subRes.subjects.length > 0) {
        setExamForm((prev) => ({ ...prev, subjectId: subRes.subjects[0].id }));
        setQForm((prev) => ({ ...prev, subjectId: subRes.subjects[0].id }));
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examForm.questionIds.length === 0) {
      alert('Please select at least one question for the exam.');
      return;
    }

    try {
      await api.createExam({
        title: examForm.title,
        code: examForm.code,
        subjectId: examForm.subjectId,
        durationMinutes: examForm.durationMinutes,
        totalMarks: examForm.totalMarks,
        passPercentage: examForm.passPercentage,
        questionIds: examForm.questionIds,
        proctoringRules: {
          requireCamera: examForm.requireCamera,
          requireMicrophone: examForm.requireMicrophone,
          preventTabSwitch: examForm.preventTabSwitch,
          preventFullscreenExit: examForm.preventFullscreenExit,
          maxViolationsAllowed: examForm.maxViolationsAllowed,
          captureSnapshots: true,
        },
      });
      setShowCreateExamModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create exam');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuestion({
        ...qForm,
        options: qForm.options as any,
        type: qForm.type as any,
        difficulty: qForm.difficulty as any,
        marks: Number(qForm.marks),
        negativeMarks: Number(qForm.negativeMarks),
      });
      setShowCreateQuestionModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create question');
    }
  };

  const handleSubmitGrade = async (item: any) => {
    const key = `${item.attemptId}_${item.questionId}`;
    const gradeData = gradingScores[key] || { score: item.marks, feedback: 'Well structured response.' };

    try {
      await api.gradeAnswer({
        attemptId: item.attemptId,
        questionId: item.questionId,
        score: Number(gradeData.score),
        feedback: gradeData.feedback,
      });
      alert('Grade committed successfully!');
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit grade');
    }
  };

  const handleReviewProctorEvent = async (id: string, decision: string) => {
    try {
      await api.reviewProctoringEvent(id, decision, `Reviewed by teacher with decision: ${decision}`);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Faculty & Examination Administration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage question banks, schedule exams, review proctor flags & evaluate descriptive submissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateQuestionModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
          <button
            onClick={() => setShowCreateExamModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Exam</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Pills */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'exams', label: `Scheduled Exams (${exams.length})` },
          { id: 'questions', label: `Question Bank (${questions.length})` },
          { id: 'grading', label: `Manual Grading (${pendingGrading.length} Pending)` },
          { id: 'proctoring', label: `Proctor Flags (${proctoringEvents.length})` },
          { id: 'analytics', label: 'Analytics & CSV Export' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              subTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXAMS OVERVIEW */}
      {subTab === 'exams' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {exam.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {exam.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{exam.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{exam.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-white font-mono">{exam.durationMinutes} mins</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Marks:</span>
                    <strong className="text-white font-mono">{exam.totalMarks}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Submissions:</span>
                    <strong className="text-emerald-400 font-mono">
                      {exam.completedAttempts || 0} Attempts
                    </strong>
                  </div>

                  <a
                    href={api.getExportCSVUrl(exam.id)}
                    download
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Results (CSV)</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {subTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {questions.length} questions across all topics
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">{q.topic}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {q.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-300">
                    +{q.marks} Marks {q.negativeMarks > 0 && `(-${q.negativeMarks} penalty)`}
                  </div>
                </div>

                <div className="text-sm font-medium text-slate-200">{q.questionText}</div>

                {q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border ${
                          opt.isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        {opt.isCorrect && '✓ '}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                {q.correctShortAnswer && (
                  <div className="text-xs text-emerald-400">
                    Correct Match: <strong>{q.correctShortAnswer}</strong>
                  </div>
                )}

                {q.explanation && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL EVALUATION */}
      {subTab === 'grading' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Pending Descriptive Evaluations</h2>
            <p className="text-xs text-slate-400">
              Grade student essay answers, assign marks, and provide constructive feedback
            </p>
          </div>

          {pendingGrading.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
              All descriptive answers have been graded. No pending evaluations!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingGrading.map((item) => {
                const key = `${item.attemptId}_${item.questionId}`;
                const currentScore = gradingScores[key]?.score ?? item.marks;
                const currentFeedback =
                  gradingScores[key]?.feedback ??
                  'Excellent depth of reasoning and clear technical terminology.';

                return (
                  <div
                    key={key}
                    className="p-6 rounded-2xl bg-slate-900 border border-indigo-900/40 space-y-4 shadow-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-xs font-semibold text-indigo-300">
                          {item.examTitle}
                        </div>
                        <div className="text-sm font-bold text-white">
                          Candidate: {item.studentName} ({item.studentEmail})
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-900/40">
                        Max Marks: {item.marks}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-400">Question:</div>
                      <div className="text-sm font-medium text-slate-200">{item.questionText}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                      <div className="font-semibold text-slate-400">Student's Submitted Answer:</div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {item.studentAnswerText}
                      </p>
                    </div>

                    {/* Teacher grading controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-xs text-slate-400 font-medium">Award Score (0 - {item.marks}):</label>
                        <input
                          type="number"
                          min={0}
                          max={item.marks}
                          step={0.5}
                          value={currentScore}
                          onChange={(e) =>
                            setGradingScores((prev) => ({
                              ...prev,
                              [key]: {
                                score: Number(e.target.value),
                                feedback: currentFeedback,
                              },
                            }))
                          }
                          className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 font-medium">Instructor Written Feedback:</label>
                        <input
                          type="text"
                          value={currentFeedback}
                          onChange={(e) =>
                            setGradingScores((prev) => ({
                              ...prev,
                              [key]: {
                                score: currentScore,
                                feedback: e.target.value,
                              },
                            }))
                          }
                          placeholder="Provide feedback on the answer..."
                          className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSubmitGrade(item)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Commit Grade & Publish Provisional Update</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROCTORING FLAGS */}
      {subTab === 'proctoring' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Proctoring Event Stream & Review Timeline</h2>
            <p className="text-xs text-slate-400">
              Browser signals (fullscreen exit, tab switches, audio spikes). Review and record decisions.
            </p>
          </div>

          <div className="space-y-3">
            {proctoringEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ev.severity === 'HIGH' || ev.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {ev.eventType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {ev.studentName} &bull; <span className="text-indigo-400 text-xs font-normal">{ev.examTitle}</span>
                  </div>
                  <p className="text-xs text-slate-400">{ev.details}</p>
                </div>

                <div className="flex items-center gap-2">
                  {ev.reviewed ? (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        ev.reviewDecision === 'CLEARED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      Decision: {ev.reviewDecision}
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleReviewProctorEvent(ev.id, 'CLEARED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                      >
                        Clear Flag
                      </button>
                      <button
                        onClick={() => handleReviewProctorEvent(ev.id, 'FLAGGED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30"
                      >
                        Confirm Violation
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: RESULT ANALYTICS (RECHARTS) */}
      {subTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Average Score</div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1">{analytics.avgScore}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Pass Percentage</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.passPercentage}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Highest Score</div>
              <div className="text-2xl font-extrabold text-white mt-1">{analytics.highestScore}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Proctor Flags Logged</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">{analytics.totalProctoringEvents}</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Chart */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Score Distribution Bins</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.scoreDistribution}>
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject Performance Chart */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Subject-Wise Performance (%)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.subjectPerformance}>
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Bar dataKey="averageScore" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create & Schedule Exam</h3>
              <button
                onClick={() => setShowCreateExamModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Exam Title:</label>
                  <input
                    type="text"
                    required
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    placeholder="e.g. CS-301 Midterm Examination"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Exam Code:</label>
                  <input
                    type="text"
                    required
                    value={examForm.code}
                    onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                    placeholder="e.g. CS-301-MID"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Duration (Mins):</label>
                  <input
                    type="number"
                    min={5}
                    value={examForm.durationMinutes}
                    onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Total Marks:</label>
                  <input
                    type="number"
                    value={examForm.totalMarks}
                    onChange={(e) => setExamForm({ ...examForm, totalMarks: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Pass Percentage (%):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={examForm.passPercentage}
                    onChange={(e) => setExamForm({ ...examForm, passPercentage: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              {/* Proctoring Rules */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-indigo-300">Proctoring Enforcement Rules:</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.requireCamera}
                      onChange={(e) => setExamForm({ ...examForm, requireCamera: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <span>Require Webcam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.preventTabSwitch}
                      onChange={(e) => setExamForm({ ...examForm, preventTabSwitch: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <span>Lock Tab-Switching</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.preventFullscreenExit}
                      onChange={(e) => setExamForm({ ...examForm, preventFullscreenExit: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <span>Enforce Fullscreen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={examForm.requireMicrophone}
                      onChange={(e) => setExamForm({ ...examForm, requireMicrophone: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                    <span>Microphone Audio Monitor</span>
                  </label>
                </div>
              </div>

              {/* Select Questions from Bank */}
              <div className="space-y-2">
                <label className="text-slate-400 font-medium">Select Questions from Question Bank:</label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {questions.map((q) => {
                    const isChecked = examForm.questionIds.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-slate-300"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExamForm({ ...examForm, questionIds: [...examForm.questionIds, q.id] });
                            } else {
                              setExamForm({
                                ...examForm,
                                questionIds: examForm.questionIds.filter((id) => id !== q.id),
                              });
                            }
                          }}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-white">{q.topic}: </span>
                          <span>{q.questionText}</span>
                          <span className="text-indigo-400 ml-1">({q.marks} marks)</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
              >
                Publish Examination
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE QUESTION MODAL */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add New Question to Bank</h3>
              <button
                onClick={() => setShowCreateQuestionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Question Type:</label>
                  <select
                    value={qForm.type}
                    onChange={(e) => setQForm({ ...qForm, type: e.target.value as any })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="SINGLE_CHOICE">Single Choice (MCQ)</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice (Multi-Select)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer (Keyword)</option>
                    <option value="DESCRIPTIVE">Descriptive (Manual Grading)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Topic / Area:</label>
                  <input
                    type="text"
                    required
                    value={qForm.topic}
                    onChange={(e) => setQForm({ ...qForm, topic: e.target.value })}
                    placeholder="e.g. Distributed Systems"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Difficulty:</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value as any })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Question Statement:</label>
                <textarea
                  rows={3}
                  required
                  value={qForm.questionText}
                  onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                  placeholder="Enter the question text clearly..."
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Marks Awarded:</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={qForm.marks}
                    onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Negative Marks Penalty:</label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={qForm.negativeMarks}
                    onChange={(e) => setQForm({ ...qForm, negativeMarks: Number(e.target.value) })}
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Options for MCQ */}
              {(qForm.type === 'SINGLE_CHOICE' || qForm.type === 'MULTIPLE_CHOICE') && (
                <div className="space-y-2">
                  <label className="text-slate-400 font-medium">Options (Select checkbox for correct answer):</label>
                  {qForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type={qForm.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                        name="correct-option"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = qForm.options.map((o, i) => {
                            if (qForm.type === 'SINGLE_CHOICE') {
                              return { ...o, isCorrect: i === idx };
                            }
                            return i === idx ? { ...o, isCorrect: e.target.checked } : o;
                          });
                          setQForm({ ...qForm, options: updated });
                        }}
                      />
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...qForm.options];
                          updated[idx].text = e.target.value;
                          setQForm({ ...qForm, options: updated });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Short Answer Match */}
              {qForm.type === 'SHORT_ANSWER' && (
                <div>
                  <label className="text-slate-400 font-medium">Expected Exact Short Answer:</label>
                  <input
                    type="text"
                    required
                    value={qForm.correctShortAnswer}
                    onChange={(e) => setQForm({ ...qForm, correctShortAnswer: e.target.value })}
                    placeholder="e.g. Content-Security-Policy"
                    className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="text-slate-400 font-medium">Conceptual Explanation (Shown after results):</label>
                <textarea
                  rows={2}
                  value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                  placeholder="Explain why this answer is correct..."
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
              >
                Save to Question Bank
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
