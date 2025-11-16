import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { templateId } = req.query;

  if (typeof templateId !== 'string') {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  if (req.method === 'GET') {
    try {
      const template = await prisma.schoolFormTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.status(200).json({
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
      console.error('Template fetch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

