import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  Building2,
  Calendar,
  Check,
  CornerDownRight,
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  FileText,
  Heart,
  MessageSquare,
  Presentation,
  Quote,
  Reply,
  Share2,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { CitationModal } from '../components/CitationModal.tsx';
import { ReportModal } from '../components/ReportModal.tsx';
import { WorkCard } from '../components/WorkCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, WorkComment } from '../types/index.ts';

interface WorkDetailsPageProps {
  identifier: string | number;
  onBack: () => void;
  onSelectWork: (work: AcademicWork) => void;
}

export const WorkDetailsPage: React.FC<WorkDetailsPageProps> = ({
  identifier,
  onBack,
  onSelectWork,
}) => {
  const { firebaseUser, dbUser, token, signInWithGoogle, isAdmin } = useAuth();
  const [work, setWork] = useState<AcademicWork | null>(null);
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [relatedWorks, setRelatedWorks] = useState<AcademicWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Modals
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<number | undefined>();

  // Comment inputs
  const [commentText, setCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWorkDetails(identifier, token);
      setWork(data.work);
      setComments(data.comments || []);
      setRelatedWorks(data.relatedWorks || []);
      setIsLiked(data.work.isLiked || false);
      setLikesCount(data.work.likesCount || 0);
      setIsBookmarked(data.work.isBookmarked || false);
    } catch (err: any) {
      setError(err.message || 'Academic publication could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [identifier, token]);

  const handleLike = async () => {
    if (!firebaseUser || !token || !work) {
      signInWithGoogle();
      return;
    }
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    try {
      const res = await api.toggleLike(work.id, token);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      setIsLiked(!next);
      setLikesCount((prev) => (next ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleBookmark = async () => {
    if (!firebaseUser || !token || !work) {
      signInWithGoogle();
      return;
    }
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      const res = await api.toggleBookmark(work.id, token);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(!next);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!work) return;
    if (work.downloadPermission === 'registered_only' && !firebaseUser) {
      signInWithGoogle();
      return;
    }

    setDownloading(true);
    try {
      // Trigger download endpoint
      const downloadUrl = `/api/works/${work.id}/download`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', work.fileName || 'academic-paper.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment local download count
      setWork((prev) => prev ? { ...prev, downloadsCount: prev.downloadsCount + 1 } : null);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !token || !work) {
      signInWithGoogle();
      return;
    }
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const newComment = await api.postComment(work.id, commentText, token);
      setComments((prev) => [newComment, ...prev]);
      setCommentText('');
      setWork((prev) => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!firebaseUser || !token) {
      signInWithGoogle();
      return;
    }
    if (!replyText.trim()) return;

    try {
      const newReply = await api.postCommentReply(commentId, replyText, token);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply],
            };
          }
          return c;
        })
      );
      setReplyingToId(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to post reply');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    if (!confirm('Are you sure you wish to delete this comment?')) return;
    try {
      await api.deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setWork((prev) => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '2.4 MB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400">Loading academic publication...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-white">Publication Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'This academic work does not exist or has been removed.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-700"
        >
          Return to Explore
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repository</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Publication Content (Col span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-md">
                {work.categoryName || 'Academic Discipline'}
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-md">
                {work.academicLevel || 'Postgraduate'}
              </span>
              {work.courseOrSubject && (
                <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 text-xs rounded-md">
                  {work.courseOrSubject}
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {work.title}
            </h1>

            {/* Author & Publication Metadata */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    work.authorAvatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(work.authorName || 'Author')}`
                  }
                  alt={work.authorName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                />
                <div>
                  <p className="font-semibold text-white text-sm">{work.authorName || 'Academic Contributor'}</p>
                  {work.contributorNames && (
                    <p className="text-[11px] text-slate-400">Co-authors: {work.contributorNames}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1 sm:text-right">
                {work.institutionName && (
                  <p className="flex sm:justify-end items-center space-x-1.5 text-slate-300 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{work.institutionName}</span>
                  </p>
                )}
                <p className="text-slate-400 text-[11px]">
                  Published: {work.publicationYear || new Date().getFullYear()} • License: {work.licenseType}
                </p>
              </div>
            </div>

            {/* Interactive Action Toolbar */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    isLiked
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-400' : ''}`} />
                  <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    isBookmarked
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Bookmark publication'}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => setShowCitationModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Quote className="w-4 h-4 text-amber-400" />
                  <span>Cite</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setReportingCommentId(undefined);
                  setShowReportModal(true);
                }}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report / Copyright Notice</span>
              </button>
            </div>
          </div>

          {/* Abstract & Full Content Viewer */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
            <div>
              <h2 className="font-serif text-xl font-bold text-white mb-2">Abstract & Research Overview</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {work.fullDescription || work.shortDescription}
              </p>
            </div>

            {/* Document Details Strip */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Format</p>
                <p className="font-semibold text-xs text-white mt-0.5">{work.fileType || 'PDF'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">File Size</p>
                <p className="font-semibold text-xs text-white mt-0.5">{formatFileSize(work.fileSizeBytes)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Reads / Views</p>
                <p className="font-semibold text-xs text-white mt-0.5">{work.viewsCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Downloads</p>
                <p className="font-semibold text-xs text-teal-400 mt-0.5">{work.downloadsCount}</p>
              </div>
            </div>
          </div>

          {/* Interactive Comments & Scholarly Discussion */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-serif text-xl font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Academic Peer Discussion</span>
                <span className="text-xs font-normal text-slate-400">({comments.length})</span>
              </h3>
            </div>

            {/* Add Comment Form */}
            {firebaseUser ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Contribute constructive scholarly feedback or ask the author a question..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentSubmitting || !commentText.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
                  >
                    {commentSubmitting ? 'Posting...' : 'Post Scholarly Comment'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
                <p className="text-xs text-slate-300">Sign in to participate in the academic peer discussion.</p>
                <button
                  onClick={() => signInWithGoogle()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-lg"
                >
                  Sign In to Comment
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4 pt-4 divide-y divide-slate-800/80">
              {comments.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  No comments yet. Be the first to start the scholarly discussion!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={
                            comment.userAvatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.userName)}`
                          }
                          alt={comment.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-200">{comment.userName}</span>
                            {comment.userRole === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 font-bold">
                                Editorial Board
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs">
                        <button
                          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                          className="text-xs text-slate-400 hover:text-amber-400 flex items-center space-x-1"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>

                        {(dbUser?.id === comment.userId || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-slate-400 hover:text-rose-400"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pl-9 leading-relaxed">{comment.content}</p>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="pl-9 space-y-3 pt-2">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center space-x-2">
                              <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-xs text-slate-200">{reply.userName}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 pl-5 leading-relaxed">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input Box */}
                    {replyingToId === comment.id && (
                      <div className="pl-9 pt-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => handleAddReply(comment.id)}
                            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Download & Author Card (Col span 1) */}
        <div className="space-y-6">
          {/* Prominent Download Card */}
          <div className="p-6 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl space-y-5">
            <h3 className="font-serif text-lg font-bold text-white">Download Academic Material</h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>File Name:</span>
                <span className="text-slate-200 truncate max-w-[150px]">{work.fileName || 'paper.pdf'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>File Size:</span>
                <span className="text-slate-200">{formatFileSize(work.fileSizeBytes)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Access Permission:</span>
                <span className="text-amber-400 font-medium capitalize">{work.downloadPermission.replace('_', ' ')}</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Preparing Document...' : 'Download Full Document'}</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Safe download verified by ScholarHub repository. Protected under CC-BY open academic licensing.
            </p>
          </div>

          {/* Author Profile Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={
                  work.authorAvatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(work.authorName || 'Author')}`
                }
                alt={work.authorName}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700"
              />
              <div>
                <h4 className="font-serif font-bold text-white text-base">{work.authorName}</h4>
                <p className="text-xs text-amber-400">{work.authorRole === 'admin' ? 'Faculty Chair' : 'Researcher'}</p>
              </div>
            </div>

            {work.authorBio && (
              <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-3">
                {work.authorBio}
              </p>
            )}

            {work.institutionWebsite && (
              <a
                href={work.institutionWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:underline pt-1"
              >
                <span>Institutional Affiliation Profile &rarr;</span>
              </a>
            )}
          </div>

          {/* Related Publications Recommendation */}
          {relatedWorks.length > 0 && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
              <h4 className="font-serif font-bold text-white text-base">Related Research</h4>
              <div className="space-y-3">
                {relatedWorks.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectWork(rel)}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer group transition-colors"
                  >
                    <h5 className="font-serif text-xs font-bold text-slate-200 group-hover:text-amber-400 line-clamp-2 transition-colors">
                      {rel.title}
                    </h5>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{rel.authorName}</span>
                      <span className="flex items-center space-x-1 text-teal-400">
                        <Download className="w-3 h-3" />
                        <span>{rel.downloadsCount}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CitationModal
        work={work}
        isOpen={showCitationModal}
        onClose={() => setShowCitationModal(false)}
      />

      <ReportModal
        workId={work.id}
        commentId={reportingCommentId}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
