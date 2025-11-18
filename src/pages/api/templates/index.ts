import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { schoolId } = req.query;

      // If schoolId is provided, get specific template (including inactive ones for main template)
      if (schoolId && typeof schoolId === 'string') {
        const template = await prisma.schoolFormTemplate.findUnique({
          where: { schoolId },
          select: {
            id: true,
            schoolId: true,
            schoolName: true,
            program: true,
            description: true,
            fieldsData: true
          }
        });

        if (!template) {
          return res.status(404).json({ error: 'Template not found' });
        }

        return res.status(200).json({
          success: true,
          template: {
            id: template.id,
            schoolId: template.schoolId,
            schoolName: template.schoolName,
            program: template.program,
            description: template.description,
            fields: template.fieldsData
          }
        });
      }

      // Get all active templates
      const templates = await prisma.schoolFormTemplate.findMany({
        where: { isActive: true },
        select: {
          id: true,
          schoolId: true,
          schoolName: true,
          program: true,
          description: true,
          fieldsData: true
        }
      });

      res.status(200).json({
        success: true,
        templates: templates.map(template => ({
          id: template.id,
          schoolId: template.schoolId,
          schoolName: template.schoolName,
          program: template.program,
          description: template.description,
          fields: template.fieldsData
        }))
      });
    } catch (error) {
      console.error('Templates API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      // Create new template (admin function)
      const { schoolId, schoolName, program, description, fields } = req.body;

      if (!schoolId || !schoolName || !program || !fields) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const template = await prisma.schoolFormTemplate.create({
        data: {
          schoolId,
          schoolName,
          program,
          description,
          fieldsData: fields
        }
      });

      res.status(201).json({
        success: true,
        template: {
          id: template.id,
          schoolId: template.schoolId,
          schoolName: template.schoolName,
          program: template.program,
          description: template.description,
          fields: template.fieldsData
        }
      });
    } catch (error) {
      console.error('Template creation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

