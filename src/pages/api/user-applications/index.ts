import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import { deserializeSchoolName } from '@/utils/templates';
import { parseWordPressTemplateId } from '@/services/wordpressSchoolService';
import { buildTemplateProfile, templateListSchoolSelect } from '@/server/templateProfiles';

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

    // Get all UserApplication records with school and template data
    // We need to fetch schools with the same fields as template-list for buildTemplateProfile
    const userApplications = await prisma.userApplication.findMany({
      where: { userId },
      include: {
        application: {
          include: { 
            template: {
              select: {
                schoolId: true,
                schoolName: true,
                program: true,
                category: true
              }
            }
          }
        },
        school: {
          select: templateListSchoolSelect
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Process each user application
    // Use buildTemplateProfile to get category, same as template-list
    const mergedApplications = userApplications.map((userApp) => {
      const app = userApp.application;
      const school = userApp.school;
      const appTemplate = app?.template;
      
      // Use buildTemplateProfile to get category (same logic as template-list)
      // This ensures consistency with template-list page
      let category: string = '未分类';
      if (school && school.wpId) {
        try {
          const profile = buildTemplateProfile(school);
          category = profile.category || '未分类';
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[user-applications] Category determined:', {
              schoolId: school.id,
              wpId: school.wpId,
              category,
              source: profile.classificationSource,
              school_profile_type: school.school_profile_type,
              profileType: school.profileType,
              postType: school.postType,
              templateCategory: school.template?.category
            });
          }
        } catch (error) {
          console.error('[user-applications] Error building template profile:', error, {
            schoolId: school?.id,
            wpId: school?.wpId
          });
          // Fallback to template.category if buildTemplateProfile fails
          if (school.template?.category) {
            category = school.template.category;
          } else if (appTemplate?.category) {
            category = appTemplate.category;
          }
        }
      } else {
        // If no wpId, fallback to application template category
        if (appTemplate?.category) {
          category = appTemplate.category;
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[user-applications] No wpId, using fallback category:', {
            schoolId: school?.id,
            category,
            appTemplateCategory: appTemplate?.category
          });
        }
      }
      
      return {
        id: userApp.id,
        schoolId: school?.id || appTemplate?.schoolId || '',
        wpid: school?.wpId || null,
        localizedSchoolName: appTemplate 
          ? deserializeSchoolName(appTemplate.schoolName)
          : (school?.name ? { 'zh-CN': school.name } : {}),
        nameEnglish: school?.nameEnglish || null,
        program: appTemplate?.program || null,
        category: category,
        applicationId: app?.id || null,
        applicationStatus: app?.status || null,
        fillingProgress: userApp.fillingProgress,
        interviewTime: userApp.interviewTime,
        examTime: userApp.examTime,
        result: (userApp.result || 'pending') as 'pending' | 'admitted' | 'rejected' | 'waitlisted',
        resultTime: userApp.resultTime,
        notes: userApp.notes,
        reminderSettings: userApp.reminderSettings,
        updatedAt: userApp.updatedAt.toISOString(),
        templateId: app?.templateId || null
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


