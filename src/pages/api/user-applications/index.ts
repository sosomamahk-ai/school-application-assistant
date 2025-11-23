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
    // Get user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get all applications from Application table
    const allApplications = await prisma.application.findMany({
      where: { profileId: profile.id },
      include: {
        template: {
          select: {
            schoolId: true,
            schoolName: true,
            program: true,
            category: true
          }
        },
        userApplication: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get all UserApplication records
    const userApplications = await prisma.userApplication.findMany({
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
      }
    });

    // Create a map of applicationId -> UserApplication for quick lookup
    const userAppMap = new Map(
      userApplications.map(ua => [ua.applicationId, ua])
    );

    // Merge Application records with UserApplication records
    const mergedApplications = allApplications.map((app) => {
      const userApp = app.userApplication || userAppMap.get(app.id);
      const template = app.template;
      
      return {
        id: userApp?.id || app.id,
        schoolId: template.schoolId,
        localizedSchoolName: deserializeSchoolName(template.schoolName),
        program: template.program,
        category: template.category,
        applicationId: app.id,
        applicationStatus: app.status,
        fillingProgress: userApp?.fillingProgress ?? 0,
        interviewTime: userApp?.interviewTime,
        examTime: userApp?.examTime,
        result: (userApp?.result || 'pending') as 'pending' | 'admitted' | 'rejected' | 'waitlisted',
        resultTime: userApp?.resultTime,
        notes: userApp?.notes,
        reminderSettings: userApp?.reminderSettings,
        updatedAt: app.updatedAt.toISOString(),
        templateId: app.templateId
      };
    });

    return res.status(200).json({
      success: true,
      applications: mergedApplications
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


