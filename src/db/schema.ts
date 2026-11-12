import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// 1. Institutions Table
export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  country: text('country'),
  website: text('website'),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  username: text('username').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  role: text('role').default('user').notNull(), // 'admin' | 'user'
  institutionId: integer('institution_id').references(() => institutions.id, { onDelete: 'set null' }),
  isBanned: boolean('is_banned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_users_role').on(table.role),
  index('idx_users_institution').on(table.institutionId),
]);

// 3. Categories Table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_categories_active_order').on(table.isActive, table.displayOrder),
]);

// 4. Academic Works Table (Optimized with search indexes)
export const academicWorks = pgTable('academic_works', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  shortDescription: text('short_description').notNull(),
  fullDescription: text('full_description').notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'restrict' }).notNull(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  institutionId: integer('institution_id').references(() => institutions.id, { onDelete: 'set null' }),
  courseOrSubject: text('course_or_subject'),
  academicLevel: text('academic_level').default('Undergraduate').notNull(),
  contributorNames: text('contributor_names'),
  publicationYear: integer('publication_year').notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').default(0).notNull(),
  thumbnailUrl: text('thumbnail_url'),
  status: text('status').default('approved').notNull(), // 'draft' | 'pending' | 'approved' | 'rejected'
  rejectionReason: text('rejection_reason'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  downloadPermission: text('download_permission').default('public').notNull(), // 'public' | 'registered_only' | 'restricted'
  copyrightDeclaration: boolean('copyright_declaration').default(true).notNull(),
  licenseType: text('license_type').default('CC-BY-4.0').notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  downloadsCount: integer('downloads_count').default(0).notNull(),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_works_status_created').on(table.status, table.createdAt),
  index('idx_works_status_category').on(table.status, table.categoryId),
  index('idx_works_status_downloads').on(table.status, table.downloadsCount),
  index('idx_works_status_likes').on(table.status, table.likesCount),
  index('idx_works_status_views').on(table.status, table.viewsCount),
  index('idx_works_author').on(table.authorId),
  index('idx_works_featured').on(table.status, table.isFeatured),
  index('idx_works_level').on(table.academicLevel),
  index('idx_works_filetype').on(table.fileType),
]);

// 5. Tags Table
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

// 6. Work Tags Junction Table
export const workTags = pgTable(
  'work_tags',
  {
    workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }).notNull(),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workId, table.tagId] }),
    index('idx_work_tags_tag').on(table.tagId),
  ]
);

// 7. Likes Table (Unique per user + work)
export const likes = pgTable(
  'likes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_work_like_idx').on(table.userId, table.workId),
    index('idx_likes_work').on(table.workId),
  ]
);

// 8. Bookmarks Table (Unique per user + work)
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_work_bookmark_idx').on(table.userId, table.workId),
    index('idx_bookmarks_user').on(table.userId),
  ]
);

// 9. Comments Table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isModerated: boolean('is_moderated').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_comments_work_created').on(table.workId, table.createdAt),
  index('idx_comments_user').on(table.userId),
]);

// 10. Comment Replies Table
export const commentReplies = pgTable('comment_replies', {
  id: serial('id').primaryKey(),
  commentId: integer('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isModerated: boolean('is_moderated').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_replies_comment').on(table.commentId),
]);

// 11. Downloads Table (Track download events and metrics)
export const downloads = pgTable('downloads', {
  id: serial('id').primaryKey(),
  workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipHash: text('ip_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_downloads_work_time').on(table.workId, table.createdAt),
  index('idx_downloads_user').on(table.userId),
]);

// 12. Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'like' | 'comment' | 'reply' | 'approval' | 'rejection' | 'announcement'
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_user_read').on(table.userId, table.isRead),
]);

// 13. Reports Table (Academic integrity, copyright & comment reporting)
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workId: integer('work_id').references(() => academicWorks.id, { onDelete: 'set null' }),
  commentId: integer('comment_id').references(() => comments.id, { onDelete: 'set null' }),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').default('pending').notNull(), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_reports_status').on(table.status),
]);

// 14. User Activity Table
export const userActivity = pgTable('user_activity', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: text('action_type').notNull(), // 'upload' | 'download' | 'like' | 'comment' | 'login'
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_user_activity_user_time').on(table.userId, table.createdAt),
]);

// 15. Admin Logs Table
export const adminLogs = pgTable('admin_logs', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: integer('target_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. Platform Settings Table
export const platformSettings = pgTable('platform_settings', {
  id: serial('id').primaryKey(),
  siteName: text('site_name').default('ScholarHub').notNull(),
  tagline: text('tagline').default('Discover. Share. Learn. Grow.').notNull(),
  requireApproval: boolean('require_approval').default(false).notNull(),
  allowGuestDownloads: boolean('allow_guest_downloads').default(true).notNull(),
  contactEmail: text('contact_email').default('support@scholarhub.edu').notNull(),
});

// Drizzle Relations Definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  works: many(academicWorks),
  likes: many(likes),
  bookmarks: many(bookmarks),
  comments: many(comments),
  commentReplies: many(commentReplies),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  works: many(academicWorks),
}));

export const academicWorksRelations = relations(academicWorks, ({ one, many }) => ({
  author: one(users, {
    fields: [academicWorks.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [academicWorks.categoryId],
    references: [categories.id],
  }),
  institution: one(institutions, {
    fields: [academicWorks.institutionId],
    references: [institutions.id],
  }),
  likes: many(likes),
  bookmarks: many(bookmarks),
  comments: many(comments),
  downloads: many(downloads),
  workTags: many(workTags),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  work: one(academicWorks, {
    fields: [comments.workId],
    references: [academicWorks.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  replies: many(commentReplies),
}));

export const commentRepliesRelations = relations(commentReplies, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReplies.commentId],
    references: [comments.id],
  }),
  author: one(users, {
    fields: [commentReplies.userId],
    references: [users.id],
  }),
}));
