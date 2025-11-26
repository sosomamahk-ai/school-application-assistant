import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';
import {
  PROFILE_TYPES,
  type ProfileCategory,
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

    // Only load schools that have been mapped to WordPress (wpId is present)
    const schools = await prisma.school.findMany({
      where: {
        wpId: {
          not: null
        }
      },
      select: templateListSchoolSelect,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const groupedProfiles = PROFILE_TYPES.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<ProfileCategory, any[]>
    );

    const statsByType = PROFILE_TYPES.reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<ProfileCategory, number>
    );

    schools.forEach((school) => {
      const profile = buildTemplateProfile(school);

      // Log mismatches between templateId and template relation for easier debugging
      if (process.env.NODE_ENV === 'development' && school.templateId && !school.template) {
        console.warn('[template-list] Mismatch: school has templateId but no template relation:', {
          schoolId: school.id,
          wpId: school.wpId,
          templateId: school.templateId
        });
      }
      if (process.env.NODE_ENV === 'development' && school.template && !school.templateId) {
        console.warn('[template-list] Mismatch: school has template relation but no templateId:', {
          schoolId: school.id,
          wpId: school.wpId,
          templateId: school.template.id
        });
      }

      groupedProfiles[profile.category].push(profile);
      statsByType[profile.category] += 1;
    });

    // Sort entries alphabetically within each category for consistency
    Object.keys(groupedProfiles).forEach((key) => {
      groupedProfiles[key as ProfileCategory].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-Hans-CN'));
    });

    const total = schools.length;
    // Count schools that have both templateId and template relation
    const withTemplate = schools.filter((school) => Boolean(school.templateId) && Boolean(school.template)).length;
    const withoutTemplate = total - withTemplate;

    // Log summary for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[template-list] Summary:', {
        total,
        withTemplate,
        withoutTemplate,
        schoolsWithTemplateIdOnly: schools.filter(s => s.templateId && !s.template).length,
        schoolsWithTemplateOnly: schools.filter(s => s.template && !s.templateId).length
      });
    }

    return res.status(200).json({
      success: true,
      profiles: groupedProfiles,
      stats: {
        total,
        withTemplate,
        withoutTemplate,
        byType: statsByType,
        unresolved: statsByType['unresolved_raw']
      }
    });
  } catch (error: any) {
    console.error('[API /admin/template-list] Error:', error);
    return res.status(500).json({
      error: 'Failed to load template data',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

