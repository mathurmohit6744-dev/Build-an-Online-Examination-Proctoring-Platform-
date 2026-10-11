import React, { useState } from 'react';
import {
  X,
  Terminal,
  Database,
  Layers,
  Shield,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'architecture' | 'windows-setup' | 'phases' | 'schema'>('architecture');

  if (!isOpen) return null;

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ExamSecure Engineering & Architecture Guide
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  Phase 1 - 16
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Beginner-friendly step-by-step roadmap, Windows terminal commands & PostgreSQL Prisma schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50 gap-2 pt-3">
          {[
            { id: 'architecture', label: '1. Full-Stack Architecture (Hinglish)', icon: Layers },
            { id: 'windows-setup', label: '2. Windows Setup & Terminal Commands', icon: Terminal },
            { id: 'phases', label: '3. Roadmap (16 Phases Breakdown)', icon: CheckCircle2 },
            { id: 'schema', label: '4. PostgreSQL & Prisma Schema', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40">
                <h3 className="font-bold text-white text-base mb-2">
                  Namaste! ExamSecure ka Overall Architecture Samajhte Hain:
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Yeh application ek **Production-Grade Online Examination & Proctoring Platform** hai. Ismein 3 main layers hain:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-bold text-indigo-400 mb-1">Frontend (Client)</div>
                    <p className="text-slate-400">
                      React 19 + Vite + Tailwind CSS. Real-time countdown timer, autosave sync, webcam monitor preview, and Recharts analytics dashboards.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-bold text-purple-400 mb-1">Backend (Node/Express)</div>
                    <p className="text-slate-400">
                      Express.js REST APIs with JWT & bcrypt authorization. Server-authoritative time deadlines, automated evaluation algorithms, and proctoring event ingestion.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="font-bold text-emerald-400 mb-1">Database (PostgreSQL/JSON)</div>
                    <p className="text-slate-400">
                      Relational models for Users, Subjects, Questions (MCQ, T/F, Short, Descriptive), Exams, Attempts, SubmittedAnswers, ProctoringEvents & AuditLogs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-white">Folder Structure:</h4>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-indigo-300 text-[11px] overflow-x-auto">
{`examsecure/
├── prisma/
│   └── schema.prisma         # Full PostgreSQL Relational Schema
├── server/
│   ├── src/
│   │   ├── controllers/      # authController, examController, adminController
│   │   ├── db/               # In-memory & JSON file DB with instant seeds
│   │   ├── middleware/       # JWT token verification & RBAC roles
│   │   ├── routes/           # REST endpoints (/api/auth, /api/exams, etc.)
│   │   └── types/            # TypeScript interfaces
├── src/
│   ├── components/           # Navbar, WebcamProctor, Timer, Palette, Guide
│   ├── context/              # AuthContext with 1-click Demo Switcher
│   ├── pages/                # Student, Teacher, Admin, ExamTaking, Results
│   └── services/api.ts       # Typed REST API client
├── server.ts                 # Full-stack Express + Vite dev server entry point
└── package.json`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'windows-setup' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 space-y-3">
                <p>
                  Windows laptop par VS Code Terminal (PowerShell / Command Prompt) open karke yeh exact commands run kijiye:
                </p>

                {[
                  {
                    title: '1. Check Node.js and npm version',
                    cmd: 'node -v && npm -v',
                    note: 'Node.js v18 ya v20+ hona chahiye. Agar nahi hai toh nodejs.org se LTS installer download karein.',
                  },
                  {
                    title: '2. Check Git version',
                    cmd: 'git --version',
                    note: 'Git for Windows (git-scm.com) se install karein agar missing ho.',
                  },
                  {
                    title: '3. Check PostgreSQL version (Windows command prompt)',
                    cmd: 'psql --version',
                    note: 'PostgreSQL 15/16 install karein (enterprisedb.com) ya cloud database (Supabase/Neon/Render) use karein.',
                  },
                  {
                    title: '4. Start the Application locally',
                    cmd: 'npm run dev',
                    note: 'Starts both the Express API and Vite React frontend on port 3000.',
                  },
                  {
                    title: '5. Run Prisma Migrations (when connecting to PostgreSQL)',
                    cmd: 'npx prisma migrate dev --name init && npx prisma db seed',
                    note: 'Generates Prisma client and runs migrations against DATABASE_URL.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="font-semibold text-slate-200">{item.title}</div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-purple-300 text-xs">
                      <span>{item.cmd}</span>
                      <button
                        onClick={() => copyToClipboard(item.cmd)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        title="Copy command"
                      >
                        {copiedCmd === item.cmd ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-500 text-[11px]">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                16-Phase Complete Implementation Roadmap Status:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {[
                  { phase: 'Phase 1', title: 'Architecture, Prerequisites & Environment', status: 'COMPLETE' },
                  { phase: 'Phase 2', title: 'Project Structure & Dependencies', status: 'COMPLETE' },
                  { phase: 'Phase 3', title: 'PostgreSQL Schema & Prisma Models', status: 'COMPLETE' },
                  { phase: 'Phase 4', title: 'Backend Express Server & Health API', status: 'COMPLETE' },
                  { phase: 'Phase 5', title: 'JWT Authentication & Role Protection (RBAC)', status: 'COMPLETE' },
                  { phase: 'Phase 6', title: 'Question Bank (5 Question Types)', status: 'COMPLETE' },
                  { phase: 'Phase 7', title: 'Exam Builder, Timing & Rules Configuration', status: 'COMPLETE' },
                  { phase: 'Phase 8', title: 'Student Dashboard & System Pre-Checks', status: 'COMPLETE' },
                  { phase: 'Phase 9', title: 'Timed Exam Interface & Reconnection Autosave', status: 'COMPLETE' },
                  { phase: 'Phase 10', title: 'Automated Evaluation & Manual Grading', status: 'COMPLETE' },
                  { phase: 'Phase 11', title: 'Webcam Proctoring & Teacher Review', status: 'COMPLETE' },
                  { phase: 'Phase 12', title: 'Result Analytics (Recharts) & CSV Export', status: 'COMPLETE' },
                  { phase: 'Phase 13', title: 'Responsive SaaS Design & Accessibility', status: 'COMPLETE' },
                  { phase: 'Phase 14', title: 'Security Hardening & Token Sanitization', status: 'COMPLETE' },
                  { phase: 'Phase 15', title: 'Production Build & Deployment Config', status: 'COMPLETE' },
                  { phase: 'Phase 16', title: 'Interactive Demo Switcher & Demonstration', status: 'COMPLETE' },
                ].map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-indigo-400 mr-2">{p.phase}:</span>
                      <span className="text-slate-300">{p.title}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">prisma/schema.prisma</span>
                <span className="text-slate-400 text-[11px]">11 Core Models</span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px] max-h-96 overflow-y-auto">
{`model User {
  id             String         @id @default(uuid())
  name           String
  email          String         @unique
  passwordHash   String
  role           UserRole       @default(STUDENT) // ADMIN, TEACHER, STUDENT
  department     String?
  studentId      String?        @unique
  createdAt      DateTime       @default(now())
}

model Question {
  id                      String          @id @default(uuid())
  subjectId               String
  type                    QuestionType    // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, DESCRIPTIVE
  difficulty              DifficultyLevel // EASY, MEDIUM, HARD
  marks                   Float
  negativeMarks           Float           @default(0.0)
  options                 QuestionOption[]
  correctShortAnswer      String?
  sampleDescriptiveAnswer String?
}

model Exam {
  id                    String         @id @default(uuid())
  code                  String         @unique
  durationMinutes       Int
  totalMarks            Float
  passPercentage        Float
  requireCamera         Boolean        @default(true)
  requireMicrophone     Boolean        @default(true)
  preventTabSwitch      Boolean        @default(true)
  preventFullscreenExit Boolean        @default(true)
}

model ExamAttempt {
  id                    String            @id @default(uuid())
  examId                String
  studentId             String
  status                AttemptStatus     // IN_PROGRESS, SUBMITTED, EVALUATED
  startedAt             DateTime
  deadlineAt            DateTime
  submittedAt           DateTime?
  totalScore            Float?
  percentage            Float?
  isPassed              Boolean?
  proctoringEventsCount Int               @default(0)
}

model ProctoringEvent {
  id             String              @id @default(uuid())
  attemptId      String
  studentId      String
  eventType      ProctoringEventType // FULLSCREEN_EXIT, TAB_SWITCH, CAMERA_TRACK_LOST
  severity       EventSeverity       // LOW, MEDIUM, HIGH, CRITICAL
  timestamp      DateTime            @default(now())
  reviewed       Boolean             @default(false)
  reviewDecision ReviewDecision?     // CLEARED, FLAGGED, DISMISSED
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            ExamSecure v2.0 &bull; Built with React 19, Node.js & PostgreSQL/Prisma
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
