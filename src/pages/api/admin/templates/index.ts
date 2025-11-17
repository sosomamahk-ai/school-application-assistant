import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证用户身份（所有登录用户都可以访问管理后台）
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 获取所有模板（包括禁用的）- 管理员专用
    const templates = await prisma.schoolFormTemplate.findMany({
      select: {
        id: true,
        schoolId: true,
        schoolName: true,
        program: true,
        description: true,
        category: true,
        fieldsData: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        schoolId: template.schoolId,
        schoolName: template.schoolName,
        program: template.program,
        description: template.description,
        category: template.category || null,
        fieldsData: template.fieldsData,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Admin templates API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

