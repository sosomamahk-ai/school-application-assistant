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
            category: true
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
      schools: schools.map((school) => ({
        id: school.id,
        templateId: school.templateId,
        templateSchoolId: school.template.schoolId,
        name: school.name,
        schoolName: deserializeSchoolName(school.template.schoolName),
        program: school.template.program,
        category: school.template.category,
        nameShort: school.shortName,
        campusLocation: school.campusLocation,
        gradeRange: school.gradeRange,
        applicationStart: school.applicationStart,
        applicationEnd: school.applicationEnd,
        interviewTime: school.interviewTime,
        examTime: school.examTime,
        resultTime: school.resultTime,
        applicationMaterials: normalizeJsonArray(school.requiredDocuments),
        applicationRequirements: normalizeJsonArray(school.requirements),
        officialLink: (school as any).overviewWebsiteSchool || school.officialLink,
        permalink: (school as any).permalink || null,
        applicationNotes: school.notes,
        metadataSource: school.metadataSource,
        metadataLastFetchedAt: school.metadataLastFetchedAt
      }))
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


