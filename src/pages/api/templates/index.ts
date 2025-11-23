import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';

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
            category: true,
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
            schoolName: deserializeSchoolName(template.schoolName),
            program: template.program,
            description: template.description,
            category: template.category,
            fields: template.fieldsData
          }
        });
      }

      // Get all active templates
      // Simplified: only check isActive status, don't validate fieldsData structure
      // This ensures all enabled templates are shown in the school list
      const templates = await prisma.schoolFormTemplate.findMany({
        where: { 
          isActive: true
        },
        select: {
          id: true,
          schoolId: true,
          schoolName: true,
          program: true,
          description: true,
          category: true,
          fieldsData: true,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Debug logging
      console.log('[api/templates] Query result:', {
        totalCount: templates.length,
        templates: templates.map(t => ({
          id: t.id,
          schoolId: t.schoolId,
          schoolName: t.schoolName,
          isActive: t.isActive,
          category: t.category,
          hasFieldsData: !!t.fieldsData,
          fieldsDataType: Array.isArray(t.fieldsData) ? 'array' : typeof t.fieldsData
        }))
      });

      // Return all active templates regardless of fieldsData structure
      // This allows templates to be displayed even if fieldsData is empty or has different structures
      const response = {
        success: true,
        templates: templates.map(template => {
          // Ensure schoolName is properly deserialized
          const deserializedName = deserializeSchoolName(template.schoolName);
          
          return {
            id: template.id,
            schoolId: template.schoolId,
            schoolName: deserializedName,
            program: template.program,
            description: template.description,
            category: template.category,
            fields: template.fieldsData
          };
        })
      };

      console.log('[api/templates] Response:', {
        success: response.success,
        templateCount: response.templates.length,
        templateIds: response.templates.map(t => t.id),
        schoolNames: response.templates.map(t => ({
          id: t.id,
          schoolName: typeof t.schoolName === 'string' ? t.schoolName : JSON.stringify(t.schoolName),
          schoolNameType: typeof t.schoolName
        }))
      });

      res.status(200).json(response);
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

