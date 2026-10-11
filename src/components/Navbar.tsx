import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sparkles,
  BookOpen,
  HelpCircle,
  Video,
  FileCheck2,
  Users,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenGuide }) => {
  const { user, logout, demoSwitch, isLoading } = useAuth();

  const handleRoleChange = async (role: UserRole) => {
    if (user?.role === role) return;
    await demoSwitch(role);
    if (role === 'STUDENT') setCurrentTab('student-dashboard');
    else if (role === 'TEACHER') setCurrentTab('teacher-dashboard');
    else setCurrentTab('admin-dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Demo Helper Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-4 py-1.5 border-b border-indigo-900/40 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">Interactive Demo Mode:</span>
          <span className="hidden sm:inline text-slate-400">Switch perspectives instantly to test all roles</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px] mr-1 hidden md:inline">Simulate Role:</span>
          {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => {
            const isActive = user?.role === r;
            return (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                disabled={isLoading}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {r === 'STUDENT' ? 'Student View' : r === 'TEACHER' ? 'Teacher View' : 'Admin View'}
              </button>
            );
          })}
          <button
            onClick={onOpenGuide}
            className="ml-2 px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[11px] font-medium flex items-center gap-1 border border-purple-700/50"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Architecture & Windows Guide</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (user?.role === 'STUDENT') setCurrentTab('student-dashboard');
              else if (user?.role === 'TEACHER') setCurrentTab('teacher-dashboard');
              else setCurrentTab('admin-dashboard');
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ExamSecure
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Proctor v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">
                Secure Online Examination Platform
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Nav Links depending on Role */}
        <nav className="hidden md:flex items-center gap-1">
          {user?.role === 'STUDENT' && (
            <>
              <button
                onClick={() => setCurrentTab('student-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'student-dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                My Exams
              </button>
              <button
                onClick={() => setCurrentTab('student-results')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'student-results'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Performance & Results
              </button>
            </>
          )}

          {user?.role === 'TEACHER' && (
            <>
              <button
                onClick={() => setCurrentTab('teacher-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Exams Overview
              </button>
              <button
                onClick={() => setCurrentTab('teacher-questions')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-questions'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Question Bank
              </button>
              <button
                onClick={() => setCurrentTab('teacher-grading')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-grading'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Manual Grading
              </button>
              <button
                onClick={() => setCurrentTab('teacher-live-proctor')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  currentTab === 'teacher-live-proctor'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Proctoring Room
              </button>
              <button
                onClick={() => setCurrentTab('teacher-analytics')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-analytics'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Analytics & CSV
              </button>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <button
                onClick={() => setCurrentTab('admin-dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'admin-dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Admin Control
              </button>
              <button
                onClick={() => setCurrentTab('admin-users')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'admin-users'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Users & Roles
              </button>
              <button
                onClick={() => setCurrentTab('teacher-questions')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-questions'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Question Bank
              </button>
              <button
                onClick={() => setCurrentTab('teacher-analytics')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'teacher-analytics'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                System Analytics
              </button>
            </>
          )}
        </nav>

        {/* User Badge & Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-white leading-tight flex items-center justify-end gap-1.5">
                  {user.name}
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      user.role === 'ADMIN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : user.role === 'TEACHER'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {user.department || user.studentId || user.email}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleRoleChange('STUDENT')}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
