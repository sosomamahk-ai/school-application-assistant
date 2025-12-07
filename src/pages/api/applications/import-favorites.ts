import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { wpIds } = req.body;

    if (!Array.isArray(wpIds) || wpIds.length === 0) {
      return res.status(400).json({ error: 'Invalid wpIds' });
    }

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: 0
    };

    for (const wpId of wpIds) {
      try {
        // Find school by wpId
        const school = await prisma.school.findFirst({
          where: { wpId: Number(wpId) },
          include: { template: true }
        });

        if (!school) {
          console.warn(`School with wpId ${wpId} not found`);
          results.errors++;
          continue;
        }

        let templateId = school.templateId;

        // If no template, create a default one
        if (!templateId) {
             // Check if a template exists for this schoolId but not linked (just in case)
             const existingTemplate = await prisma.schoolFormTemplate.findUnique({
                 where: { schoolId: school.id }
             });

             if (existingTemplate) {
                 templateId = existingTemplate.id;
                 // Link it back
                 await prisma.school.update({
                    where: { id: school.id },
                    data: { templateId: templateId }
                 });
             } else {
                 // Create a default template for this school
                 const newTemplateId = randomUUID();
                 await prisma.schoolFormTemplate.create({
                    data: {
                        id: newTemplateId,
                        schoolId: school.id,
                        schoolName: school.name,
                        program: 'General Application',
                        fieldsData: [], // Empty fields
                        updatedAt: new Date()
                    }
                 });
                 
                 // Link school to template
                 await prisma.school.update({
                    where: { id: school.id },
                    data: { templateId: newTemplateId }
                 });
                 
                 templateId = newTemplateId;
             }
        }

        if (!templateId) {
            results.errors++;
            continue;
        }

        // Check if application already exists
        const existingApp = await prisma.application.findFirst({
          where: {
            profileId: profile.id,
            templateId: templateId
          }
        });

        if (existingApp) {
          results.skipped++;
          continue;
        }

        // Create application
        const newApp = await prisma.application.create({
          data: {
            id: randomUUID(),
            profileId: profile.id,
            templateId: templateId,
            formData: {},
            status: 'draft',
            updatedAt: new Date()
          }
        });

        // Ensure UserApplication exists
        await prisma.userApplication.upsert({
          where: {
            userId_schoolId: {
              userId,
              schoolId: school.id
            }
          },
          update: {
            applicationId: newApp.id,
            updatedAt: new Date()
          },
          create: {
            id: randomUUID(),
            userId,
            schoolId: school.id,
            applicationId: newApp.id,
            fillingProgress: 0,
            result: 'pending',
            updatedAt: new Date()
          }
        });

        results.created++;

      } catch (error) {
        console.error(`Error processing wpId ${wpId}:`, error);
        results.errors++;
      }
    }

    res.status(200).json({ success: true, results });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
