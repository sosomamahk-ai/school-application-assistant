import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';
import {
  buildInitialApplicationFormData,
  deserializeSchoolName,
  ensureFormDataStructure,
  StructuredFormData,
  normalizeTemplateStructureInput
} from '@/utils/templates';
import { autoFillFormFromProfile } from '@/utils/formMatcher';
import { UserProfileData } from '@/types';

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

    // Get user's profile and user info
    const [profile, user] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
    ]);

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
              category: true,
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
          category: app.template.category,
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

      // Check if user already has an application for this template
      const existingApplication = await prisma.application.findFirst({
        where: {
          profileId: profile.id,
          templateId: templateId
        },
        include: {
          template: {
            select: {
              schoolId: true,
              schoolName: true,
              program: true
            }
          }
        }
      });

      // If application already exists, return it instead of creating a new one
      if (existingApplication) {
        return res.status(200).json({
          success: true,
          application: {
            id: existingApplication.id,
            templateId: existingApplication.templateId,
            templateSchoolId: existingApplication.template.schoolId,
            schoolName: deserializeSchoolName(existingApplication.template.schoolName),
            program: existingApplication.template.program,
            status: existingApplication.status,
            formData: existingApplication.formData
          },
          existing: true
        });
      }

      const templateStructure = normalizeTemplateStructureInput(template.fieldsData);
      const { formData: initialFormData } = buildInitialApplicationFormData(templateStructure);

      // Auto-fill form data from user profile
      const userProfile: Partial<UserProfileData> = {
        basicInfo: {
          fullName: profile.fullName || '',
          email: user?.email || '',
          phone: profile.phone || '',
          birthday: profile.birthday?.toISOString() || '',
          nationality: profile.nationality || ''
        },
        education: profile.educationData as any || [],
        experiences: profile.experiencesData as any || [],
        essays: profile.essaysData as any || {},
        additional: profile.additionalData as any || {}
      };

      // Extract fields from template structure for auto-fill
      const extractFields = (structure: any): any[] => {
        const fields: any[] = [];
        if (Array.isArray(structure)) {
          structure.forEach(item => {
            if (item.fields && Array.isArray(item.fields)) {
              fields.push(...item.fields);
            }
            if (item.tabs && Array.isArray(item.tabs)) {
              item.tabs.forEach((tab: any) => {
                if (tab.fields && Array.isArray(tab.fields)) {
                  fields.push(...tab.fields);
                }
              });
            }
            if (item.id && item.type) {
              fields.push(item);
            }
          });
        } else if (structure && typeof structure === 'object') {
          if (structure.fields && Array.isArray(structure.fields)) {
            fields.push(...structure.fields);
          }
          if (structure.tabs && Array.isArray(structure.tabs)) {
            structure.tabs.forEach((tab: any) => {
              if (tab.fields && Array.isArray(tab.fields)) {
                fields.push(...tab.fields);
              }
            });
          }
          if (structure.id && structure.type) {
            fields.push(structure);
          }
        }
        return fields;
      };

      const templateFields = extractFields(templateStructure);
      const autoFilledData = autoFillFormFromProfile(templateFields, userProfile);
      
      // Merge auto-filled data with initial form data
      const mergedFormData = {
        ...initialFormData,
        ...autoFilledData
      };

      const application = await prisma.application.create({
        data: {
          id: randomUUID(),
          profileId: profile.id,
          templateId,
          formData: mergedFormData,
          status: 'draft',
          updatedAt: new Date()
        },
        include: {
          template: {
            select: {
              schoolId: true,
              schoolName: true,
              program: true
            }
          }
        }
      });

      // Ensure a UserApplication record exists for tracking
      const school = await prisma.school.findUnique({
        where: { templateId },
        select: { id: true }
      });

      if (school) {
        await prisma.userApplication.upsert({
          where: {
            userId_schoolId: {
              userId,
              schoolId: school.id
            }
          },
          update: {
            applicationId: application.id,
            updatedAt: new Date()
          },
          create: {
            id: randomUUID(),
            userId,
            schoolId: school.id,
            applicationId: application.id,
            fillingProgress: 0,
            result: 'pending',
            updatedAt: new Date()
          }
        });
      }

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

