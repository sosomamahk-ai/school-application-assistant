import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { schoolId } = req.query;

    if (!schoolId || typeof schoolId !== 'string') {
      return res.status(400).json({ error: 'schoolId query parameter is required' });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Get scripts for this school
    const scripts = await prisma.script.findMany({
      where: {
        schoolId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      scripts
    });
  } catch (error: any) {
    console.error('[API /admin/scripts/list] Error:', error);
    return res.status(500).json({
      error: 'Failed to list scripts',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

