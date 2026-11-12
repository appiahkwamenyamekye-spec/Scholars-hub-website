import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  academicWorks,
  adminLogs,
  bookmarks,
  categories,
  commentReplies,
  comments,
  downloads,
  institutions,
  likes,
  notifications,
  platformSettings,
  reports,
  userActivity,
  users,
} from './src/db/schema.ts';
import { optionalAuth, requireAdmin, requireAuth, AuthRequest } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for documents and covers
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${cleanName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.zip', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: PDF, DOCX, PPTX, XLSX, ZIP, PNG, JPG`));
    }
  },
});

app.use('/uploads', express.static(uploadDir));

// Helper to log user activity
async function logActivity(userId: number, actionType: string, details?: string) {
  try {
    await db.insert(userActivity).values({ userId, actionType, details });
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

// Helper to log admin actions
async function logAdminAction(adminId: number, action: string, targetType: string, targetId?: number, notes?: string) {
  try {
    await db.insert(adminLogs).values({ adminId, action, targetType, targetId, notes });
  } catch (err) {
    console.warn('Failed to log admin action:', err);
  }
}

// ---------------- API ROUTES ----------------

// 1. Platform Statistics (Real Database Counts)
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const [worksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(academicWorks)
      .where(eq(academicWorks.status, 'approved'));

    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [downloadsCount] = await db
      .select({ count: sql<number>`coalesce(sum(${academicWorks.downloadsCount}), 0)` })
      .from(academicWorks);

    const [categoriesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.isActive, true));

    const [settings] = await db.select().from(platformSettings).limit(1);

    res.json({
      totalWorks: Number(worksCount?.count || 0),
      registeredUsers: Number(usersCount?.count || 0),
      totalDownloads: Number(downloadsCount?.count || 0),
      totalCategories: Number(categoriesCount?.count || 0),
      settings: settings || {
        siteName: 'ScholarHub',
        tagline: 'Discover. Share. Learn. Grow.',
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to retrieve platform statistics' });
  }
});

// 2. Categories with Work Counts
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const catList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        icon: categories.icon,
        displayOrder: categories.displayOrder,
        isActive: categories.isActive,
        worksCount: sql<number>`count(${academicWorks.id}) filter (where ${academicWorks.status} = 'approved')`,
      })
      .from(categories)
      .leftJoin(academicWorks, eq(categories.id, academicWorks.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.displayOrder, categories.name);

    res.json(catList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Admin category management
app.post('/api/categories', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, displayOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [newCat] = await db.insert(categories).values({
      name,
      slug,
      description,
      icon: icon || 'BookOpen',
      displayOrder: displayOrder || 0,
      isActive: true,
    }).returning();

    await logAdminAction(req.dbUser.id, 'create_category', 'category', newCat.id, `Created category: ${name}`);
    res.status(201).json(newCat);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

app.put('/api/categories/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, icon, displayOrder, isActive } = req.body;
    const [updated] = await db.update(categories)
      .set({
        ...(name ? { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(displayOrder !== undefined ? { displayOrder } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      })
      .where(eq(categories.id, id))
      .returning();

    await logAdminAction(req.dbUser.id, 'update_category', 'category', id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update category' });
  }
});

// 3. Institutions
app.get('/api/institutions', async (_req: Request, res: Response) => {
  try {
    const instList = await db.select().from(institutions).orderBy(institutions.name);
    res.json(instList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// 4. Academic Works Discovery & Advanced Filtering
app.get('/api/works', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const categorySlug = (req.query.category as string) || '';
    const academicLevel = (req.query.level as string) || '';
    const fileType = (req.query.type as string) || '';
    const institutionId = req.query.institution ? parseInt(req.query.institution as string) : undefined;
    const sortBy = (req.query.sort as string) || 'popular'; // popular, recent, downloads, likes, oldest
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '12')));
    const offset = (page - 1) * limit;

    const conditions = [eq(academicWorks.status, 'approved')];

    if (query.trim()) {
      const searchPattern = `%${query.trim()}%`;
      conditions.push(
        or(
          ilike(academicWorks.title, searchPattern),
          ilike(academicWorks.shortDescription, searchPattern),
          ilike(academicWorks.courseOrSubject, searchPattern),
          ilike(academicWorks.contributorNames, searchPattern)
        )!
      );
    }

    if (categorySlug) {
      const [matchedCat] = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      if (matchedCat) {
        conditions.push(eq(academicWorks.categoryId, matchedCat.id));
      }
    }

    if (academicLevel) {
      conditions.push(eq(academicWorks.academicLevel, academicLevel));
    }

    if (fileType) {
      conditions.push(ilike(academicWorks.fileType, fileType));
    }

    if (institutionId) {
      conditions.push(eq(academicWorks.institutionId, institutionId));
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderByClause;
    switch (sortBy) {
      case 'recent':
        orderByClause = desc(academicWorks.createdAt);
        break;
      case 'downloads':
        orderByClause = desc(academicWorks.downloadsCount);
        break;
      case 'likes':
        orderByClause = desc(academicWorks.likesCount);
        break;
      case 'oldest':
        orderByClause = academicWorks.createdAt;
        break;
      case 'popular':
      default:
        orderByClause = desc(
          sql`(${academicWorks.downloadsCount} * 2 + ${academicWorks.likesCount} * 3 + ${academicWorks.viewsCount})`
        );
        break;
    }

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(academicWorks)
      .where(whereClause);

    const worksList = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryId: academicWorks.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: academicWorks.authorId,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        authorRole: users.role,
        institutionId: academicWorks.institutionId,
        institutionName: institutions.name,
        courseOrSubject: academicWorks.courseOrSubject,
        academicLevel: academicWorks.academicLevel,
        publicationYear: academicWorks.publicationYear,
        fileType: academicWorks.fileType,
        fileSizeBytes: academicWorks.fileSizeBytes,
        thumbnailUrl: academicWorks.thumbnailUrl,
        isFeatured: academicWorks.isFeatured,
        downloadPermission: academicWorks.downloadPermission,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .leftJoin(institutions, eq(academicWorks.institutionId, institutions.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // If user is authenticated, check which works are liked/bookmarked
    let userLikesSet = new Set<number>();
    let userBookmarksSet = new Set<number>();
    if (req.dbUser?.id) {
      const userLikes = await db.select({ workId: likes.workId }).from(likes).where(eq(likes.userId, req.dbUser.id));
      userLikes.forEach((l) => userLikesSet.add(l.workId));

      const userBookmarks = await db.select({ workId: bookmarks.workId }).from(bookmarks).where(eq(bookmarks.userId, req.dbUser.id));
      userBookmarks.forEach((b) => userBookmarksSet.add(b.workId));
    }

    const enrichedWorks = worksList.map((w) => ({
      ...w,
      isLiked: userLikesSet.has(w.id),
      isBookmarked: userBookmarksSet.has(w.id),
    }));

    res.json({
      works: enrichedWorks,
      total: Number(totalResult?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalResult?.count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in /api/works:', error);
    res.status(500).json({ error: 'Failed to retrieve academic works' });
  }
});

// 5. Featured Works
app.get('/api/works/featured', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        institutionName: institutions.name,
        fileType: academicWorks.fileType,
        thumbnailUrl: academicWorks.thumbnailUrl,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .leftJoin(institutions, eq(academicWorks.institutionId, institutions.id))
      .where(and(eq(academicWorks.status, 'approved'), eq(academicWorks.isFeatured, true)))
      .limit(6);

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured works' });
  }
});

// 6. Trending Works
app.get('/api/works/trending', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        institutionName: institutions.name,
        fileType: academicWorks.fileType,
        thumbnailUrl: academicWorks.thumbnailUrl,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .leftJoin(institutions, eq(academicWorks.institutionId, institutions.id))
      .where(eq(academicWorks.status, 'approved'))
      .orderBy(desc(sql`(${academicWorks.downloadsCount} * 2 + ${academicWorks.likesCount} * 3 + ${academicWorks.viewsCount})`))
      .limit(6);

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending works' });
  }
});

// 7. Recently Uploaded Approved Works
app.get('/api/works/recent', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorName: users.displayName,
        authorAvatar: users.avatarUrl,
        institutionName: institutions.name,
        fileType: academicWorks.fileType,
        thumbnailUrl: academicWorks.thumbnailUrl,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .leftJoin(institutions, eq(academicWorks.institutionId, institutions.id))
      .where(eq(academicWorks.status, 'approved'))
      .orderBy(desc(academicWorks.createdAt))
      .limit(8);

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent works' });
  }
});

// 8. Single Work Details Page
app.get('/api/works/:identifier', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const param = req.params.identifier;
    const isNumeric = /^\d+$/.test(param);

    const condition = isNumeric
      ? eq(academicWorks.id, parseInt(param))
      : eq(academicWorks.slug, param);

    const [work] = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        fullDescription: academicWorks.fullDescription,
        categoryId: academicWorks.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: academicWorks.authorId,
        authorName: users.displayName,
        authorUsername: users.username,
        authorAvatar: users.avatarUrl,
        authorBio: users.bio,
        authorRole: users.role,
        institutionId: academicWorks.institutionId,
        institutionName: institutions.name,
        institutionCountry: institutions.country,
        institutionWebsite: institutions.website,
        courseOrSubject: academicWorks.courseOrSubject,
        academicLevel: academicWorks.academicLevel,
        contributorNames: academicWorks.contributorNames,
        publicationYear: academicWorks.publicationYear,
        fileUrl: academicWorks.fileUrl,
        fileName: academicWorks.fileName,
        fileType: academicWorks.fileType,
        fileSizeBytes: academicWorks.fileSizeBytes,
        thumbnailUrl: academicWorks.thumbnailUrl,
        status: academicWorks.status,
        rejectionReason: academicWorks.rejectionReason,
        isFeatured: academicWorks.isFeatured,
        downloadPermission: academicWorks.downloadPermission,
        licenseType: academicWorks.licenseType,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
        updatedAt: academicWorks.updatedAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .leftJoin(institutions, eq(academicWorks.institutionId, institutions.id))
      .where(condition)
      .limit(1);

    if (!work) {
      return res.status(404).json({ error: 'Academic work not found' });
    }

    // Check visibility if not approved
    if (work.status !== 'approved') {
      const isAuthor = req.dbUser?.id === work.authorId;
      const isAdmin = req.dbUser?.role === 'admin';
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'This academic work is pending review' });
      }
    }

    // Asynchronously increment view count
    db.update(academicWorks)
      .set({ viewsCount: sql`${academicWorks.viewsCount} + 1` })
      .where(eq(academicWorks.id, work.id))
      .catch((e) => console.warn('View count update error:', e));

    // Fetch comments and nested replies
    const workComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        isModerated: comments.isModerated,
        createdAt: comments.createdAt,
        userId: comments.userId,
        userName: users.displayName,
        userAvatar: users.avatarUrl,
        userRole: users.role,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.workId, work.id), eq(comments.isDeleted, false)))
      .orderBy(desc(comments.createdAt));

    // Fetch replies for these comments
    const commentIds = workComments.map((c) => c.id);
    let repliesMap: Record<number, any[]> = {};
    if (commentIds.length > 0) {
      const allReplies = await db
        .select({
          id: commentReplies.id,
          commentId: commentReplies.commentId,
          content: commentReplies.content,
          createdAt: commentReplies.createdAt,
          userId: commentReplies.userId,
          userName: users.displayName,
          userAvatar: users.avatarUrl,
          userRole: users.role,
        })
        .from(commentReplies)
        .leftJoin(users, eq(commentReplies.userId, users.id))
        .where(eq(commentReplies.isDeleted, false))
        .orderBy(commentReplies.createdAt);

      allReplies.forEach((r) => {
        if (!repliesMap[r.commentId]) repliesMap[r.commentId] = [];
        repliesMap[r.commentId].push(r);
      });
    }

    const threadedComments = workComments.map((c) => ({
      ...c,
      replies: repliesMap[c.id] || [],
    }));

    // Check like & bookmark status
    let isLiked = false;
    let isBookmarked = false;
    if (req.dbUser?.id) {
      const [likeRow] = await db
        .select()
        .from(likes)
        .where(and(eq(likes.userId, req.dbUser.id), eq(likes.workId, work.id)))
        .limit(1);
      isLiked = !!likeRow;

      const [bookmarkRow] = await db
        .select()
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, req.dbUser.id), eq(bookmarks.workId, work.id)))
        .limit(1);
      isBookmarked = !!bookmarkRow;
    }

    // Related works in same category
    const relatedWorks = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        categoryName: categories.name,
        authorName: users.displayName,
        fileType: academicWorks.fileType,
        thumbnailUrl: academicWorks.thumbnailUrl,
        likesCount: academicWorks.likesCount,
        downloadsCount: academicWorks.downloadsCount,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .where(and(eq(academicWorks.categoryId, work.categoryId), sql`${academicWorks.id} != ${work.id}`, eq(academicWorks.status, 'approved')))
      .limit(4);

    res.json({
      work: {
        ...work,
        viewsCount: work.viewsCount + 1,
        isLiked,
        isBookmarked,
      },
      comments: threadedComments,
      relatedWorks,
    });
  } catch (error) {
    console.error('Error fetching work details:', error);
    res.status(500).json({ error: 'Failed to retrieve academic work details' });
  }
});

// 9. Academic Upload System (Multipart File Upload)
app.post(
  '/api/works/upload',
  requireAuth,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const docFile = files?.['document']?.[0];
      const coverFile = files?.['cover']?.[0];

      if (!docFile) {
        return res.status(400).json({ error: 'Please upload a valid academic document file' });
      }

      const {
        title,
        shortDescription,
        fullDescription,
        categoryId,
        institutionId,
        courseOrSubject,
        academicLevel,
        contributorNames,
        publicationYear,
        downloadPermission,
        licenseType,
        copyrightDeclaration,
        isDraft,
      } = req.body;

      if (!title || !shortDescription || !categoryId) {
        return res.status(400).json({ error: 'Title, short description, and category are required' });
      }

      if (copyrightDeclaration !== 'true' && copyrightDeclaration !== true) {
        return res.status(400).json({ error: 'You must confirm ownership or distribution rights for this material.' });
      }

      // Check settings to see if moderation approval is needed
      const [settings] = await db.select().from(platformSettings).limit(1);
      const isDraftBool = isDraft === 'true' || isDraft === true;
      const initialStatus = isDraftBool ? 'draft' : (settings?.requireApproval ? 'pending' : 'approved');

      // Generate unique slug
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

      const ext = path.extname(docFile.originalname).replace('.', '').toUpperCase();

      const [newWork] = await db
        .insert(academicWorks)
        .values({
          title,
          slug: uniqueSlug,
          shortDescription,
          fullDescription: fullDescription || shortDescription,
          categoryId: parseInt(categoryId),
          authorId: req.dbUser.id,
          institutionId: institutionId ? parseInt(institutionId) : null,
          courseOrSubject: courseOrSubject || null,
          academicLevel: academicLevel || 'Undergraduate',
          contributorNames: contributorNames || null,
          publicationYear: parseInt(publicationYear) || new Date().getFullYear(),
          fileUrl: `/uploads/${docFile.filename}`,
          fileName: docFile.originalname,
          fileType: ext,
          fileSizeBytes: docFile.size,
          thumbnailUrl: coverFile
            ? `/uploads/${coverFile.filename}`
            : 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600',
          status: initialStatus,
          isFeatured: false,
          downloadPermission: downloadPermission || 'public',
          copyrightDeclaration: true,
          licenseType: licenseType || 'CC-BY-4.0',
        })
        .returning();

      await logActivity(req.dbUser.id, 'upload', `Uploaded "${title}"`);

      // If pending, notify admins
      if (initialStatus === 'pending') {
        const admins = await db.select().from(users).where(eq(users.role, 'admin'));
        for (const admin of admins) {
          await db.insert(notifications).values({
            userId: admin.id,
            actorId: req.dbUser.id,
            workId: newWork.id,
            type: 'announcement',
            title: 'New Academic Submission for Review',
            message: `${req.dbUser.displayName || 'An author'} submitted "${title}" for review.`,
          });
        }
      }

      res.status(201).json({
        work: newWork,
        message: initialStatus === 'pending'
          ? 'Your academic work has been submitted for peer and administrator review.'
          : 'Your academic work has been published successfully!',
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      res.status(500).json({ error: error.message || 'Academic file upload failed' });
    }
  }
);

// 10. Like / Unlike Work
app.post('/api/works/:id/like', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workId = parseInt(req.params.id);
    const userId = req.dbUser.id;

    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.workId, workId)))
      .limit(1);

    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      await db
        .update(academicWorks)
        .set({ likesCount: sql`greatest(${academicWorks.likesCount} - 1, 0)` })
        .where(eq(academicWorks.id, workId));

      const [updated] = await db.select({ count: academicWorks.likesCount }).from(academicWorks).where(eq(academicWorks.id, workId));
      return res.json({ liked: false, likesCount: updated.count });
    } else {
      await db.insert(likes).values({ userId, workId });
      await db
        .update(academicWorks)
        .set({ likesCount: sql`${academicWorks.likesCount} + 1` })
        .where(eq(academicWorks.id, workId));

      const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, workId)).limit(1);
      if (work && work.authorId !== userId) {
        await db.insert(notifications).values({
          userId: work.authorId,
          actorId: userId,
          workId,
          type: 'like',
          title: 'New Like on Your Academic Work',
          message: `${req.dbUser.displayName} liked "${work.title}".`,
        });
      }

      await logActivity(userId, 'like', `Liked work #${workId}`);
      const [updated] = await db.select({ count: academicWorks.likesCount }).from(academicWorks).where(eq(academicWorks.id, workId));
      return res.json({ liked: true, likesCount: updated.count });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle like' });
  }
});

// 11. Bookmark / Unbookmark Work
app.post('/api/works/:id/bookmark', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workId = parseInt(req.params.id);
    const userId = req.dbUser.id;

    const [existing] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.workId, workId)))
      .limit(1);

    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return res.json({ bookmarked: false });
    } else {
      await db.insert(bookmarks).values({ userId, workId });
      return res.json({ bookmarked: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle bookmark' });
  }
});

// 12. Add Comment
app.post('/api/works/:id/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        workId,
        userId: req.dbUser.id,
        content: content.trim(),
      })
      .returning();

    await db
      .update(academicWorks)
      .set({ commentsCount: sql`${academicWorks.commentsCount} + 1` })
      .where(eq(academicWorks.id, workId));

    const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, workId)).limit(1);
    if (work && work.authorId !== req.dbUser.id) {
      await db.insert(notifications).values({
        userId: work.authorId,
        actorId: req.dbUser.id,
        workId,
        type: 'comment',
        title: 'New Discussion on Your Work',
        message: `${req.dbUser.displayName} commented on "${work.title}".`,
      });
    }

    await logActivity(req.dbUser.id, 'comment', `Commented on "${work?.title}"`);

    res.status(201).json({
      ...newComment,
      userName: req.dbUser.displayName,
      userAvatar: req.dbUser.avatarUrl,
      userRole: req.dbUser.role,
      replies: [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to post comment' });
  }
});

// 13. Reply to Comment
app.post('/api/comments/:id/replies', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content cannot be empty' });
    }

    const [parentComment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (!parentComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const [newReply] = await db
      .insert(commentReplies)
      .values({
        commentId,
        userId: req.dbUser.id,
        content: content.trim(),
      })
      .returning();

    if (parentComment.userId !== req.dbUser.id) {
      await db.insert(notifications).values({
        userId: parentComment.userId,
        actorId: req.dbUser.id,
        workId: parentComment.workId,
        type: 'reply',
        title: 'Reply to Your Academic Comment',
        message: `${req.dbUser.displayName} replied to your comment.`,
      });
    }

    res.status(201).json({
      ...newReply,
      userName: req.dbUser.displayName,
      userAvatar: req.dbUser.avatarUrl,
      userRole: req.dbUser.role,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to post reply' });
  }
});

// 14. Delete Comment
app.delete('/api/comments/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.userId !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await db.update(comments).set({ isDeleted: true }).where(eq(comments.id, commentId));
    await db
      .update(academicWorks)
      .set({ commentsCount: sql`greatest(${academicWorks.commentsCount} - 1, 0)` })
      .where(eq(academicWorks.id, comment.workId));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete comment' });
  }
});

// 15. Secure Download Handler
app.get('/api/works/:id/download', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const workId = parseInt(req.params.id);
    const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, workId)).limit(1);
    if (!work) return res.status(404).json({ error: 'Academic work not found' });

    // Check permissions
    if (work.downloadPermission === 'registered_only' && !req.dbUser) {
      return res.status(401).json({ error: 'Registration required: Please log in or sign up to download this academic resource.' });
    }
    if (work.downloadPermission === 'restricted') {
      const isAuthor = req.dbUser?.id === work.authorId;
      const isAdmin = req.dbUser?.role === 'admin';
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: 'Access restricted: Contact the author for download permission.' });
      }
    }

    // Hash client IP for legitimate analytics
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
    const ipHash = crypto.createHash('sha256').update(String(clientIp)).digest('hex').slice(0, 16);

    // Track download in database
    await db.insert(downloads).values({
      workId: work.id,
      userId: req.dbUser?.id || null,
      ipHash,
    });

    await db
      .update(academicWorks)
      .set({ downloadsCount: sql`${academicWorks.downloadsCount} + 1` })
      .where(eq(academicWorks.id, work.id));

    if (req.dbUser?.id) {
      await logActivity(req.dbUser.id, 'download', `Downloaded "${work.title}"`);
    }

    // Locate physical file
    const relativePath = work.fileUrl.startsWith('/uploads/') ? work.fileUrl.replace('/uploads/', '') : work.fileUrl;
    const physicalPath = path.join(uploadDir, relativePath);

    if (fs.existsSync(physicalPath)) {
      res.download(physicalPath, work.fileName || 'academic-paper.pdf');
    } else {
      // Fallback: stream generated academic summary if mock path
      res.setHeader('Content-Disposition', `attachment; filename="${work.fileName || 'paper.pdf'}"`);
      res.setHeader('Content-Type', 'application/pdf');
      const fallbackPdf = path.join(uploadDir, 'consensus_algorithms_2025.pdf');
      if (fs.existsSync(fallbackPdf)) {
        fs.createReadStream(fallbackPdf).pipe(res);
      } else {
        res.send(`Academic Document: ${work.title}\nAuthor: ${work.contributorNames || 'ScholarHub Researcher'}\nLicense: ${work.licenseType}`);
      }
    }
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process document download' });
  }
});

// 16. Submit Content Report
app.post('/api/reports', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { workId, commentId, reason, details } = req.body;
    if (!reason) return res.status(400).json({ error: 'Report reason is required' });

    const [report] = await db
      .insert(reports)
      .values({
        reporterId: req.dbUser.id,
        workId: workId ? parseInt(workId) : null,
        commentId: commentId ? parseInt(commentId) : null,
        reason,
        details,
        status: 'pending',
      })
      .returning();

    res.status(201).json({ message: 'Thank you. The academic review board will investigate this report.', report });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit report' });
  }
});

// 17. User Profile & Settings
app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.dbUser;
    // Calculate author metrics
    const [authorMetrics] = await db
      .select({
        totalViews: sql<number>`coalesce(sum(${academicWorks.viewsCount}), 0)`,
        totalDownloads: sql<number>`coalesce(sum(${academicWorks.downloadsCount}), 0)`,
        totalLikes: sql<number>`coalesce(sum(${academicWorks.likesCount}), 0)`,
        totalComments: sql<number>`coalesce(sum(${academicWorks.commentsCount}), 0)`,
        totalWorks: sql<number>`count(*)`,
      })
      .from(academicWorks)
      .where(eq(academicWorks.authorId, user.id));

    res.json({
      user,
      metrics: {
        totalViews: Number(authorMetrics?.totalViews || 0),
        totalDownloads: Number(authorMetrics?.totalDownloads || 0),
        totalLikes: Number(authorMetrics?.totalLikes || 0),
        totalComments: Number(authorMetrics?.totalComments || 0),
        totalWorks: Number(authorMetrics?.totalWorks || 0),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
});

app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, username, bio, institutionId, avatarUrl } = req.body;
    const [updated] = await db
      .update(users)
      .set({
        ...(displayName ? { displayName } : {}),
        ...(username ? { username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(institutionId !== undefined ? { institutionId: institutionId ? parseInt(institutionId) : null } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.dbUser.id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// 18. User Uploads / Submissions
app.get('/api/user/works', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = (req.query.status as string) || '';
    const conditions = [eq(academicWorks.authorId, req.dbUser.id)];
    if (status) {
      conditions.push(eq(academicWorks.status, status));
    }

    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryName: categories.name,
        academicLevel: academicLevelAlias(categories.name),
        status: academicWorks.status,
        rejectionReason: academicWorks.rejectionReason,
        fileType: academicWorks.fileType,
        fileSizeBytes: academicWorks.fileSizeBytes,
        viewsCount: academicWorks.viewsCount,
        downloadsCount: academicWorks.downloadsCount,
        likesCount: academicWorks.likesCount,
        commentsCount: academicWorks.commentsCount,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(academicWorks.createdAt));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user works' });
  }
});

function academicLevelAlias(name: any) {
  return academicWorks.academicLevel;
}

// 19. User Likes, Bookmarks, and Download History
app.get('/api/user/likes', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        categoryName: categories.name,
        authorName: users.displayName,
        fileType: academicWorks.fileType,
        likesCount: academicWorks.likesCount,
        downloadsCount: academicWorks.downloadsCount,
        likedAt: likes.createdAt,
      })
      .from(likes)
      .innerJoin(academicWorks, eq(likes.workId, academicWorks.id))
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .where(eq(likes.userId, req.dbUser.id))
      .orderBy(desc(likes.createdAt));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch likes' });
  }
});

app.get('/api/user/bookmarks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        categoryName: categories.name,
        authorName: users.displayName,
        fileType: academicWorks.fileType,
        viewsCount: academicWorks.viewsCount,
        likesCount: academicWorks.likesCount,
        downloadsCount: academicWorks.downloadsCount,
        bookmarkedAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .innerJoin(academicWorks, eq(bookmarks.workId, academicWorks.id))
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .where(eq(bookmarks.userId, req.dbUser.id))
      .orderBy(desc(bookmarks.createdAt));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch bookmarks' });
  }
});

app.get('/api/user/downloads', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        downloadId: downloads.id,
        downloadedAt: downloads.createdAt,
        workId: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        categoryName: categories.name,
        authorName: users.displayName,
        fileType: academicWorks.fileType,
      })
      .from(downloads)
      .innerJoin(academicWorks, eq(downloads.workId, academicWorks.id))
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .where(eq(downloads.userId, req.dbUser.id))
      .orderBy(desc(downloads.createdAt))
      .limit(50);

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch download history' });
  }
});

// 20. Notifications
app.get('/api/user/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.dbUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const [unread] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, req.dbUser.id), eq(notifications.isRead, false)));

    res.json({
      notifications: list,
      unreadCount: Number(unread?.count || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.put('/api/user/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, req.dbUser.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to mark notifications' });
  }
});

// 21. Administrator Control Center Endpoints
app.get('/api/admin/metrics', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalWorks] = await db.select({ count: sql<number>`count(*)` }).from(academicWorks);
    const [pendingWorks] = await db.select({ count: sql<number>`count(*)` }).from(academicWorks).where(eq(academicWorks.status, 'pending'));
    const [approvedWorks] = await db.select({ count: sql<number>`count(*)` }).from(academicWorks).where(eq(academicWorks.status, 'approved'));
    const [rejectedWorks] = await db.select({ count: sql<number>`count(*)` }).from(academicWorks).where(eq(academicWorks.status, 'rejected'));
    const [totalDownloads] = await db.select({ count: sql<number>`count(*)` }).from(downloads);
    const [totalComments] = await db.select({ count: sql<number>`count(*)` }).from(comments);
    const [pendingReports] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, 'pending'));

    res.json({
      totalUsers: Number(totalUsers?.count || 0),
      totalWorks: Number(totalWorks?.count || 0),
      pendingWorks: Number(pendingWorks?.count || 0),
      approvedWorks: Number(approvedWorks?.count || 0),
      rejectedWorks: Number(rejectedWorks?.count || 0),
      totalDownloads: Number(totalDownloads?.count || 0),
      totalComments: Number(totalComments?.count || 0),
      pendingReports: Number(pendingReports?.count || 0),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin metrics' });
  }
});

// Admin: pending submissions
app.get('/api/admin/submissions', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const pending = await db
      .select({
        id: academicWorks.id,
        title: academicWorks.title,
        slug: academicWorks.slug,
        shortDescription: academicWorks.shortDescription,
        categoryName: categories.name,
        authorName: users.displayName,
        authorEmail: users.email,
        academicLevel: academicWorks.academicLevel,
        fileType: academicWorks.fileType,
        fileSizeBytes: academicWorks.fileSizeBytes,
        createdAt: academicWorks.createdAt,
      })
      .from(academicWorks)
      .leftJoin(categories, eq(academicWorks.categoryId, categories.id))
      .leftJoin(users, eq(academicWorks.authorId, users.id))
      .where(eq(academicWorks.status, 'pending'))
      .orderBy(academicWorks.createdAt);

    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch submissions' });
  }
});

app.post('/api/admin/submissions/:id/approve', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, id)).limit(1);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    await db.update(academicWorks).set({ status: 'approved', rejectionReason: null }).where(eq(academicWorks.id, id));

    await db.insert(notifications).values({
      userId: work.authorId,
      actorId: req.dbUser.id,
      workId: work.id,
      type: 'approval',
      title: 'Publication Approved!',
      message: `Your academic work "${work.title}" has been approved by the editorial board and is now live.`,
    });

    await logAdminAction(req.dbUser.id, 'approve_work', 'academic_work', id, `Approved "${work.title}"`);
    res.json({ success: true, message: 'Work approved and published.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to approve submission' });
  }
});

app.post('/api/admin/submissions/:id/reject', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;
    const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, id)).limit(1);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    await db.update(academicWorks).set({ status: 'rejected', rejectionReason: reason || 'Does not meet academic submission standards.' }).where(eq(academicWorks.id, id));

    await db.insert(notifications).values({
      userId: work.authorId,
      actorId: req.dbUser.id,
      workId: work.id,
      type: 'rejection',
      title: 'Academic Submission Update',
      message: `Your submission "${work.title}" requires revisions: ${reason || 'Does not meet standards.'}`,
    });

    await logAdminAction(req.dbUser.id, 'reject_work', 'academic_work', id, reason);
    res.json({ success: true, message: 'Work rejected with feedback.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reject submission' });
  }
});

// Admin: Toggle Feature Status on Work
app.post('/api/admin/works/:id/feature', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [work] = await db.select().from(academicWorks).where(eq(academicWorks.id, id)).limit(1);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const newFeatured = !work.isFeatured;
    await db.update(academicWorks).set({ isFeatured: newFeatured }).where(eq(academicWorks.id, id));
    await logAdminAction(req.dbUser.id, newFeatured ? 'feature_work' : 'unfeature_work', 'academic_work', id);

    res.json({ success: true, isFeatured: newFeatured });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update feature status' });
  }
});

// Admin: User Management
app.get('/api/admin/users', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        worksCount: sql<number>`count(${academicWorks.id})`,
      })
      .from(users)
      .leftJoin(academicWorks, eq(users.id, academicWorks.authorId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    res.json(userList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (role !== 'admin' && role !== 'user') return res.status(400).json({ error: 'Invalid role' });

    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    await logAdminAction(req.dbUser.id, 'change_role', 'user', id, `Changed role to ${role}`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change role' });
  }
});

app.put('/api/admin/users/:id/ban', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isBanned } = req.body;
    const [updated] = await db.update(users).set({ isBanned: !!isBanned }).where(eq(users.id, id)).returning();
    await logAdminAction(req.dbUser.id, isBanned ? 'ban_user' : 'unban_user', 'user', id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user ban status' });
  }
});

// Admin: Reports
app.get('/api/admin/reports', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: reports.id,
        reason: reports.reason,
        details: reports.details,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterName: users.displayName,
        workId: reports.workId,
        workTitle: academicWorks.title,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .leftJoin(academicWorks, eq(reports.workId, academicWorks.id))
      .orderBy(desc(reports.createdAt));

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
});

app.put('/api/admin/reports/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [updated] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update report' });
  }
});

// Admin: Platform Settings
app.get('/api/admin/settings', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [settings] = await db.select().from(platformSettings).limit(1);
    res.json(settings || { siteName: 'ScholarHub', tagline: 'Discover. Share. Learn. Grow.', requireApproval: false, allowGuestDownloads: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { siteName, tagline, requireApproval, allowGuestDownloads, contactEmail } = req.body;
    const [updated] = await db
      .insert(platformSettings)
      .values({
        id: 1,
        siteName: siteName || 'ScholarHub',
        tagline: tagline || 'Discover. Share. Learn. Grow.',
        requireApproval: !!requireApproval,
        allowGuestDownloads: allowGuestDownloads !== false,
        contactEmail: contactEmail || 'support@scholarhub.edu',
      })
      .onConflictDoUpdate({
        target: platformSettings.id,
        set: {
          siteName: siteName || 'ScholarHub',
          tagline: tagline || 'Discover. Share. Learn. Grow.',
          requireApproval: !!requireApproval,
          allowGuestDownloads: allowGuestDownloads !== false,
          contactEmail: contactEmail || 'support@scholarhub.edu',
        },
      })
      .returning();

    await logAdminAction(req.dbUser.id, 'update_settings', 'platform_settings', 1);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
});

// Admin: Audit Logs
app.get('/api/admin/logs', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await db
      .select({
        id: adminLogs.id,
        action: adminLogs.action,
        targetType: adminLogs.targetType,
        targetId: adminLogs.targetId,
        notes: adminLogs.notes,
        createdAt: adminLogs.createdAt,
        adminName: users.displayName,
      })
      .from(adminLogs)
      .leftJoin(users, eq(adminLogs.adminId, users.id))
      .orderBy(desc(adminLogs.createdAt))
      .limit(50);

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch logs' });
  }
});

// ---------------- VITE / FRONTEND SERVING ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScholarHub server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
