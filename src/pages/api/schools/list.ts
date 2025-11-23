import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

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

    // Get all active templates
    const templates = await prisma.schoolFormTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        schoolId: true
      }
    });

    // Get schools data from School table
    const schools = await prisma.school.findMany({
      where: {
        templateId: {
          in: templates.map(t => t.id)
        }
      },
      select: {
        id: true,
        templateId: true,
        name: true,
        shortName: true,
        applicationStart: true,
        applicationEnd: true
      }
    });

    // Get WordPress data for name_short
    const wordPressData = await getWordPressSchools({ forceRefresh: false });
    const wpSchools = wordPressData.profiles || [];
    
    // Create a map of templateId -> school data
    const schoolsMap = new Map<string, any>();
    schools.forEach(school => {
      schoolsMap.set(school.templateId, {
        id: school.id,
        templateId: school.templateId,
        name: school.name,
        shortName: school.shortName,
        applicationStart: school.applicationStart,
        applicationEnd: school.applicationEnd
      });
    });

    // Enrich with WordPress name_short if available
    templates.forEach(template => {
      if (!schoolsMap.has(template.id)) {
        // Create entry if doesn't exist
        schoolsMap.set(template.id, {
          templateId: template.id,
          nameShort: null,
          applicationStart: null,
          applicationEnd: null
        });
      }

      const schoolEntry = schoolsMap.get(template.id)!;
      
      // Try to find WordPress school by parsing schoolId
      const wpMatch = template.schoolId.match(/^(?:wp-)?(profile|university)[-_]?(\d+)$/i);
      if (wpMatch) {
        const wpId = parseInt(wpMatch[2]);
        const wpType = wpMatch[1].toLowerCase() as 'profile' | 'university';
        
        const wpSchool = wpSchools.find(
          (wp: any) => wp.id === wpId && wp.type === wpType
        );

        if (wpSchool) {
          // Use WordPress name_short if School table doesn't have it
          if (!schoolEntry.shortName && wpSchool.acf?.name_short) {
            schoolEntry.shortName = wpSchool.acf.name_short;
          } else if (!schoolEntry.shortName && wpSchool.acf?.nameShort) {
            schoolEntry.shortName = wpSchool.acf.nameShort;
          }
        }
      }
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

