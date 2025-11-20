import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import { deserializeSchoolName } from '@/utils/templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const applications = await prisma.userApplication.findMany({
      where: { userId },
      include: {
        application: {
          include: { template: true }
        },
        school: {
          include: {
            template: {
              select: {
                schoolName: true,
                program: true,
                category: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      applications: applications.map((record) => ({
        id: record.id,
        schoolId: record.schoolId,
        schoolName: record.school?.name || record.school?.template?.schoolName || '',
        localizedSchoolName: record.school?.template
          ? deserializeSchoolName(record.school.template.schoolName)
          : record.application?.template
            ? deserializeSchoolName(record.application.template.schoolName)
            : record.school?.name,
        program: record.school?.template?.program || record.application?.template?.program,
        category: record.school?.template?.category,
        applicationId: record.applicationId,
        applicationStatus: record.application?.status,
        fillingProgress: record.fillingProgress,
        interviewTime: record.interviewTime,
        examTime: record.examTime,
        result: record.result,
        resultTime: record.resultTime,
        notes: record.notes,
        reminderSettings: record.reminderSettings,
        updatedAt: record.updatedAt,
        templateId: record.application?.templateId
      }))
    });
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing id' });
    }

    const updated = await prisma.userApplication.update({
      where: { id },
      data: {
        fillingProgress: typeof updates.fillingProgress === 'number' ? updates.fillingProgress : undefined,
        interviewTime: updates.interviewTime ? new Date(updates.interviewTime) : null,
        examTime: updates.examTime ? new Date(updates.examTime) : null,
        result: updates.result ?? undefined,
        resultTime: updates.resultTime ? new Date(updates.resultTime) : null,
        notes: updates.notes ?? undefined,
        reminderSettings: updates.reminderSettings ?? undefined
      },
      include: {
        application: true,
        school: { include: { template: true } }
      }
    });

    return res.status(200).json({ success: true, application: updated });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


