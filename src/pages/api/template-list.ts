import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/template-list
 * Returns a mapping of school IDs to template list data (English name and name_short)
 * This endpoint is public and used by the /schools page to display template list data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all schools that have wpId (mapped to WordPress)
    const schools = await prisma.school.findMany({
      where: {
        wpId: {
          not: null
        }
      },
      select: {
        id: true,
        wpId: true,
        name: true,
        nameEnglish: true,
        nameShort: true,
        template: {
          select: {
            id: true,
            schoolId: true
          }
        }
      }
    });

    // Create a mapping by school ID and wpId
    const templateListMap: Record<string, {
      englishName: string;
      nameShort: string | null;
    }> = {};

    schools.forEach((school) => {
      // Get English name (column 2 from template-list): nameEnglish || name
      const englishName = school.nameEnglish || school.name || '';
      
      // Get name_short (column 3 from template-list): nameShort from school
      const nameShort = school.nameShort || null;

      // Map by school ID
      if (school.id) {
        templateListMap[school.id] = {
          englishName,
          nameShort
        };
      }

      // Also map by wpId if available
      if (school.wpId) {
        templateListMap[`wp_${school.wpId}`] = {
          englishName,
          nameShort
        };
      }

      // Map by template schoolId if available
      if (school.template?.schoolId) {
        templateListMap[school.template.schoolId] = {
          englishName,
          nameShort
        };
      }
    });

    return res.status(200).json({
      success: true,
      templateList: templateListMap
    });
  } catch (error) {
    console.error('[API /template-list] Error:', error);
    return res.status(500).json({
      error: 'Failed to load template list data',
      message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Internal server error'
    });
  }
}

