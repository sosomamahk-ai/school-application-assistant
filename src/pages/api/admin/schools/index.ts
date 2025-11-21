import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

type AdminSchoolRow = {
  id?: string;
  templateId: string;
  name?: string;
  shortName?: string | null;
  campusLocation?: string | null;
  gradeRange?: string | null;
  applicationStart?: string | null;
  applicationEnd?: string | null;
  interviewTime?: string | null;
  examTime?: string | null;
  resultTime?: string | null;
  officialLink?: string | null;
  requiredDocuments?: string[] | string | null;
  requirements?: string[] | string | null;
  notes?: string | null;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed
    .replace(/[年/]/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeTextArray = (value?: string[] | string | null): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  }
  const cleaned = value
    .split(/[\n;,，；]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : undefined;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      try {
        const { search } = req.query;
        const searchValue = typeof search === 'string' ? search.trim() : '';
        const where: Prisma.SchoolWhereInput | undefined = searchValue
          ? {
              OR: [
                { name: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                { shortName: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
                { template: { schoolId: { contains: searchValue, mode: Prisma.QueryMode.insensitive } } },
                { template: { program: { contains: searchValue, mode: Prisma.QueryMode.insensitive } } }
              ]
            }
          : undefined;

        const schools = await prisma.school.findMany({
          where,
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
          orderBy: { updatedAt: 'desc' }
        });

        return res.status(200).json({ success: true, schools });
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch schools',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

  if (req.method === 'POST') {
    const { rows } = req.body as { rows?: AdminSchoolRow[] };
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided' });
    }

    try {
      const operations = rows.map((row) =>
        prisma.school.upsert({
          where: { templateId: row.templateId },
          update: {
            name: row.name ?? undefined,
            shortName: row.shortName ?? undefined,
            campusLocation: row.campusLocation ?? undefined,
            gradeRange: row.gradeRange ?? undefined,
            applicationStart: parseDate(row.applicationStart) ?? undefined,
            applicationEnd: parseDate(row.applicationEnd) ?? undefined,
            interviewTime: parseDate(row.interviewTime) ?? undefined,
            examTime: parseDate(row.examTime) ?? undefined,
            resultTime: parseDate(row.resultTime) ?? undefined,
            officialLink: row.officialLink ?? undefined,
            requiredDocuments: normalizeTextArray(row.requiredDocuments),
            requirements: normalizeTextArray(row.requirements),
            notes: row.notes ?? undefined
          },
          create: {
            name: row.name || '未命名学校',
            shortName: row.shortName ?? row.name ?? null,
            templateId: row.templateId,
            campusLocation: row.campusLocation ?? undefined,
            gradeRange: row.gradeRange ?? undefined,
            applicationStart: parseDate(row.applicationStart) ?? undefined,
            applicationEnd: parseDate(row.applicationEnd) ?? undefined,
            interviewTime: parseDate(row.interviewTime) ?? undefined,
            examTime: parseDate(row.examTime) ?? undefined,
            resultTime: parseDate(row.resultTime) ?? undefined,
            officialLink: row.officialLink ?? undefined,
            requiredDocuments: normalizeTextArray(row.requiredDocuments),
            requirements: normalizeTextArray(row.requirements),
            notes: row.notes ?? undefined,
            metadataSource: 'manual'
          }
        })
      );

      const updated = await Promise.all(operations);
      return res.status(200).json({ success: true, count: updated.length });
    } catch (error) {
      console.error('Bulk import failed', error);
      return res.status(500).json({ error: 'Failed to import schools' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, ...row } = req.body as AdminSchoolRow;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }

    try {
      const updated = await prisma.school.update({
        where: { id },
        data: {
          name: row.name ?? undefined,
          shortName: row.shortName ?? undefined,
          templateId: row.templateId ?? undefined,
          campusLocation: row.campusLocation ?? undefined,
          gradeRange: row.gradeRange ?? undefined,
          applicationStart: parseDate(row.applicationStart) ?? undefined,
          applicationEnd: parseDate(row.applicationEnd) ?? undefined,
          interviewTime: parseDate(row.interviewTime) ?? undefined,
          examTime: parseDate(row.examTime) ?? undefined,
          resultTime: parseDate(row.resultTime) ?? undefined,
          officialLink: row.officialLink ?? undefined,
          requiredDocuments: normalizeTextArray(row.requiredDocuments),
          requirements: normalizeTextArray(row.requirements),
          notes: row.notes ?? undefined
        }
      });
      return res.status(200).json({ success: true, school: updated });
    } catch (error) {
      console.error('Failed to update school', error);
      return res.status(500).json({ error: 'Failed to update school' });
    }
  }

    if (req.method === 'DELETE') {
      const { id } = req.body as { id?: string };
      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      try {
        await prisma.school.delete({ where: { id } });
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Failed to delete school:', error);
        return res.status(500).json({ error: 'Failed to delete school' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


