/**
 * Create Master Template API
 * This endpoint creates the master template with all available fields
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { MASTER_TEMPLATE_DATA } from '@/data/master-template';
import { MASTER_TEMPLATE_PREFIX } from '@/constants/templates';
import { deserializeSchoolName, serializeSchoolName } from '@/utils/templates';

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

    const {
      schoolId,
      schoolName,
      program,
      description,
      category,
      isActive,
      fieldsData
    } = req.body || {};

    const trimmedSchoolId = typeof schoolId === 'string' ? schoolId.trim() : '';
    if (!trimmedSchoolId) {
      return res.status(400).json({ error: 'Missing required field: schoolId' });
    }

    if (!trimmedSchoolId.startsWith(MASTER_TEMPLATE_PREFIX)) {
      return res.status(400).json({
        error: `Master template schoolId must start with "${MASTER_TEMPLATE_PREFIX}".`
      });
    }

    // 准备模板数据，允许覆盖部分字段
    const templateData = {
      schoolId: trimmedSchoolId,
      schoolName: schoolName && typeof schoolName === 'object'
        ? schoolName
        : MASTER_TEMPLATE_DATA.schoolName,
      program: program || MASTER_TEMPLATE_DATA.program,
      description:
        typeof description === 'string' ? description : MASTER_TEMPLATE_DATA.description,
      category: category || MASTER_TEMPLATE_DATA.category,
      fieldsData:
        Array.isArray(fieldsData) && fieldsData.length > 0
          ? fieldsData
          : MASTER_TEMPLATE_DATA.fieldsData,
      isActive:
        typeof isActive === 'boolean'
          ? isActive
          : (MASTER_TEMPLATE_DATA.isActive !== undefined ? MASTER_TEMPLATE_DATA.isActive : false)
    };

    // 使用 upsert 来创建或更新主模板
    const schoolNameValue = serializeSchoolName(templateData.schoolName);

    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: templateData.schoolId },
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
      message: 'Master template created successfully',
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
    console.error('Master template creation error:', error);
    
    res.status(500).json({ 
      error: 'Failed to create master template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

