/**
 * Restore Master Template API
 * This endpoint restores the master template from the JSON file
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { MASTER_TEMPLATE_SCHOOL_ID } from '@/constants/templates';
import fs from 'fs';
import path from 'path';

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

    // 读取主模板 JSON 文件
    const templatePath = path.join(process.cwd(), 'template-examples', 'master-template-all-fields.json');
    let masterTemplateData: any;
    
    try {
      const fileContent = fs.readFileSync(templatePath, 'utf-8');
      masterTemplateData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading master template file:', error);
      return res.status(500).json({ 
        error: 'Failed to read master template file',
        message: 'Master template JSON file not found or invalid'
      });
    }

    // 准备主模板数据
    const templateData = {
      schoolId: masterTemplateData.schoolId,
      schoolName: masterTemplateData.schoolName,
      program: masterTemplateData.program,
      description: masterTemplateData.description,
      category: masterTemplateData.category,
      fieldsData: masterTemplateData.fieldsData,
      isActive: masterTemplateData.isActive !== undefined ? masterTemplateData.isActive : false
    };

    // 使用 upsert 来恢复或更新主模板
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
      message: 'Master template restored successfully',
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
    console.error('Master template restore error:', error);
    
    res.status(500).json({ 
      error: 'Failed to restore master template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

