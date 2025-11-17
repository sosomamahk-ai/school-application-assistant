import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (id === authResult.userId) {
      return res.status(400).json({ error: 'Administrators cannot delete themselves' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      const otherAdminCount = await prisma.user.count({
        where: {
          role: 'admin',
          NOT: { id }
        }
      });

      if (otherAdminCount === 0) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

