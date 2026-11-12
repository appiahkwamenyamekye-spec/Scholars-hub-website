import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  CheckCircle,
  FileText,
  GraduationCap,
  Heart,
  LogOut,
  PlusCircle,
  Search,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { NotificationItem } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { firebaseUser, dbUser, signInWithGoogle, signOutUser, token, isAdmin, isSigningIn, authError, clearAuthError } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (token) {
      api.getNotifications(token)
        .then((data) => {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    }
  }, [token]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await api.markAllNotificationsRead(token);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm transition-all">
      {authError && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <span className="font-medium">{authError}</span>
          <button
            onClick={clearAuthError}
            className="p-1 text-amber-400 hover:text-white rounded"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-teal-400 p-0.5 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Scholar<span className="text-amber-400">Hub</span>
              </span>
              <span className="hidden md:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                Open Repository
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Discover. Share. Learn. Grow.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              currentTab === 'home'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('explore')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              currentTab === 'explore'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Explore Works
          </button>
          <button
            onClick={() => onNavigate('categories')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              currentTab === 'categories'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Disciplines
          </button>
          <button
            onClick={() => onNavigate('explore', 'sort=popular')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              currentTab === 'popular'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Popular Uploads
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              currentTab === 'about'
                ? 'bg-slate-800 text-amber-400 font-semibold'
                : 'hover:text-white hover:bg-slate-800/60'
            }`}
          >
            About
          </button>
        </nav>

        {/* Right Actions: Upload, Notifications, User */}
        <div className="flex items-center space-x-3">
          {/* Quick Search trigger */}
          <button
            onClick={() => onNavigate('explore')}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Search Academic Repository"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Upload Work Button */}
          <button
            onClick={() => {
              if (!firebaseUser) {
                signInWithGoogle();
              } else {
                onNavigate('upload');
              }
            }}
            className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-semibold rounded-lg shadow-sm transition-all transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Work</span>
          </button>

          {/* Notifications Dropdown */}
          {firebaseUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="font-semibold text-sm text-slate-200 flex items-center space-x-1.5">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors hover:bg-slate-800/70 ${
                            !n.isRead ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-semibold text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Account / Sign In */}
          {firebaseUser ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <img
                  src={
                    dbUser?.avatarUrl ||
                    firebaseUser.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      dbUser?.displayName || firebaseUser.email || 'User'
                    )}`
                  }
                  alt="Avatar"
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-700"
                />
                <span className="hidden md:inline-block text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {dbUser?.displayName || firebaseUser.displayName || 'Academic'}
                </span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-2.5 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">
                      {dbUser?.displayName || firebaseUser.displayName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{firebaseUser.email}</p>
                    {isAdmin && (
                      <span className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Platform Administrator
                      </span>
                    )}
                  </div>

                  <div className="py-1 text-xs text-slate-300">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 hover:text-white flex items-center space-x-2"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Author Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('dashboard', 'tab=uploads');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 hover:text-white flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>My Uploads</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('dashboard', 'tab=likes');
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-800 hover:text-white flex items-center space-x-2"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      <span>Liked & Bookmarks</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-amber-400 font-medium flex items-center space-x-2 border-t border-slate-800/80"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span>Admin Control Center</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>
                    <button
                      onClick={async () => {
                        setShowProfileMenu(false);
                        await signOutUser();
                        onNavigate('home');
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              disabled={isSigningIn}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-800 bg-slate-900 space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-slate-200 font-medium"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('explore');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-slate-200 font-medium"
          >
            Explore Works
          </button>
          <button
            onClick={() => {
              onNavigate('categories');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-slate-200 font-medium"
          >
            Disciplines
          </button>
          <button
            onClick={() => {
              onNavigate('explore', 'sort=popular');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-slate-200 font-medium"
          >
            Popular Uploads
          </button>
          <button
            onClick={() => {
              onNavigate('about');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 text-slate-200 font-medium"
          >
            About ScholarHub
          </button>
          <button
            onClick={() => {
              if (!firebaseUser) signInWithGoogle();
              else onNavigate('upload');
              setMobileMenuOpen(false);
            }}
            className="w-full mt-2 py-2.5 bg-amber-500 text-slate-950 font-semibold rounded-lg text-center"
          >
            Upload Academic Work
          </button>
        </div>
      )}
    </header>
  );
};
