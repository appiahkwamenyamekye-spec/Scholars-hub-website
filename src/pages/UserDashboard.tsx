import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bookmark,
  Building2,
  Clock,
  Download,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  PlusCircle,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, Institution, NotificationItem } from '../types/index.ts';

interface UserDashboardProps {
  initialTab?: string;
  onNavigate: (tab: string, param?: string) => void;
  onSelectWork: (work: AcademicWork) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  initialTab = 'overview',
  onNavigate,
  onSelectWork,
}) => {
  const { firebaseUser, dbUser, token, refreshDbUser, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Author metrics & uploads
  const [metrics, setMetrics] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalLikes: 0,
    totalComments: 0,
    totalWorks: 0,
  });
  const [userWorks, setUserWorks] = useState<AcademicWork[]>([]);
  const [worksFilter, setWorksFilter] = useState('');
  const [likes, setLikes] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Profile form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    if (token) {
      api.getUserProfile(token)
        .then((data) => {
          if (data.metrics) setMetrics(data.metrics);
          if (data.user) {
            setDisplayName(data.user.displayName || '');
            setUsername(data.user.username || '');
            setBio(data.user.bio || '');
            setInstitutionId(data.user.institutionId ? String(data.user.institutionId) : '');
          }
        })
        .catch(() => {});

      api.getUserWorks(undefined, token).then(setUserWorks).catch(() => {});
      api.getUserLikes(token).then(setLikes).catch(() => {});
      api.getUserBookmarks(token).then(setBookmarks).catch(() => {});
      api.getUserDownloads(token).then(setDownloads).catch(() => {});
      api.getNotifications(token).then((d) => setNotifications(d.notifications || [])).catch(() => {});
      api.getInstitutions().then(setInstitutions).catch(() => {});
    }
  }, [token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingProfile(true);
    setProfileMessage('');
    try {
      await api.updateUserProfile(
        {
          displayName,
          username,
          bio,
          institutionId: institutionId ? parseInt(institutionId) : null,
        },
        token
      );
      await refreshDbUser();
      setProfileMessage('Profile settings updated successfully!');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-slate-400">Please sign in to view your personalized dashboard and uploads.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-6 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const filteredWorks = worksFilter
    ? userWorks.filter((w) => w.status === worksFilter)
    : userWorks;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Author Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={
              dbUser?.avatarUrl ||
              firebaseUser.photoURL ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(dbUser?.displayName || 'Author')}`
            }
            alt="Avatar"
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500/30"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-2xl font-bold text-white">
                {dbUser?.displayName || firebaseUser.displayName}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                {dbUser?.role === 'admin' ? 'Platform Administrator' : 'Verified Author'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{firebaseUser.email}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New Work</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview Analytics', icon: Sparkles },
          { id: 'uploads', label: `My Uploads (${userWorks.length})`, icon: FileText },
          { id: 'likes', label: `Liked Papers (${likes.length})`, icon: Heart },
          { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})`, icon: Bookmark },
          { id: 'downloads', label: `Download History (${downloads.length})`, icon: Download },
          { id: 'settings', label: 'Profile Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* TAB 1: OVERVIEW ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Total Reads & Views
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                {metrics.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-teal-400 uppercase tracking-wider font-semibold">
                Document Downloads
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                {metrics.totalDownloads.toLocaleString()}
              </p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider font-semibold">
                Citations & Likes
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                {metrics.totalLikes.toLocaleString()}
              </p>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">
                Published Works
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                {metrics.totalWorks.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Recent Uploads Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-white">Recent Publications</h3>
            {userWorks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">You have not published any academic works yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {userWorks.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    onClick={() => onSelectWork(w)}
                    className="py-3 flex items-center justify-between hover:bg-slate-850 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{w.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {w.categoryName} • Status: <span className="capitalize text-amber-400">{w.status}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span>{w.downloadsCount} downloads</span>
                      <span>{w.likesCount} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY UPLOADS */}
      {activeTab === 'uploads' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Filter by Status:</span>
              {(['', 'approved', 'pending', 'draft', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setWorksFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    worksFilter === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {st || 'All'}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg"
            >
              + Upload Work
            </button>
          </div>

          <div className="space-y-3">
            {filteredWorks.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
                No works found matching this status filter.
              </div>
            ) : (
              filteredWorks.map((work) => (
                <div
                  key={work.id}
                  onClick={() => onSelectWork(work)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-serif text-sm font-bold text-white hover:text-amber-400 transition-colors">
                        {work.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          work.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : work.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : work.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {work.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{work.shortDescription}</p>
                    {work.rejectionReason && (
                      <p className="text-[11px] text-rose-400 font-medium pt-1">
                        Reviewer feedback: {work.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-400 shrink-0">
                    <span className="flex items-center space-x-1">
                      <Download className="w-3.5 h-3.5 text-teal-400" />
                      <span>{work.downloadsCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{work.likesCount}</span>
                    </span>
                    <span className="text-amber-400 font-semibold text-xs">&rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY LIKES */}
      {activeTab === 'likes' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Liked Academic Works</h3>
          {likes.length === 0 ? (
            <p className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              You have not liked any academic works yet.
            </p>
          ) : (
            <div className="space-y-2">
              {likes.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectWork(item)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-white hover:text-amber-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.authorName} • {item.categoryName}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>{item.downloadsCount} downloads</span>
                    <span className="text-amber-400">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Saved & Bookmarked Papers</h3>
          {bookmarks.length === 0 ? (
            <p className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No bookmarked papers saved.
            </p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectWork(item)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-white hover:text-amber-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.authorName} • {item.categoryName}</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>{item.downloadsCount} downloads</span>
                    <span className="text-amber-400">&rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DOWNLOAD HISTORY */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-white">Your Academic Download History</h3>
          {downloads.length === 0 ? (
            <p className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No download records yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800 bg-slate-900 border border-slate-800 rounded-xl">
              {downloads.map((d) => (
                <div key={d.downloadId} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white">{d.title}</h4>
                    <p className="text-[11px] text-slate-400">{d.authorName} • {d.fileType}</p>
                  </div>
                  <span className="text-slate-400">{new Date(d.downloadedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl">
          <h3 className="font-serif text-lg font-bold text-white">Academic Author Profile Settings</h3>

          {profileMessage && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs">
              {profileMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username (Repository Handle)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Biography & Research Focus
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Mention your department, research interests, doctoral focus..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary University / Research Affiliation
              </label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">Independent Researcher / Unaffiliated</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      )}
    </div>
  );
};
