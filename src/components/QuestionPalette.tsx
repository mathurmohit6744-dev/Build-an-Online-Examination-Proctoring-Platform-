import React from 'react';
import { Question, SubmittedAnswer } from '../types/index.ts';
import { Bookmark, Check, HelpCircle, Eye } from 'lucide-react';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, SubmittedAnswer>;
  visitedIndices: Set<number>;
  onSelectIndex: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  visitedIndices,
  onSelectIndex,
}) => {
  // Counters
  let answeredCount = 0;
  let markedCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q, idx) => {
    const ans = answers[q.id];
    const isAns = ans?.isAnswered;
    const isMarked = ans?.isMarkedForReview;

    if (isAns) answeredCount++;
    if (isMarked) markedCount++;
    if (!visitedIndices.has(idx)) notVisitedCount++;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white">Question Navigator</h3>
        <span className="text-xs text-slate-400 font-mono">
          {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Status Legend */}
      <div className="grid grid-cols-2 gap-2 my-3 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400 flex items-center justify-center text-[9px] text-white">✓</span>
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400 flex items-center justify-center text-[9px] text-white">★</span>
          <span>Marked ({markedCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/60" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          <span>Not Visited ({notVisitedCount})</span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const ans = answers[q.id];
            const isAnswered = Boolean(ans?.isAnswered);
            const isMarked = Boolean(ans?.isMarkedForReview);
            const isVisited = visitedIndices.has(idx);

            let bgClass = 'bg-slate-800/80 border-slate-700 text-slate-400';

            if (isAnswered && isMarked) {
              bgClass = 'bg-purple-600 text-white border-purple-400 ring-1 ring-purple-300';
            } else if (isAnswered) {
              bgClass = 'bg-emerald-600/90 text-white border-emerald-400 shadow-sm shadow-emerald-600/30';
            } else if (isMarked) {
              bgClass = 'bg-purple-500/30 text-purple-200 border-purple-400';
            } else if (isVisited) {
              bgClass = 'bg-amber-500/15 text-amber-200 border-amber-500/50';
            }

            return (
              <button
                key={q.id}
                onClick={() => onSelectIndex(idx)}
                className={`relative h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center border ${bgClass} ${
                  isCurrent ? 'ring-2 ring-indigo-400 scale-105 z-10' : 'hover:scale-102'
                }`}
              >
                <span>{idx + 1}</span>
                {isMarked && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-300" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
