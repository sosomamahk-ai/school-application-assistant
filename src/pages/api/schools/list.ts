import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get school data for templates (after sync every school should have templateId)
    const schools = await prisma.school.findMany({
      where: {
        templateId: {
          not: null
        }
      },
      select: {
        id: true,
        templateId: true,
        name: true,
        nameEnglish: true,
        shortName: true,
        nameShort: true,
        permalink: true,
        applicationStart: true,
        applicationEnd: true,
        country: true,
        location: true,
        bandType: true
      }
    });

    const schoolsMap = new Map<string, any>();
    schools.forEach((school) => {
      if (!school.templateId) {
        return;
      }
      const nameShortValue = school.nameShort || school.shortName || null;
      const nameEnglishValue = school.nameEnglish || null;
      schoolsMap.set(school.templateId, {
        id: school.id,
        templateId: school.templateId,
        name: school.name,
        nameEnglish: nameEnglishValue,
        name_english: nameEnglishValue,
        shortName: school.shortName,
        nameShort: nameShortValue,
        name_short: nameShortValue,
        permalink: school.permalink,
        applicationStart: school.applicationStart,
        applicationEnd: school.applicationEnd,
        country: school.country || null,
        location: school.location || null,
        bandType: school.bandType || null,
        band_type: school.bandType || null
      });
    });

    return res.status(200).json({
      success: true,
      schools: Array.from(schoolsMap.values())
    });
  } catch (error) {
    console.error('Schools list API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch schools list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

