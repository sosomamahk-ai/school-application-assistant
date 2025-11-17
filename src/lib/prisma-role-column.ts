import type { PrismaClient } from '@prisma/client';

let hasEnsuredRoleColumn = false;

function isRoleColumnMissingError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  if (err.code === 'P2022') {
    return true;
  }
  if (err.message) {
    const msg = err.message.toLowerCase();
    return msg.includes('role') && msg.includes('does not exist');
  }
  return false;
}

export async function ensureUserRoleColumn(prisma: PrismaClient) {
  if (hasEnsuredRoleColumn) return;

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "User" SET "role" = 'user' WHERE "role" IS NULL;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
    `);

    hasEnsuredRoleColumn = true;
    console.log('✅ Ensured "User.role" column exists in database');
  } catch (error) {
    console.error('❌ Failed to ensure "User.role" column exists:', error);
    throw error;
  }
}

export { isRoleColumnMissingError };

