import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

function buildUserWhere(query: NextApiRequest['query']): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  const { search, role } = query;

  const searchValue = Array.isArray(search) ? search[0] : search;
  const roleValue = Array.isArray(role) ? role[0] : role;

  if (searchValue && searchValue.trim().length > 0) {
    where.OR = [
      { email: { contains: searchValue.trim(), mode: 'insensitive' } },
      { username: { contains: searchValue.trim(), mode: 'insensitive' } },
      { profile: { fullName: { contains: searchValue.trim(), mode: 'insensitive' } } }
    ];
  }

  if (roleValue === 'admin' || roleValue === 'user') {
    where.role = roleValue;
  }

  return where;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    const where = buildUserWhere(req.query);

    const users = await prisma.user.findMany({
      where,
      include: {
        profile: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        fullName: user.profile?.fullName || null
      }))
    });
  } catch (error: any) {
    console.error('Admin users list error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

