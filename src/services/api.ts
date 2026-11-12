import {
  AcademicWork,
  Category,
  Institution,
  NotificationItem,
  PlatformStats,
  WorkComment,
} from '../types/index.ts';

const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Stats & Platform Settings
  async getStats(): Promise<PlatformStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch platform stats');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    const res = await fetch('/api/institutions');
    if (!res.ok) throw new Error('Failed to fetch institutions');
    return res.json();
  },

  // Works Discovery
  async getWorks(params: {
    q?: string;
    category?: string;
    level?: string;
    type?: string;
    institution?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }, token?: string | null): Promise<{
    works: AcademicWork[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.level) query.set('level', params.level);
    if (params.type) query.set('type', params.type);
    if (params.institution) query.set('institution', params.institution.toString());
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/works?${query.toString()}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch works');
    return res.json();
  },

  // Featured Works
  async getFeaturedWorks(token?: string | null): Promise<AcademicWork[]> {
    const res = await fetch('/api/works/featured', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch featured works');
    return res.json();
  },

  // Trending Works
  async getTrendingWorks(token?: string | null): Promise<AcademicWork[]> {
    const res = await fetch('/api/works/trending', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch trending works');
    return res.json();
  },

  // Recent Works
  async getRecentWorks(token?: string | null): Promise<AcademicWork[]> {
    const res = await fetch('/api/works/recent', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch recent works');
    return res.json();
  },

  // Single Work by ID or Slug
  async getWorkDetails(identifier: string | number, token?: string | null): Promise<{
    work: AcademicWork;
    comments: WorkComment[];
    relatedWorks: AcademicWork[];
  }> {
    const res = await fetch(`/api/works/${identifier}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch work details');
    }
    return res.json();
  },

  // Like Toggle
  async toggleLike(workId: number, token: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await fetch(`/api/works/${workId}/like`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to update like status');
    return res.json();
  },

  // Bookmark Toggle
  async toggleBookmark(workId: number, token: string): Promise<{ bookmarked: boolean }> {
    const res = await fetch(`/api/works/${workId}/bookmark`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to update bookmark');
    return res.json();
  },

  // Post Comment
  async postComment(workId: number, content: string, token: string): Promise<WorkComment> {
    const res = await fetch(`/api/works/${workId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post comment');
    }
    return res.json();
  },

  // Reply to Comment
  async postCommentReply(commentId: number, content: string, token: string) {
    const res = await fetch(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to post reply');
    }
    return res.json();
  },

  // Delete Comment
  async deleteComment(commentId: number, token: string) {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },

  // Submit Report
  async submitReport(payload: { workId?: number; commentId?: number; reason: string; details?: string }, token: string) {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  // Upload Work
  async uploadWork(formData: FormData, token: string) {
    const res = await fetch('/api/works/upload', {
      method: 'POST',
      headers: getHeaders(token),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // User Profile
  async getUserProfile(token: string) {
    const res = await fetch('/api/user/profile', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateUserProfile(payload: any, token: string) {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // User Works
  async getUserWorks(status?: string, token?: string) {
    const url = status ? `/api/user/works?status=${status}` : '/api/user/works';
    const res = await fetch(url, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch user uploads');
    return res.json();
  },

  // User Likes & Bookmarks
  async getUserLikes(token: string) {
    const res = await fetch('/api/user/likes', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch liked items');
    return res.json();
  },

  async getUserBookmarks(token: string) {
    const res = await fetch('/api/user/bookmarks', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },

  async getUserDownloads(token: string) {
    const res = await fetch('/api/user/downloads', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch downloads history');
    return res.json();
  },

  // Notifications
  async getNotifications(token: string): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await fetch('/api/user/notifications', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markAllNotificationsRead(token: string) {
    const res = await fetch('/api/user/notifications/read-all', {
      method: 'PUT',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to mark notifications');
    return res.json();
  },

  // Admin APIs
  async getAdminMetrics(token: string) {
    const res = await fetch('/api/admin/metrics', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch admin metrics');
    return res.json();
  },

  async getAdminSubmissions(token: string) {
    const res = await fetch('/api/admin/submissions', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  async approveSubmission(id: number, token: string) {
    const res = await fetch(`/api/admin/submissions/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to approve submission');
    return res.json();
  },

  async rejectSubmission(id: number, reason: string, token: string) {
    const res = await fetch(`/api/admin/submissions/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject submission');
    return res.json();
  },

  async toggleFeatureWork(id: number, token: string) {
    const res = await fetch(`/api/admin/works/${id}/feature`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to toggle featured status');
    return res.json();
  },

  async getAdminUsers(token: string) {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async updateUserRole(id: number, role: 'admin' | 'user', token: string) {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return res.json();
  },

  async toggleBanUser(id: number, isBanned: boolean, token: string) {
    const res = await fetch(`/api/admin/users/${id}/ban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ isBanned }),
    });
    if (!res.ok) throw new Error('Failed to update ban status');
    return res.json();
  },

  async getAdminReports(token: string) {
    const res = await fetch('/api/admin/reports', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async resolveReport(id: number, status: 'resolved' | 'dismissed', token: string) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update report status');
    return res.json();
  },

  async getAdminSettings(token: string) {
    const res = await fetch('/api/admin/settings', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateAdminSettings(settings: any, token: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(token),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getAdminLogs(token: string) {
    const res = await fetch('/api/admin/logs', {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },
};
