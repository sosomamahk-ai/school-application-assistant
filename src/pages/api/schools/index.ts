import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';

const normalizeJsonArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => Boolean(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[\r\n]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const schools = await prisma.school.findMany({
      include: {
        template: {
          select: {
            id: true,
            schoolId: true,
            schoolName: true,
            program: true,
            category: true,
            applicationStartDate: true,
            applicationEndDate: true
          }
        }
      },
      orderBy: [
        { applicationEnd: 'asc' },
        { applicationStart: 'asc' },
        { updatedAt: 'desc' }
      ]
    });

    return res.status(200).json({
      success: true,
      schools: schools.map((school) => {
        const nameShortValue = school.nameShort || school.shortName || null;
        const nameEnglishValue = school.nameEnglish || null;
        return {
          id: school.id,
          templateId: school.templateId,
          templateSchoolId: school.template?.schoolId || null,
          name: school.name,
          nameEnglish: nameEnglishValue,
          name_english: nameEnglishValue,
          schoolName: school.template ? deserializeSchoolName(school.template.schoolName) : school.name,
          program: school.template?.program || null,
          category: school.template?.category || school.profileType || null,
          nameShort: nameShortValue,
          name_short: nameShortValue,
          country: school.country || null,
          location: school.location || null,
          bandType: school.bandType || null,
          band_type: school.bandType || null,
          campusLocation: school.campusLocation,
          gradeRange: school.gradeRange,
          applicationStart: school.applicationStart || school.template?.applicationStartDate || null,
          applicationEnd: school.applicationEnd || school.template?.applicationEndDate || null,
          interviewTime: school.interviewTime,
          examTime: school.examTime,
          resultTime: school.resultTime,
          applicationMaterials: normalizeJsonArray(school.requiredDocuments),
          applicationRequirements: normalizeJsonArray(school.requirements),
          officialLink: (school as any).overviewWebsiteSchool || school.officialLink,
          permalink: school.permalink || null,
          applicationNotes: school.notes,
          metadataSource: school.metadataSource,
          metadataLastFetchedAt: school.metadataLastFetchedAt,
          wpId: school.wpId
        };
      })
    });
  } catch (error) {
    console.error('Failed to fetch schools', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}


