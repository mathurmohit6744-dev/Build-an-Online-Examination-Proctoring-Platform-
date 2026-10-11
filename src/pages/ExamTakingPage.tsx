import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { Exam, ExamAttempt, Question, SubmittedAnswer } from '../types/index.ts';
import { ExamTimer } from '../components/ExamTimer.tsx';
import { QuestionPalette } from '../components/QuestionPalette.tsx';
import { WebcamProctor } from '../components/WebcamProctor.tsx';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  ShieldAlert,
  Loader2,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ExamTakingPageProps {
  examId: string;
  mediaStream: MediaStream | null;
  onFinishExam: (attemptId: string) => void;
  onExit: () => void;
}

export const ExamTakingPage: React.FC<ExamTakingPageProps> = ({
  examId,
  mediaStream,
  onFinishExam,
  onExit,
}) => {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>({});
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(new Set([0]));
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [lastEventAlert, setLastEventAlert] = useState<string | undefined>();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or resume attempt
  useEffect(() => {
    async function initAttempt() {
      try {
        setLoading(true);
        const res = await api.startAttempt(examId);
        setExam(res.exam);
        setAttempt(res.attempt);
        setQuestions(res.questions);
        setAnswers(res.attempt.answers || {});
        setViolationsCount(res.attempt.proctoringEventsCount || 0);

        // Attempt fullscreen if supported
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      } catch (err: any) {
        alert(err.message || 'Failed to start or resume exam attempt.');
        onExit();
      } finally {
        setLoading(false);
      }
    }
    initAttempt();
  }, [examId]);

  // Security Proctoring Listeners (Tab Switch & Fullscreen Exit)
  useEffect(() => {
    if (!attempt || !exam) return;

    const handleVisibilityChange = () => {
      if (document.hidden && exam.proctoringRules.preventTabSwitch) {
        triggerProctorEvent('TAB_SWITCH', 'HIGH', 'Student switched browser tab or minimized window.');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam.proctoringRules.preventFullscreenExit) {
        triggerProctorEvent('FULLSCREEN_EXIT', 'HIGH', 'Student exited fullscreen examination mode.');
      }
    };

    const handleWindowBlur = () => {
      if (exam.proctoringRules.preventTabSwitch) {
        triggerProctorEvent('TAB_SWITCH', 'MEDIUM', 'Window focus lost (possible application switch).');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [attempt, exam]);

  const triggerProctorEvent = async (eventType: string, severity: string, details: string) => {
    if (!attempt) return;
    try {
      setViolationsCount((prev) => prev + 1);
      setLastEventAlert(`Security Flag: ${eventType.replace(/_/g, ' ')} detected!`);
      setTimeout(() => setLastEventAlert(undefined), 6000);

      await api.logProctoringEvent(attempt.id, {
        eventType,
        severity,
        details,
      });
    } catch (err) {
      console.warn('Failed to log proctoring event:', err);
    }
  };

  // Mark current index visited
  const handleSelectIndex = (index: number) => {
    setCurrentIndex(index);
    setVisitedIndices((prev) => new Set(prev).add(index));
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // AutoSave Debounced Handler
  const updateAnswer = (newPartial: Partial<SubmittedAnswer>) => {
    if (!currentQuestion || !attempt) return;

    const updatedAns: SubmittedAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIds: currentAnswer?.selectedOptionIds || [],
      textAnswer: currentAnswer?.textAnswer || '',
      isMarkedForReview: currentAnswer?.isMarkedForReview || false,
      isAnswered: false,
      ...newPartial,
    };

    // Determine isAnswered
    const isAnswered =
      (updatedAns.selectedOptionIds && updatedAns.selectedOptionIds.length > 0) ||
      (typeof updatedAns.textAnswer === 'string' && updatedAns.textAnswer.trim().length > 0);
    updatedAns.isAnswered = Boolean(isAnswered);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveAnswer(attempt.id, {
          questionId: currentQuestion.id,
          selectedOptionIds: updatedAns.selectedOptionIds,
          textAnswer: updatedAns.textAnswer,
          isMarkedForReview: updatedAns.isMarkedForReview,
        });
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 400);
  };

  // Option selection handler
  const handleOptionToggle = (optionId: string) => {
    if (!currentQuestion) return;

    if (currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') {
      updateAnswer({ selectedOptionIds: [optionId] });
    } else if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      const currentSelected = currentAnswer?.selectedOptionIds || [];
      const isAlready = currentSelected.includes(optionId);
      const updated = isAlready
        ? currentSelected.filter((id) => id !== optionId)
        : [...currentSelected, optionId];
      updateAnswer({ selectedOptionIds: updated });
    }
  };

  const handleClearCurrentAnswer = () => {
    if (!currentQuestion) return;
    updateAnswer({ selectedOptionIds: [], textAnswer: '' });
  };

  const handleToggleMarkReview = () => {
    if (!currentQuestion) return;
    updateAnswer({ isMarkedForReview: !currentAnswer?.isMarkedForReview });
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const res = await api.submitAttempt(attempt.id);
      onFinishExam(res.attempt.id);
    } catch (err: any) {
      alert(err.message || 'Submission failed. Please verify your connection.');
      setIsSubmitting(false);
    }
  };

  // On deadline expire
  const handleTimerExpire = () => {
    alert('Time has expired! Submitting your examination answers automatically.');
    handleFinalSubmit();
  };

  if (loading || !exam || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-white font-bold">Synchronizing Examination Environment...</div>
        <p className="text-xs text-slate-400">Verifying secure deadline & loading sanitized questions</p>
      </div>
    );
  }

  // Answer stats for submit modal
  const answeredCount = Object.values(answers).filter((a) => a.isAnswered).length;
  const markedCount = Object.values(answers).filter((a) => a.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            {exam.code.slice(0, 3)}
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight truncate max-w-xs sm:max-w-md">
              {exam.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-mono">
                {saveStatus === 'saved' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Autosaved ({lastSavedTime})
                  </span>
                ) : saveStatus === 'saving' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Save Error (Retrying)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center Timer & Right Actions */}
        <div className="flex items-center gap-3">
          <ExamTimer deadlineAt={attempt.deadlineAt} onExpire={handleTimerExpire} />

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Content (Left 3 columns) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="space-y-6">
            {/* Meta Tags Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                  Q{currentIndex + 1} &bull; {currentQuestion.type.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                  {currentQuestion.topic}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    currentQuestion.difficulty === 'EASY'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : currentQuestion.difficulty === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Marks: <strong className="text-white">+{currentQuestion.marks}</strong>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="text-red-400 ml-1.5 font-normal">
                    (Penalty: -{currentQuestion.negativeMarks})
                  </span>
                )}
              </div>
            </div>

            {/* Question Statement */}
            <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
              {currentQuestion.questionText}
            </div>

            {/* Answer Options according to Question Type */}
            <div className="pt-2">
              {/* SINGLE CHOICE or TRUE FALSE */}
              {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'TRUE_FALSE') && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionToggle(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-400 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="flex-1 text-sm font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* MULTIPLE CHOICE */}
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <div className="text-xs text-indigo-300 font-medium pb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Multiple-Select: Choose one or more correct choices
                  </div>
                  {currentQuestion.options?.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionToggle(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-400 shadow-md shadow-indigo-600/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isSelected ? '✓' : letter}
                        </div>
                        <span className="flex-1 text-sm font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* SHORT ANSWER */}
              {currentQuestion.type === 'SHORT_ANSWER' && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Enter exact answer or keyword:</label>
                  <input
                    type="text"
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => updateAnswer({ textAnswer: e.target.value })}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-[11px] text-slate-500">
                    Case-insensitive exact match will be evaluated automatically.
                  </p>
                </div>
              )}

              {/* DESCRIPTIVE ANSWER */}
              {currentQuestion.type === 'DESCRIPTIVE' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Provide your complete structured explanation:</span>
                    <span className="font-mono text-[11px]">
                      {(currentAnswer?.textAnswer || '').trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={7}
                    value={currentAnswer?.textAnswer || ''}
                    onChange={(e) => updateAnswer({ textAnswer: e.target.value })}
                    placeholder="Write your detailed explanation here..."
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent leading-relaxed"
                  />
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-[11px] text-indigo-300">
                    Note: Descriptive responses are marked as provisional and graded individually by the instructor with personalized feedback.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMarkReview}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                  currentAnswer?.isMarkedForReview
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              <button
                onClick={handleClearCurrentAnswer}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 flex items-center gap-1 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => handleSelectIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette (Right 1 column) */}
        <div className="lg:col-span-1 h-full">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            visitedIndices={visitedIndices}
            onSelectIndex={handleSelectIndex}
          />
        </div>
      </div>

      {/* Floating Proctoring Camera Box */}
      <WebcamProctor
        stream={mediaStream}
        violationsCount={violationsCount}
        maxViolations={exam.proctoringRules.maxViolationsAllowed}
        lastEventAlert={lastEventAlert}
      />

      {/* Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Submit Examination?</h3>
              <p className="text-xs text-slate-400">
                Please review your progress before completing this attempt. You cannot modify answers after submission.
              </p>
            </div>

            {/* Progress summary table */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Total Questions:</span>
                <strong className="text-white font-mono">{questions.length}</strong>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Answered:</span>
                <strong className="font-mono">{answeredCount}</strong>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Unanswered:</span>
                <strong className="font-mono">{unansweredCount}</strong>
              </div>
              <div className="flex justify-between text-purple-400">
                <span>Marked for Review:</span>
                <strong className="font-mono">{markedCount}</strong>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  You still have {unansweredCount} unanswered questions. Make sure you have attempted all required questions.
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Back to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
