import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

/**
 * GET /api/applicationData/:schoolId/:userId
 * 获取学生为该学校填写的申请资料
 * 
 * 返回:
 * {
 *   "personal_statement": "xxx",
 *   "cv": "https://cdn/cv123.pdf"
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { schoolId, userId: paramUserId } = req.query;

    if (!schoolId || typeof schoolId !== 'string') {
      return res.status(400).json({ error: 'schoolId is required' });
    }

    if (!paramUserId || typeof paramUserId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    // 验证用户身份（确保只能访问自己的数据）
    const authenticatedUserId = await authenticate(req);
    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 确保用户只能访问自己的数据
    if (authenticatedUserId !== paramUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot access other user\'s data' });
    }

    // 查找申请资料
    const applicationData = await prisma.applicationData.findUnique({
      where: {
        schoolId_userId: {
          schoolId,
          userId: paramUserId,
        },
      },
    });

    if (!applicationData) {
      return res.status(404).json({ 
        error: 'Application data not found',
        schoolId,
        userId: paramUserId
      });
    }

    // 返回数据（data 字段是 Json 类型）
    return res.status(200).json(applicationData.data);
  } catch (error) {
    console.error('getApplicationData error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

