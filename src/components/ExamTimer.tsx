import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface ExamTimerProps {
  deadlineAt: string;
  onExpire: () => void;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ deadlineAt, onExpire }) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    return Math.max(0, new Date(deadlineAt).getTime() - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, new Date(deadlineAt).getTime() - Date.now());
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 300; // less than 5 minutes
  const isWarning = totalSeconds < 600 && !isUrgent; // less than 10 minutes

  const format2 = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-colors ${
        isUrgent
          ? 'bg-red-950/80 border-red-500/80 text-red-300 animate-pulse'
          : isWarning
          ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
          : 'bg-slate-900 border-slate-700/80 text-slate-200'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-indigo-400'}`} />
      <span>
        {hours > 0 ? `${format2(hours)}:` : ''}
        {format2(minutes)}:{format2(seconds)}
      </span>
      {isUrgent && (
        <span className="text-[10px] font-sans font-semibold uppercase bg-red-600 text-white px-1.5 rounded">
          Expiring Soon
        </span>
      )}
    </div>
  );
};
