import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Clock,
  BookOpen,
  MessageSquare,
  FileText,
  Share2,
} from 'lucide-react';

interface ExamResultPageProps {
  attemptId: string;
  onBack: () => void;
}

export const ExamResultPage: React.FC<ExamResultPageProps> = ({
  attemptId,
  onBack,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        const res = await api.getAttemptResult(attemptId);
        setData(res);
      } catch (err: any) {
        alert(err.message || 'Failed to load exam result.');
        onBack();
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [attemptId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-white text-sm font-semibold">Generating Result Analytics...</div>
      </div>
    );
  }

  const { attempt, exam, subject, breakdown, student } = data;
  const isPassed = attempt.isPassed;
  const isProvisional = attempt.isProvisional;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Score Card Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {exam.code} &bull; {subject?.name || 'General Subject'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <span className="text-slate-200 font-medium">{student?.name}</span> ({student?.email})
            </p>
          </div>

          {/* Big Score Badge */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 min-w-[200px] text-center shadow-xl">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {isProvisional ? 'Provisional Score' : 'Final Score'}
            </div>
            <div className="text-4xl font-extrabold text-white mt-1">
              {attempt.totalScore}
              <span className="text-lg text-slate-500 font-normal"> / {exam.totalMarks}</span>
            </div>
            <div className="text-sm font-bold text-indigo-400 mt-1">
              {attempt.percentage}%
            </div>

            <div className="mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isProvisional
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {isProvisional
                  ? 'Descriptive Evaluation Pending'
                  : isPassed
                  ? 'PASSED WITH MERIT'
                  : 'BELOW CUTOFF PERCENTAGE'}
              </span>
            </div>
          </div>
        </div>

        {/* Proctoring & Integrity Summary */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white">Proctoring Assessment</div>
              <div className="text-slate-400 text-[11px]">
                {attempt.proctoringEventsCount === 0
                  ? 'Zero security flags logged'
                  : `${attempt.proctoringEventsCount} incident(s) reviewed`}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white">Session Duration</div>
              <div className="text-slate-400 text-[11px]">
                Completed on {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white">Minimum Pass Benchmark</div>
              <div className="text-slate-400 text-[11px]">
                {exam.passPercentage}% required (Obtained: {attempt.percentage}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Breakdown Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Question-by-Question Analysis</h2>
            <p className="text-xs text-slate-400">Review correct answers, explanations & instructor feedback</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {breakdown?.length || 0} Questions Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {breakdown?.map((item: any, idx: number) => {
            const { question, submittedAnswer } = item;
            const isDescriptive = question.type === 'DESCRIPTIVE';
            const marksAwarded =
              isDescriptive
                ? submittedAnswer?.manualScore
                : submittedAnswer?.autoScore;

            const isCorrect = marksAwarded !== undefined && marksAwarded > 0;
            const isFullMarks = marksAwarded === question.marks;

            return (
              <div
                key={question.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center justify-center">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      {question.topic}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {question.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDescriptive ? (
                      submittedAnswer?.isEvaluated ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Teacher Score: {submittedAnswer.manualScore} / {question.marks}
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pending Manual Grading ({question.marks} Marks)
                        </span>
                      )
                    ) : (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                          isFullMarks
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isCorrect
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        Score: {marksAwarded !== undefined ? marksAwarded : 0} / {question.marks}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-medium text-white leading-relaxed">
                  {question.questionText}
                </div>

                {/* Student's answer vs correct option (for choice questions) */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-400">Answer Options:</div>
                    <div className="grid grid-cols-1 gap-2">
                      {question.options.map((opt: any) => {
                        const isStudentChosen = submittedAnswer?.selectedOptionIds?.includes(opt.id);
                        const isCorrectOption = opt.isCorrect;

                        let style = 'bg-slate-950/60 border-slate-800 text-slate-400';
                        if (isCorrectOption) {
                          style = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-medium';
                        } else if (isStudentChosen && !isCorrectOption) {
                          style = 'bg-red-950/40 border-red-500/50 text-red-200 line-through';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                          >
                            <span>{opt.text}</span>
                            <div className="flex items-center gap-2">
                              {isStudentChosen && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  Your Choice
                                </span>
                              )}
                              {isCorrectOption && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Short Answer text check */}
                {question.type === 'SHORT_ANSWER' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Your Answer: </span>
                      <strong className="text-white font-mono">{submittedAnswer?.textAnswer || '(Empty)'}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-400">Expected Key: </span>
                      <strong className="text-emerald-300 font-mono">{question.correctShortAnswer}</strong>
                    </div>
                  </div>
                )}

                {/* Descriptive response check */}
                {isDescriptive && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="text-slate-400 font-semibold mb-1">Your Submitted Response:</div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {submittedAnswer?.textAnswer || '(No text submitted)'}
                      </p>
                    </div>

                    {/* Teacher Feedback Banner if evaluated */}
                    {submittedAnswer?.feedback && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-xs space-y-1">
                        <div className="text-indigo-300 font-semibold flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          Teacher Written Feedback:
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {submittedAnswer.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Conceptual Explanation Box */}
                {question.explanation && (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-slate-300 space-y-1">
                    <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                      Concept Explanation:
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
