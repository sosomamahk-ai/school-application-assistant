import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { deserializeSchoolName } from '@/utils/templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证用户身份 - 只有管理员可以访问
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // 获取所有模板（包括禁用的）- 管理员专用
    const templates = await prisma.schoolFormTemplate.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`[Admin Templates API] Found ${templates.length} templates`);
    templates.forEach(t => {
      console.log(`  - ${t.schoolId}: ${t.schoolName} (isActive: ${t.isActive})`);
    });

    const result = {
      success: true,
      templates: templates.map(template => ({
        id: template.id,
        schoolId: template.schoolId,
        schoolName: deserializeSchoolName(template.schoolName),
        program: template.program,
        description: template.description,
        category: (template as any).category || null,
        fieldsData: template.fieldsData,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      }))
    };

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Admin templates API error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    });
  }
}

