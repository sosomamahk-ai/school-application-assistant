import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import {
  buildInitialApplicationFormData,
  deserializeSchoolName,
  ensureFormDataStructure,
  StructuredFormData,
  normalizeTemplateStructureInput
} from '@/utils/templates';

function normalizeStructuredFormData(value: unknown): StructuredFormData | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as StructuredFormData;
  }
  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (req.method === 'GET') {
      // Get all applications for this user
      const applications = await prisma.application.findMany({
        where: { profileId: profile.id },
        include: {
          template: {
            select: {
              id: true,
              schoolId: true,
              schoolName: true,
              program: true,
              fieldsData: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        applications: applications.map(app => ({
          id: app.id,
          templateId: app.templateId,
          templateSchoolId: app.template.schoolId,
          schoolName: deserializeSchoolName(app.template.schoolName),
          program: app.template.program,
          status: app.status,
          formData: ensureFormDataStructure(
            normalizeStructuredFormData(app.formData),
            normalizeTemplateStructureInput(app.template.fieldsData)
          ),
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          submittedAt: app.submittedAt
        }))
      });
    } else if (req.method === 'POST') {
      // Create new application
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({ error: 'Template ID is required' });
      }

      // Verify template exists
      const template = await prisma.schoolFormTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const templateStructure = normalizeTemplateStructureInput(template.fieldsData);
      const { formData: initialFormData } = buildInitialApplicationFormData(templateStructure);

      const application = await prisma.application.create({
        data: {
          profileId: profile.id,
          templateId,
          formData: initialFormData,
          status: 'draft'
        },
        include: {
          template: {
            select: {
              schoolName: true,
              program: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        application: {
          id: application.id,
          templateId: application.templateId,
          templateSchoolId: application.template.schoolId,
          schoolName: deserializeSchoolName(application.template.schoolName),
          program: application.template.program,
          status: application.status,
          formData: application.formData
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Applications API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

