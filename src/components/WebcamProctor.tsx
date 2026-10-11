import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, ShieldAlert, Minimize2, Maximize2, AlertTriangle } from 'lucide-react';

interface WebcamProctorProps {
  stream: MediaStream | null;
  violationsCount: number;
  maxViolations: number;
  lastEventAlert?: string;
}

export const WebcamProctor: React.FC<WebcamProctorProps> = ({
  stream,
  violationsCount,
  maxViolations,
  lastEventAlert,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Violation Alert Flash Banner if recent event */}
      {lastEventAlert && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{lastEventAlert}</span>
        </div>
      )}

      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isMinimized ? 'w-48 h-12' : 'w-64 sm:w-72'
        }`}
      >
        {/* Header Bar */}
        <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-200">PROCTOR ACTIVE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                violationsCount === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : violationsCount < maxViolations
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              Flags: {violationsCount}/{maxViolations}
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              title={isMinimized ? 'Expand Camera' : 'Minimize Widget'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Video stream container */}
        {!isMinimized && (
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center p-3">
                <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-semibold text-slate-300 mt-1">Virtual Stream</div>
                <div className="text-[9px] text-slate-500">Simulation active</div>
              </div>
            )}

            {/* Overlay indicators */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <Camera className="w-3 h-3" /> Camera ON
              </span>
              <span className="flex items-center gap-1 text-indigo-300">
                <Mic className="w-3 h-3" /> Audio ON
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
