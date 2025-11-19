import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// In production (Vercel), we also reuse the client to avoid connection pool exhaustion.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Reuse Prisma Client in all environments to prevent connection pool exhaustion
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Ensure Prisma Client connects on initialization in production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch((error) => {
    console.error('Failed to connect to database on initialization:', error);
  });
}

export default prisma;

