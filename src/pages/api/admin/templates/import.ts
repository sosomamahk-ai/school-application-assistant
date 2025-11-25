import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { serializeSchoolName, deserializeSchoolName } from '@/utils/templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证管理员权限
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    let templateData = req.body;

    // 移除不应该被导入的字段（如 id, createdAt, updatedAt）
    const { id, createdAt, updatedAt, ...cleanTemplateData } = templateData as any;

    // 验证必需字段
    if (!cleanTemplateData.schoolId || !cleanTemplateData.schoolName || !cleanTemplateData.program) {
      return res.status(400).json({ error: 'Missing required fields: schoolId, schoolName, program' });
    }

    // 确保 fieldsData 是数组
    const fieldsData = cleanTemplateData.fieldsData || cleanTemplateData.fields || [];

    // 如果存在相同 schoolId，则更新；否则创建新记录
    const schoolNameValue = serializeSchoolName(cleanTemplateData.schoolName);

    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: cleanTemplateData.schoolId },
      update: {
        schoolName: schoolNameValue,
        program: cleanTemplateData.program,
        description: cleanTemplateData.description || null,
        category: cleanTemplateData.category || null,
        fieldsData: fieldsData as any,
        isActive: cleanTemplateData.isActive !== undefined ? cleanTemplateData.isActive : true,
        updatedAt: new Date()
      },
      create: {
        id: cleanTemplateData.schoolId || randomUUID(),
        schoolId: cleanTemplateData.schoolId,
        schoolName: schoolNameValue,
        program: cleanTemplateData.program,
        description: cleanTemplateData.description || null,
        category: cleanTemplateData.category || null,
        fieldsData: fieldsData as any,
        isActive: cleanTemplateData.isActive !== undefined ? cleanTemplateData.isActive : true,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Template imported successfully',
      template: {
        id: template.id,
        schoolId: template.schoolId,
        schoolName: deserializeSchoolName(template.schoolName),
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
