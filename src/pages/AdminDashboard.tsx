import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { User, UserRole, AuditLog } from '../types/index.ts';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  RotateCcw,
  Activity,
  KeyRound,
  Mail,
  Building,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as UserRole,
    department: 'Computer Science',
    studentId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, aRes] = await Promise.all([
        api.getUsers(),
        api.getAnalyticsOverview(),
      ]);
      setUsers(uRes.users || []);
      setAnalytics(aRes.stats || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        department: 'Computer Science',
        studentId: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove user "${name}"?`)) return;
    try {
      await api.deleteUser(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to restore the initial demo seeds? This will refresh all users, questions, and exams.')) return;
    try {
      await api.resetDatabase();
      alert('Database restored to clean default demo seeds.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset database');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            ADMINISTRATOR PRIVILEGES ACTIVE
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Platform Administration & Users</h1>
          <p className="text-xs text-slate-400">
            System audit trail, role-based user management & global platform settings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDatabase}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Database</span>
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Global Counters */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Registered Students</div>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">{analytics.totalStudents}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Faculty Teachers</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{analytics.totalTeachers}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Active Exams</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.totalExams}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Question Bank</div>
            <div className="text-2xl font-extrabold text-white mt-1">{analytics.totalQuestions} Questions</div>
          </div>
        </div>
      )}

      {/* Users List Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Platform Users & Access Roles</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{users.length} Total Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-6 py-3">Name & Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Department / ID</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : u.role === 'TEACHER'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <div>{u.department || 'N/A'}</div>
                    {u.studentId && (
                      <div className="text-[10px] font-mono text-slate-500">ID: {u.studentId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== 'usr-admin-1' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add New User</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Email Address:</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. alex@examsecure.io"
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Initial Password:</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">System Role:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Department:</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 mt-2"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
