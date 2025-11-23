import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to check template status
 * GET /api/admin/templates/debug
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Get all templates (including inactive)
    const allTemplates = await prisma.schoolFormTemplate.findMany({
      select: {
        id: true,
        schoolId: true,
        schoolName: true,
        program: true,
        category: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        fieldsData: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get active templates only
    const activeTemplates = allTemplates.filter(t => t.isActive === true);

    // Analyze fieldsData
    const templatesWithAnalysis = allTemplates.map(template => {
      const fieldsData = template.fieldsData;
      let fieldsDataInfo: any = {
        isNull: fieldsData === null,
        isUndefined: fieldsData === undefined,
        type: typeof fieldsData,
        isEmpty: false
      };

      if (fieldsData === null || fieldsData === undefined) {
        fieldsDataInfo.isEmpty = true;
      } else if (Array.isArray(fieldsData)) {
        fieldsDataInfo.isEmpty = fieldsData.length === 0;
        fieldsDataInfo.length = fieldsData.length;
      } else if (typeof fieldsData === 'object') {
        fieldsDataInfo.isEmpty = Object.keys(fieldsData).length === 0;
        fieldsDataInfo.keysCount = Object.keys(fieldsData).length;
      }

      return {
        id: template.id,
        schoolId: template.schoolId,
        schoolName: template.schoolName,
        program: template.program,
        category: template.category,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        fieldsDataInfo
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        total: allTemplates.length,
        active: activeTemplates.length,
        inactive: allTemplates.length - activeTemplates.length
      },
      templates: templatesWithAnalysis,
      message: `Found ${allTemplates.length} total templates, ${activeTemplates.length} active`
    });
  } catch (error: any) {
    console.error('Debug API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

