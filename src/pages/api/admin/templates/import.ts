import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

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

    const templateData = req.body;

    // Validate required fields
    if (!templateData.schoolId || !templateData.schoolName || !templateData.program) {
      return res.status(400).json({ 
        error: '缺少必需字段：schoolId, schoolName, program' 
      });
    }

    // Check if template with same schoolId already exists
    const existing = await prisma.schoolFormTemplate.findUnique({
      where: { schoolId: templateData.schoolId }
    });

    let template;

    if (existing) {
      // Update existing template
      template = await prisma.schoolFormTemplate.update({
        where: { schoolId: templateData.schoolId },
        data: {
          schoolName: templateData.schoolName,
          program: templateData.program,
          description: templateData.description || '',
          fieldsData: templateData.fieldsData || templateData.fields || [],
          isActive: templateData.isActive !== false,
        }
      });
    } else {
      // Create new template
      template = await prisma.schoolFormTemplate.create({
        data: {
          schoolId: templateData.schoolId,
          schoolName: templateData.schoolName,
          program: templateData.program,
          description: templateData.description || '',
          fieldsData: templateData.fieldsData || templateData.fields || [],
          isActive: templateData.isActive !== false,
        }
      });
    }

    res.status(200).json({
      success: true,
      template,
      message: existing ? '模板已更新' : '模板已创建'
    });
  } catch (error) {
    console.error('Template import error:', error);
    res.status(500).json({ 
      error: '导入失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

