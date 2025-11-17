import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    const { id } = req.query;
    const { role } = req.body || {};

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Role must be admin or user' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === role) {
      return res.status(200).json({ success: true, message: 'Role unchanged' });
    }

    if (targetUser.role === 'admin' && role === 'user') {
      const otherAdminCount = await prisma.user.count({
        where: {
          role: 'admin',
          NOT: { id }
        }
      });

      if (otherAdminCount === 0) {
        return res.status(400).json({ error: 'Cannot remove the last admin' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      include: {
        profile: {
          select: { fullName: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.profile?.fullName || null,
        updatedAt: updatedUser.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Admin update role error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

