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
    // 验证用户身份
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const templateData = req.body;

    // 验证必需字段
    if (!templateData.schoolId || !templateData.schoolName || !templateData.program) {
      return res.status(400).json({ error: 'Missing required fields: schoolId, schoolName, program' });
    }

    // 如果存在相同 schoolId，则更新；否则创建新记录
    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: templateData.schoolId },
      update: {
        schoolName: templateData.schoolName,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData || templateData.fields || [],
        isActive: templateData.isActive !== undefined ? templateData.isActive : true,
        updatedAt: new Date()
      },
      create: {
        schoolId: templateData.schoolId,
        schoolName: templateData.schoolName,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData || templateData.fields || [],
        isActive: templateData.isActive !== undefined ? templateData.isActive : true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Template imported successfully',
      template: {
        id: template.id,
        schoolId: template.schoolId,
        schoolName: template.schoolName,
        program: template.program,
        description: template.description,
        category: template.category,
        isActive: template.isActive
      }
    });
  } catch (error: any) {
    console.error('Template import error:', error);
    
    // 处理唯一约束冲突
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Template with this schoolId already exists. Use update instead.' 
      });
    }
    
    res.status(500).json({ error: 'Failed to import template' });
  }
}
