export interface User {
  id: number;
  uid: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  role: 'admin' | 'user';
  institutionId?: number | null;
  isBanned: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  worksCount?: number;
}

export interface Institution {
  id: number;
  name: string;
  country?: string;
  website?: string;
  verified: boolean;
}

export interface AcademicWork {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  authorId: number;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorBio?: string;
  authorRole?: string;
  institutionId?: number | null;
  institutionName?: string;
  institutionCountry?: string;
  institutionWebsite?: string;
  courseOrSubject?: string;
  academicLevel: string;
  contributorNames?: string;
  publicationYear: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  thumbnailUrl?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isFeatured: boolean;
  downloadPermission: 'public' | 'registered_only' | 'restricted';
  licenseType: string;
  viewsCount: number;
  downloadsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface CommentReply {
  id: number;
  commentId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

export interface WorkComment {
  id: number;
  workId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  createdAt: string;
  replies?: CommentReply[];
}

export interface PlatformStats {
  totalWorks: number;
  registeredUsers: number;
  totalDownloads: number;
  totalCategories: number;
  settings?: {
    siteName: string;
    tagline: string;
  };
}

export interface NotificationItem {
  id: number;
  userId: number;
  actorId?: number;
  workId?: number;
  type: 'like' | 'comment' | 'reply' | 'approval' | 'rejection' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalWorks: number;
  pendingWorks: number;
  approvedWorks: number;
  rejectedWorks: number;
  totalDownloads: number;
  totalComments: number;
  pendingReports: number;
}
