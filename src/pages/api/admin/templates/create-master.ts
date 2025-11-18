/**
 * Create Master Template API
 * This endpoint creates the master template with all available fields
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { MASTER_TEMPLATE_DATA } from '@/data/master-template';
import { MASTER_TEMPLATE_SCHOOL_ID } from '@/constants/templates';

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

    // 准备模板数据
    const templateData = {
      schoolId: MASTER_TEMPLATE_DATA.schoolId,
      schoolName: MASTER_TEMPLATE_DATA.schoolName,
      program: MASTER_TEMPLATE_DATA.program,
      description: MASTER_TEMPLATE_DATA.description,
      category: MASTER_TEMPLATE_DATA.category,
      fieldsData: MASTER_TEMPLATE_DATA.fieldsData,
      isActive: MASTER_TEMPLATE_DATA.isActive
    };

    // 使用 upsert 来创建或更新主模板
    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: MASTER_TEMPLATE_SCHOOL_ID },
      update: {
        schoolName: templateData.schoolName as any,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData as any,
        isActive: templateData.isActive,
        updatedAt: new Date()
      },
      create: {
        schoolId: templateData.schoolId,
        schoolName: templateData.schoolName as any,
        program: templateData.program,
        description: templateData.description || null,
        category: templateData.category || null,
        fieldsData: templateData.fieldsData as any,
        isActive: templateData.isActive
      }
    });

    res.status(200).json({
      success: true,
      message: 'Master template created successfully',
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
    console.error('Master template creation error:', error);
    
    res.status(500).json({ 
      error: 'Failed to create master template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

