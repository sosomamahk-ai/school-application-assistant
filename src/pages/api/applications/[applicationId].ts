import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import {
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

    const { applicationId } = req.query;

    if (typeof applicationId !== 'string') {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    // Get user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (req.method === 'GET') {
      // Get specific application
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          profileId: profile.id
        },
        include: {
          template: true
        }
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const existingFormData = normalizeStructuredFormData(application.formData);
      const templateStructure = normalizeTemplateStructureInput(application.template.fieldsData);
      const formData = ensureFormDataStructure(existingFormData, templateStructure);
      const hasStructure = Boolean(existingFormData?.__structure);

      if (!hasStructure && formData !== application.formData) {
        try {
          await prisma.application.update({
            where: { id: application.id },
            data: { formData }
          });
        } catch (err) {
          console.warn('Failed to persist form structure for application', application.id, err);
        }
      }

      res.status(200).json({
        success: true,
        application: {
          id: application.id,
          template: {
            id: application.template.id,
            schoolId: application.template.schoolId,
            schoolName: deserializeSchoolName(application.template.schoolName),
            program: application.template.program,
            description: application.template.description,
            fields: application.template.fieldsData
          },
          formData,
          status: application.status,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
          submittedAt: application.submittedAt
        }
      });
    } else if (req.method === 'PUT') {
      // Update application
      const { formData, status } = req.body;

      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          profileId: profile.id
        },
        include: {
          template: {
            select: {
              fieldsData: true
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const payloadFormData = normalizeStructuredFormData(formData);
      const templateStructure = normalizeTemplateStructureInput(application.template?.fieldsData);
      const nextFormData =
        formData !== undefined
          ? ensureFormDataStructure(payloadFormData, templateStructure)
          : undefined;

      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: {
          formData: nextFormData,
          status: status || undefined,
          submittedAt: status === 'submitted' ? new Date() : undefined
        }
      });

      res.status(200).json({
        success: true,
        application: {
          id: updated.id,
          formData: updated.formData,
          status: updated.status,
          submittedAt: updated.submittedAt
        }
      });
    } else if (req.method === 'DELETE') {
      // Delete application
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          profileId: profile.id
        }
      });

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      await prisma.application.delete({
        where: { id: applicationId }
      });

      res.status(200).json({
        success: true,
        message: 'Application deleted'
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Application API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

