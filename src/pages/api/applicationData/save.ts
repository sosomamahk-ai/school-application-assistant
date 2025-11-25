import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

/**
 * POST /api/applicationData/save
 * 保存学生填写的学校申请资料
 * 
 * 请求体:
 * {
 *   "schoolId": "oxford_msc_cs",
 *   "userId": "user_123",
 *   "data": { ... }
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { schoolId, userId: paramUserId, data } = req.body;

    if (!schoolId || !paramUserId || !data) {
      return res.status(400).json({ 
        error: 'schoolId, userId, and data are required',
        example: {
          schoolId: "oxford_msc_cs",
          userId: "user_123",
          data: {
            personal_statement: "xxx",
            cv: "https://cdn/cv123.pdf"
          }
        }
      });
    }

    // 验证用户身份
    const authenticatedUserId = await authenticate(req);
    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 确保用户只能保存自己的数据
    if (authenticatedUserId !== paramUserId) {
      return res.status(403).json({ error: 'Forbidden: Cannot save data for other user' });
    }

    // 验证 data 是对象
    if (typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an object' });
    }

    // 保存或更新申请资料
    const applicationData = await prisma.applicationData.upsert({
      where: {
        schoolId_userId: {
          schoolId,
          userId: paramUserId,
        },
      },
      update: {
        data: data as any,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        schoolId,
        userId: paramUserId,
        data: data as any,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ 
      status: 'ok',
      applicationData: {
        id: applicationData.id,
        schoolId: applicationData.schoolId,
        userId: applicationData.userId,
        updatedAt: applicationData.updatedAt,
      }
    });
  } catch (error) {
    console.error('saveApplicationData error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

