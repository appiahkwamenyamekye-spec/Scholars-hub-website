import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Ban,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  FolderPlus,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, AdminMetrics, Category } from '../types/index.ts';

export const AdminDashboard: React.FC = () => {
  const { token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'users' | 'categories' | 'reports' | 'settings' | 'logs'>('moderation');

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    siteName: 'ScholarHub',
    tagline: 'Discover. Share. Learn. Grow.',
    requireApproval: false,
    allowGuestDownloads: true,
    contactEmail: 'support@scholarhub.edu',
  });

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [actionMessage, setActionMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [m, s, u, c, r, sett, logs] = await Promise.all([
        api.getAdminMetrics(token).catch(() => null),
        api.getAdminSubmissions(token).catch(() => []),
        api.getAdminUsers(token).catch(() => []),
        api.getCategories().catch(() => []),
        api.getAdminReports(token).catch(() => []),
        api.getAdminSettings(token).catch(() => null),
        api.getAdminLogs(token).catch(() => []),
      ]);
      if (m) setMetrics(m);
      setSubmissions(s || []);
      setUsersList(u || []);
      setCategoriesList(c || []);
      setReportsList(r || []);
      if (sett) setSettings(sett);
      setAdminLogs(logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [token]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleApprove = async (id: number) => {
    if (!token) return;
    try {
      await api.approveSubmission(id, token);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      showToast('Publication approved and released to the open repository!');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectingId) return;
    try {
      await api.rejectSubmission(rejectingId, rejectionReason, token);
      setSubmissions((prev) => prev.filter((s) => s.id !== rejectingId));
      setRejectingId(null);
      setRejectionReason('');
      showToast('Publication rejected with editorial feedback.');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const handleToggleBan = async (userId: number, currentBan: boolean) => {
    if (!token) return;
    try {
      await api.toggleBanUser(userId, !currentBan, token);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBanned: !currentBan } : u))
      );
      showToast(!currentBan ? 'User account suspended.' : 'User account reactivated.');
    } catch (err: any) {
      alert(err.message || 'Ban toggle failed');
    }
  };

  const handleToggleRole = async (userId: number, currentRole: 'admin' | 'user') => {
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(userId, newRole, token);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}.`);
    } catch (err: any) {
      alert(err.message || 'Role update failed');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCatName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        }),
      });
      if (res.ok) {
        const cat = await res.json();
        setCategoriesList((prev) => [...prev, cat]);
        setNewCatName('');
        setNewCatDesc('');
        showToast('New academic discipline category created.');
      }
    } catch (err: any) {
      alert(err.message || 'Category creation failed');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await api.updateAdminSettings(settings, token);
      showToast('Platform settings saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleResolveReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    if (!token) return;
    try {
      await api.resolveReport(reportId, status, token);
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      showToast(`Report marked as ${status}.`);
    } catch (err: any) {
      alert(err.message || 'Report update failed');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-slate-400">
          This section is restricted to ScholarHub platform administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Toast Message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Governance & Editorial Board
          </span>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Administrator Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage submissions, review moderation queues, govern users, and configure platform parameters.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Users</span>
          <p className="font-serif text-xl font-bold text-white mt-1">{metrics?.totalUsers ?? '-'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Works</span>
          <p className="font-serif text-xl font-bold text-white mt-1">{metrics?.totalWorks ?? '-'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl bg-amber-500/5">
          <span className="text-[10px] text-amber-400 uppercase font-semibold">Pending Review</span>
          <p className="font-serif text-xl font-bold text-amber-400 mt-1">{metrics?.pendingWorks ?? '0'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">Approved</span>
          <p className="font-serif text-xl font-bold text-emerald-400 mt-1">{metrics?.approvedWorks ?? '-'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-teal-400 uppercase font-semibold">Downloads</span>
          <p className="font-serif text-xl font-bold text-teal-400 mt-1">{metrics?.totalDownloads ?? '-'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Discussions</span>
          <p className="font-serif text-xl font-bold text-white mt-1">{metrics?.totalComments ?? '-'}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-xl bg-rose-500/5">
          <span className="text-[10px] text-rose-400 uppercase font-semibold">Open Reports</span>
          <p className="font-serif text-xl font-bold text-rose-400 mt-1">{metrics?.pendingReports ?? '0'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'moderation', label: `Moderation Queue (${submissions.length})`, icon: Clock },
          { id: 'users', label: `User Management (${usersList.length})`, icon: Users },
          { id: 'categories', label: `Disciplines (${categoriesList.length})`, icon: Layers },
          { id: 'reports', label: `Integrity Reports (${reportsList.length})`, icon: AlertTriangle },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
          { id: 'logs', label: 'Audit Trail', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-lg transition-colors flex items-center space-x-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-white">
              Pending Submissions Awaiting Approval
            </h3>
            <span className="text-xs text-slate-400">
              {settings.requireApproval
                ? 'Strict Moderation: All new uploads require approval'
                : 'Open Access Mode: Auto-approval is active'}
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-serif text-lg font-bold text-white">Moderation Queue is Clear</p>
              <p className="text-xs text-slate-400">All submitted academic publications have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {sub.categoryName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {sub.academicLevel}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Uploaded {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-serif text-base sm:text-lg font-bold text-white">{sub.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{sub.shortDescription}</p>

                    <div className="pt-1 flex items-center space-x-4 text-xs text-slate-300">
                      <span>Author: <strong className="text-white">{sub.authorName}</strong> ({sub.authorEmail})</span>
                      <span>Format: <strong className="text-amber-400">{sub.fileType}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApprove(sub.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => setRejectingId(sub.id)}
                      className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Registered Users & Permissions</h3>
          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Publications</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{u.displayName || u.username}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">{u.worksCount || 0}</td>
                    <td className="p-4">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-semibold">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`px-2.5 py-1 rounded text-[11px] ${
                          u.isBanned
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-rose-600/80 text-white hover:bg-rose-600'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif text-lg font-bold text-white">Active Academic Disciplines</h3>
            <div className="space-y-2">
              {categoriesList.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-serif text-sm font-bold text-white">{cat.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">{cat.worksCount || 0} works</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 h-fit">
            <h3 className="font-serif text-base font-bold text-white flex items-center space-x-2">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Add New Discipline</span>
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discipline Name</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g., Quantum Computing & Physics"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Scope of studies..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Create Category
            </button>
          </form>
        </div>
      )}

      {/* 4. INTEGRITY REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Content & Academic Integrity Reports</h3>
          {reportsList.length === 0 ? (
            <p className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No reports filed.
            </p>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 text-xs">{rep.reason}</span>
                    <span className="text-[10px] text-slate-400">{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-200">{rep.details}</p>
                  {rep.workTitle && (
                    <p className="text-[11px] text-amber-300 font-medium">Target Work: "{rep.workTitle}"</p>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Reported by: {rep.reporterName}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded hover:bg-slate-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <h3 className="font-serif text-lg font-bold text-white">Configurable Platform Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Platform Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                  className="rounded text-amber-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">
                  Require Editorial Approval for all new uploads (Strict Moderation)
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowGuestDownloads}
                  onChange={(e) => setSettings({ ...settings, allowGuestDownloads: e.target.checked })}
                  className="rounded text-amber-500 bg-slate-950 border-slate-700"
                />
                <span className="text-xs text-slate-200 font-medium">
                  Allow Guest Visitors to Download Public Materials (No forced registration)
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Save Platform Settings
          </button>
        </form>
      )}

      {/* 6. AUDIT TRAIL */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Administrator Audit Trail</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
            {adminLogs.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No actions logged yet.</p>
            ) : (
              adminLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{log.adminName || 'Admin'}</span>
                    <span className="text-slate-400 ml-2">performed <strong className="text-amber-400">{log.action}</strong> on {log.targetType}</span>
                    {log.notes && <p className="text-[11px] text-slate-400 mt-0.5">{log.notes}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleRejectSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-white">Provide Rejection Feedback</h3>
            <p className="text-xs text-slate-400">
              Explain why this submission does not meet publication standards so the author can revise.
            </p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Incomplete abstract, missing empirical benchmarks, or formatting issues..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
