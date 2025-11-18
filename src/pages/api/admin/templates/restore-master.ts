/**
 * Restore Master Template API
 * This endpoint restores the master template from the JSON file
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { MASTER_TEMPLATE_SCHOOL_ID } from '@/constants/templates';
import { deserializeSchoolName, serializeSchoolName } from '@/utils/templates';
import { MASTER_TEMPLATE_DATA } from '@/data/master-template';

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

    // 准备主模板数据
    const templateData = {
      schoolId: MASTER_TEMPLATE_DATA.schoolId,
      schoolName: MASTER_TEMPLATE_DATA.schoolName,
      program: MASTER_TEMPLATE_DATA.program,
      description: MASTER_TEMPLATE_DATA.description,
      category: MASTER_TEMPLATE_DATA.category,
      fieldsData: MASTER_TEMPLATE_DATA.fieldsData,
      isActive:
        MASTER_TEMPLATE_DATA.isActive !== undefined ? MASTER_TEMPLATE_DATA.isActive : false
    };

    // 使用 upsert 来恢复或更新主模板
    const schoolNameValue = serializeSchoolName(templateData.schoolName);

    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: MASTER_TEMPLATE_SCHOOL_ID },
      update: {
        schoolName: schoolNameValue,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData as any,
        isActive: templateData.isActive,
        updatedAt: new Date()
      },
      create: {
        schoolId: templateData.schoolId,
        schoolName: schoolNameValue,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData as any,
        isActive: templateData.isActive
      }
    });

    res.status(200).json({
      success: true,
      message: 'Master template restored successfully',
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
    console.error('Master template restore error:', error);
    
    res.status(500).json({ 
      error: 'Failed to restore master template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

