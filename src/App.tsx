import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { GuideModal } from './components/GuideModal.tsx';
import { StudentDashboard } from './pages/StudentDashboard.tsx';
import { ExamTakingPage } from './pages/ExamTakingPage.tsx';
import { ExamResultPage } from './pages/ExamResultPage.tsx';
import { TeacherDashboard } from './pages/TeacherDashboard.tsx';
import { LiveProctoringPage } from './pages/LiveProctoringPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);
  const [activeResultAttemptId, setActiveResultAttemptId] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // If candidate is actively taking an exam, render dedicated exam workspace without distracting navbar
  if (activeExamId) {
    return (
      <ExamTakingPage
        examId={activeExamId}
        mediaStream={activeMediaStream}
        onFinishExam={(attemptId) => {
          setActiveExamId(null);
          setActiveResultAttemptId(attemptId);
        }}
        onExit={() => {
          setActiveExamId(null);
        }}
      />
    );
  }

  // If candidate is viewing detailed result breakdown
  if (activeResultAttemptId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenGuide={() => setShowGuideModal(true)}
        />
        <main className="flex-1">
          <ExamResultPage
            attemptId={activeResultAttemptId}
            onBack={() => setActiveResultAttemptId(null)}
          />
        </main>
        <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      <main className="flex-1">
        {/* STUDENT VIEWS */}
        {(currentTab === 'student-dashboard' || currentTab === 'student-results') && (
          <StudentDashboard
            onStartExam={(examId, stream) => {
              setActiveExamId(examId);
              setActiveMediaStream(stream);
            }}
            onViewResult={(attemptId) => {
              setActiveResultAttemptId(attemptId);
            }}
          />
        )}

        {/* TEACHER VIEWS */}
        {currentTab === 'teacher-dashboard' && (
          <TeacherDashboard initialSubTab="exams" />
        )}
        {currentTab === 'teacher-questions' && (
          <TeacherDashboard initialSubTab="questions" />
        )}
        {currentTab === 'teacher-grading' && (
          <TeacherDashboard initialSubTab="grading" />
        )}
        {currentTab === 'teacher-analytics' && (
          <TeacherDashboard initialSubTab="analytics" />
        )}
        {currentTab === 'teacher-live-proctor' && (
          <LiveProctoringPage />
        )}

        {/* ADMIN VIEWS */}
        {(currentTab === 'admin-dashboard' || currentTab === 'admin-users') && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">ExamSecure Platform</span>
            <span>&bull;</span>
            <span>Secure WebRTC & MediaDevices Proctoring</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuideModal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Phase 1-16 Architecture Roadmap
            </button>
            <span>&bull;</span>
            <span className="font-mono text-slate-400">PostgreSQL + Prisma Compatible</span>
          </div>
        </div>
      </footer>

      {/* Beginner & Architecture Roadmap Modal */}
      <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
