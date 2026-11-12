import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoURL?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      // Check if user is the designated admin email
      if (email === 'appiahkwamenyamekye@gmail.com' && existing[0].role !== 'admin') {
        const [updated] = await db.update(users)
          .set({ role: 'admin', updatedAt: new Date() })
          .where(eq(users.uid, uid))
          .returning();
        return updated;
      }
      return existing[0];
    }

    const usernameBase = (displayName || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 20);
    const username = `${usernameBase}_${Math.floor(Math.random() * 899 + 100)}`;
    const role = email === 'appiahkwamenyamekye@gmail.com' ? 'admin' : 'user';

    const result = await db.insert(users)
      .values({
        uid,
        email,
        username,
        displayName: displayName || usernameBase,
        avatarUrl: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
        role,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database operation failed in user resolution', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByUid:', error);
    throw new Error('Failed to fetch user by UID', { cause: error });
  }
}
