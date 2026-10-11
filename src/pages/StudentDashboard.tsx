import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Exam } from '../types/index.ts';
import { PreExamCheckModal } from '../components/PreExamCheckModal.tsx';
import {
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  Video,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface StudentDashboardProps {
  onStartExam: (examId: string, stream: MediaStream | null) => void;
  onViewResult: (attemptId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onStartExam,
  onViewResult,
}) => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExamForCheck, setSelectedExamForCheck] = useState<Exam | null>(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await api.getExams();
      setExams(res.exams || []);
    } catch (err) {
      console.error('Failed to load student exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedFromCheck = (stream: MediaStream | null) => {
    if (!selectedExamForCheck) return;
    const examId = selectedExamForCheck.id;
    setSelectedExamForCheck(null);
    onStartExam(examId, stream);
  };

  const availableExams = exams.filter(
    (e) => !e.latestAttempt || e.hasActiveAttempt || e.attemptsCount < e.maxAttempts
  );

  const completedExams = exams.filter(
    (e) => e.latestAttempt && (e.latestAttempt.status === 'SUBMITTED' || e.latestAttempt.status === 'EVALUATED')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Student Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-800/40 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Student Portal &bull; Verified ID: {user?.studentId || 'CS2026-0491'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your examination sessions are safeguarded by ExamSecure AI Proctoring. Ensure your camera and microphone are tested before beginning an assessment.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium">Assigned Exams</div>
              <div className="text-xl font-bold text-white mt-0.5">{exams.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium">Completed</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{completedExams.length}</div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium">Proctor Status</div>
              <div className="text-xs font-bold text-indigo-300 mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available & Active Exams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Available Examinations</h2>
            <p className="text-xs text-slate-400">Timed assessments ready for attempt</p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-900/40">
            {availableExams.length} Available
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading exams...</div>
        ) : availableExams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            No exams currently available. You have finished all active sessions!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableExams.map((exam) => {
              const isActive = exam.hasActiveAttempt;

              return (
                <div
                  key={exam.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-lg ${
                    isActive
                      ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {exam.code}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                          {exam.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      </div>
                    </div>

                    {/* Exam specs */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{exam.durationMinutes} Mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        <span>{exam.totalMarks} Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pass: {exam.passPercentage}%</span>
                      </div>
                    </div>

                    {/* Proctoring Badges */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {exam.proctoringRules?.requireCamera && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                          <Video className="w-3 h-3 text-indigo-400" /> Camera Monitored
                        </span>
                      )}
                      {exam.proctoringRules?.preventTabSwitch && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Tab-Switch Lock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Attempts: {exam.attemptsCount}/{exam.maxAttempts}
                    </span>

                    {isActive ? (
                      <button
                        onClick={() => onStartExam(exam.id, null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-md shadow-amber-600/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume In-Progress Exam</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedExamForCheck(exam)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                      >
                        <span>Start Examination</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Exams & Past Results Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Completed Examinations & Reports</h2>
          <p className="text-xs text-slate-400">View released scores, answer breakdown & teacher feedback</p>
        </div>

        {completedExams.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-sm">
            No completed exams yet. Take your first exam above to view performance analysis!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedExams.map((exam) => {
              const attempt = exam.latestAttempt;
              const isPassed = attempt.isPassed;
              const isProvisional = attempt.isProvisional;

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {exam.code}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted: {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isProvisional
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {isProvisional ? 'Provisional Result' : isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                    </span>
                  </div>

                  {/* Score breakdown banner */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Total Score Awarded</div>
                      <div className="text-lg font-extrabold text-white">
                        {attempt.totalScore} <span className="text-xs text-slate-400">/ {exam.totalMarks}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Percentage</div>
                      <div className="text-lg font-extrabold text-indigo-400">
                        {attempt.percentage}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Proctor Flags</div>
                      <div className="text-sm font-bold text-slate-300">
                        {attempt.proctoringEventsCount || 0} Recorded
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewResult(attempt.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Detailed Question-by-Question Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pre-Exam Hardware Check Modal */}
      {selectedExamForCheck && (
        <PreExamCheckModal
          exam={selectedExamForCheck}
          isOpen={Boolean(selectedExamForCheck)}
          onClose={() => setSelectedExamForCheck(null)}
          onProceed={handleProceedFromCheck}
        />
      )}
    </div>
  );
};
