import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';
import {
  templateListSchoolSelect,
  buildTemplateProfile
} from '@/server/templateProfiles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const term = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!term || term.length < 2) {
      return res.status(200).json({
        success: true,
        query: term,
        count: 0,
        results: []
      });
    }

    const schools = await prisma.school.findMany({
      where: {
        wpId: {
          not: null
        },
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { nameEnglish: { contains: term, mode: 'insensitive' } },
          { nameShort: { contains: term, mode: 'insensitive' } }
        ]
      },
      select: templateListSchoolSelect,
      orderBy: {
        updatedAt: 'desc'
      },
      take: 50
    });

    const results = schools.map(buildTemplateProfile);

    return res.status(200).json({
      success: true,
      query: term,
      count: results.length,
      results
    });
  } catch (error: any) {
    console.error('[API /admin/templates/search] Error:', error);
    return res.status(500).json({
      error: 'Failed to search templates',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}


