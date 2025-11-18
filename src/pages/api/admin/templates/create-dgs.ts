/**
 * Create DGS System Template API
 * This endpoint creates the Diocesan Girls' School system template
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { DGS_TEMPLATE_DATA } from '@/data/dgs-template';

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
      schoolId: DGS_TEMPLATE_DATA.schoolId,
      schoolName: DGS_TEMPLATE_DATA.schoolName,
      program: DGS_TEMPLATE_DATA.program,
      description: DGS_TEMPLATE_DATA.description,
      category: DGS_TEMPLATE_DATA.category,
      fieldsData: DGS_TEMPLATE_DATA.fieldsData,
      isActive: DGS_TEMPLATE_DATA.isActive
    };

    // 使用 upsert 来创建或更新系统模板
    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: DGS_TEMPLATE_DATA.schoolId },
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
      message: 'DGS system template created successfully',
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
    console.error('DGS template creation error:', error);
    
    res.status(500).json({ 
      error: 'Failed to create DGS system template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

