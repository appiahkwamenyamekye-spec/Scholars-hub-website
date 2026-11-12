import React, { useState } from 'react';
import {
  Bookmark,
  Building2,
  Calendar,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Heart,
  MessageSquare,
  Presentation,
  Share2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork } from '../types/index.ts';

interface WorkCardProps {
  work: AcademicWork;
  onSelect: (work: AcademicWork) => void;
  onDownload?: (work: AcademicWork) => void;
}

export const WorkCard: React.FC<WorkCardProps> = ({ work, onSelect, onDownload }) => {
  const { firebaseUser, token, signInWithGoogle } = useAuth();
  const [isLiked, setIsLiked] = useState(work.isLiked || false);
  const [likesCount, setLikesCount] = useState(work.likesCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(work.isBookmarked || false);
  const [copied, setCopied] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser || !token) {
      signInWithGoogle();
      return;
    }

    // Optimistic toggle
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await api.toggleLike(work.id, token);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      // Revert on error
      setIsLiked(!nextState);
      setLikesCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseUser || !token) {
      signInWithGoogle();
      return;
    }

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      const res = await api.toggleBookmark(work.id, token);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(!nextState);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#work-${work.slug || work.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFileIcon = (fileType: string) => {
    const t = (fileType || '').toUpperCase();
    if (t === 'PDF') return <FileText className="w-3.5 h-3.5 text-rose-400" />;
    if (t.includes('DOC')) return <FileText className="w-3.5 h-3.5 text-sky-400" />;
    if (t.includes('PPT')) return <Presentation className="w-3.5 h-3.5 text-amber-400" />;
    if (t.includes('XLS')) return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />;
    return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '1.8 MB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div
      onClick={() => onSelect(work)}
      className="group relative bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-950/40 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Cover / Preview Header */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
        {work.thumbnailUrl ? (
          <img
            src={work.thumbnailUrl}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-end p-4">
            <span className="font-serif text-lg text-slate-300 line-clamp-2">{work.title}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-md text-[11px] font-semibold text-slate-200">
              {renderFileIcon(work.fileType)}
              <span>{work.fileType || 'PDF'}</span>
            </span>
            <span className="px-2 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 rounded-md text-[10px] font-medium">
              {work.academicLevel || 'Postgraduate'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleBookmark}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark this research'}
              className={`p-1.5 rounded-md backdrop-blur-md border transition-all ${
                isBookmarked
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950/70 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
            </button>
            <button
              onClick={handleShare}
              title="Copy share link"
              className="p-1.5 rounded-md backdrop-blur-md bg-slate-950/70 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Pill at bottom of preview */}
        <div className="absolute bottom-2.5 left-3">
          <span className="text-[11px] font-medium text-amber-400 bg-slate-950/90 border border-amber-500/30 px-2 py-0.5 rounded">
            {work.categoryName || 'Academic Discipline'}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            {work.title}
          </h3>

          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {work.shortDescription}
          </p>

          {/* Author & Institution Info */}
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2 truncate">
              {work.authorAvatar ? (
                <img
                  src={work.authorAvatar}
                  alt={work.authorName}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-bold shrink-0">
                  {work.authorName?.[0] || 'A'}
                </div>
              )}
              <span className="truncate font-medium text-slate-200">
                {work.authorName || 'Research Contributor'}
              </span>
            </div>

            {work.publicationYear && (
              <span className="text-[11px] text-slate-400 shrink-0 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{work.publicationYear}</span>
              </span>
            )}
          </div>

          {work.institutionName && (
            <div className="mt-1 flex items-center space-x-1 text-[11px] text-slate-400 truncate">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{work.institutionName}</span>
            </div>
          )}
        </div>

        {/* Footer Metrics & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-rose-400 font-semibold' : 'hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-400' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <span className="flex items-center space-x-1 text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{work.commentsCount || 0}</span>
            </span>

            <span className="flex items-center space-x-1 text-slate-400" title="Total downloads">
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>{work.downloadsCount || 0}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              {formatFileSize(work.fileSizeBytes)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDownload) onDownload(work);
                else onSelect(work);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded transition-colors flex items-center space-x-1"
            >
              <span>View</span>
            </button>
          </div>
        </div>
      </div>

      {copied && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in">
          Link Copied!
        </div>
      )}
    </div>
  );
};
