import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Mic,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Info,
} from 'lucide-react';
import { Exam } from '../types/index.ts';

interface PreExamCheckModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onProceed: (stream: MediaStream | null) => void;
}

export const PreExamCheckModal: React.FC<PreExamCheckModalProps> = ({
  exam,
  isOpen,
  onClose,
  onProceed,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'granted' | 'denied' | 'simulated'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'granted' | 'denied' | 'simulated'>('checking');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupMedia();
      return;
    }

    startMediaCheck();

    return () => {
      cleanupMedia();
    };
  }, [isOpen]);

  const cleanupMedia = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const startMediaCheck = async () => {
    setCameraStatus('checking');
    setMicStatus('checking');
    setErrorMsg('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: exam.proctoringRules.requireCamera ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: exam.proctoringRules.requireMicrophone ? true : false,
      });

      setStream(mediaStream);
      setCameraStatus('granted');
      setMicStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Audio meter via AudioContext
      if (exam.proctoringRules.requireMicrophone) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(mediaStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (e) {
          console.warn('Audio analyser setup note:', e);
        }
      }
    } catch (err: any) {
      console.warn('Webcam/Mic hardware not accessible, offering virtual proctor mode:', err);
      setErrorMsg(err.message || 'Permission denied or no webcam hardware detected.');
      setCameraStatus('denied');
      setMicStatus('denied');
    }
  };

  const handleUseVirtualCamera = () => {
    setCameraStatus('simulated');
    setMicStatus('simulated');
    setAudioLevel(35);
  };

  if (!isOpen) return null;

  const canProceed =
    (cameraStatus === 'granted' || cameraStatus === 'simulated') &&
    (micStatus === 'granted' || micStatus === 'simulated') &&
    agreedToTerms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pre-Exam Proctoring Check</h2>
              <p className="text-xs text-slate-400">
                Verifying system requirements for <span className="text-slate-200 font-medium">{exam.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Video preview / Simulated state */}
          <div className="relative bg-slate-950 rounded-xl border border-slate-800 aspect-video overflow-hidden flex items-center justify-center shadow-inner">
            {cameraStatus === 'granted' ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : cameraStatus === 'simulated' ? (
              <div className="text-center p-6 space-y-3">
                <div className="relative mx-auto w-24 h-24 rounded-full bg-indigo-950/80 border-2 border-indigo-500/50 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-indigo-400" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Virtual Proctoring Stream Active</div>
                  <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                    Simulated camera active for demo testing environments where a physical hardware webcam is not present.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Camera Check Pending / Blocked</div>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Please allow camera access in your browser or enable Virtual Camera mode below for testing.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={startMediaCheck}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white"
                  >
                    Retry Permission
                  </button>
                  <button
                    onClick={handleUseVirtualCamera}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-indigo-300 border border-slate-700"
                  >
                    Enable Virtual Camera (Demo)
                  </button>
                </div>
              </div>
            )}

            {/* Video overlay badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE PROCTOR FEED
            </div>
          </div>

          {/* Device Verification Status List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Status */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Webcam Sensor</span>
                  {cameraStatus === 'granted' || cameraStatus === 'simulated' ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Action Needed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Continuous optical monitoring enabled
                </p>
              </div>
            </div>

            {/* Mic Status */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Mic className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Microphone Input</span>
                  {micStatus === 'granted' || micStatus === 'simulated' ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Action Needed
                    </span>
                  )}
                </div>
                {/* Visual Audio meter */}
                <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Proctoring Transparency Policy */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              Exam Environment & Proctoring Guidelines:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              <li>
                <strong className="text-slate-300">Full Screen Mode:</strong> The exam will enter fullscreen. Exiting fullscreen logs an automated timestamped flag.
              </li>
              <li>
                <strong className="text-slate-300">Tab Focus Tracking:</strong> Switching browser tabs or minimizing the window is recorded as a review signal.
              </li>
              <li>
                <strong className="text-slate-300">Autosave:</strong> Every answer choice is transmitted and committed to the server in real time.
              </li>
              <li>
                <strong className="text-slate-300">Human Review:</strong> Flags are signals for teacher review; students are never automatically failed without human verification.
              </li>
            </ul>
          </div>

          {/* Honor Code & Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <span className="text-xs text-slate-300 select-none leading-relaxed">
              I agree to the Examination Code of Conduct. I acknowledge that my camera and browser session
              will be monitored for academic integrity, and that all actions are recorded in the audit log.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onProceed(stream)}
            disabled={!canProceed}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Examination</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
