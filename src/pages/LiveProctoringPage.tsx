import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Camera,
  Mic,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Video,
  Eye,
  Sliders,
  Send,
} from 'lucide-react';

export const LiveProctoringPage: React.FC = () => {
  const [activeCandidates, setActiveCandidates] = useState([
    {
      id: 'cand-1',
      name: 'Mohit Mathur',
      studentId: 'CS2026-0491',
      examCode: 'CS-301-MID',
      status: 'ACTIVE',
      currentQuestion: 4,
      violations: 0,
      pingMs: 24,
      audioLevel: 15,
      cameraStatus: 'STREAMING',
    },
    {
      id: 'cand-2',
      name: 'Jane Doe',
      studentId: 'CS2026-0512',
      examCode: 'CS-301-MID',
      status: 'FLAGGED',
      currentQuestion: 6,
      violations: 1,
      pingMs: 38,
      audioLevel: 45,
      cameraStatus: 'STREAMING',
    },
    {
      id: 'cand-3',
      name: 'Liam Chen',
      studentId: 'CS2026-0883',
      examCode: 'CYBER-QUIZ-1',
      status: 'ACTIVE',
      currentQuestion: 2,
      violations: 0,
      pingMs: 19,
      audioLevel: 10,
      cameraStatus: 'STREAMING',
    },
  ]);

  const [alerts, setAlerts] = useState<string[]>([
    '[10:14:22] Jane Doe: Tab switch recorded (Duration: 4s).',
    '[10:08:15] Mohit Mathur: Verified camera & microphone media check passed.',
    '[10:05:00] Proctor Engine: ICE STUN signaling initialized across active candidates.',
  ]);

  const [warningMessage, setWarningMessage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const handleSendWarning = (cand: any) => {
    const msg = prompt(`Enter warning notification for ${cand.name}:`, 'Please remain in fullscreen and keep eyes on screen.');
    if (msg) {
      setAlerts((prev) => [`[${new Date().toLocaleTimeString()}] Warning sent to ${cand.name}: "${msg}"`, ...prev]);
      alert(`Warning broadcast sent to ${cand.name}'s exam client.`);
    }
  };

  const handleFlagCandidate = (cand: any) => {
    setActiveCandidates((prev) =>
      prev.map((c) => (c.id === cand.id ? { ...c, status: 'FLAGGED', violations: c.violations + 1 } : c))
    );
    setAlerts((prev) => [
      `[${new Date().toLocaleTimeString()}] Instructor manually flagged ${cand.name} for academic audit.`,
      ...prev,
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE PROCTORING COMMAND CENTER
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Real-Time Exam Supervision</h1>
          <p className="text-xs text-slate-400">
            Supervise active student webcams, audio activity & incoming browser integrity signals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
            {activeCandidates.length} Active Feeds
          </span>
        </div>
      </div>

      {/* Surveillance Video Feeds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCandidates.map((cand) => {
          const isFlagged = cand.status === 'FLAGGED' || cand.violations > 0;

          return (
            <div
              key={cand.id}
              className={`rounded-2xl bg-slate-900 border overflow-hidden shadow-xl flex flex-col justify-between transition-all ${
                isFlagged
                  ? 'border-red-500/60 ring-1 ring-red-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Video Header */}
              <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{cand.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({cand.studentId})</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isFlagged
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {cand.status}
                </span>
              </div>

              {/* Video Monitor Stream Canvas / Simulated peer feed */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <div className="text-center space-y-2 p-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Candidate Feed &bull; WebRTC STUN/ICE
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Latency: {cand.pingMs}ms &bull; 640x480 @ 30fps
                  </div>
                </div>

                {/* Video Overlays */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                  <Camera className="w-2.5 h-2.5" /> LIVE STREAM
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-[10px] text-slate-300">
                  <span>Exam: <strong className="text-white font-mono">{cand.examCode}</strong></span>
                  <span>Q{cand.currentQuestion} Active</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flags: <strong className="text-white">{cand.violations}</strong></span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSendWarning(cand)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                  >
                    Send Warning
                  </button>
                  <button
                    onClick={() => handleFlagCandidate(cand)}
                    className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-semibold"
                  >
                    Flag Violation
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Security Log Stream */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Live Proctor Event Stream</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Auto-refreshing stream</span>
        </div>

        <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto">
          {alerts.map((al, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">
              {al}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
