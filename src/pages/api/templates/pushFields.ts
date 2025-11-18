import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

/**
 * POST /api/templates/pushFields
 * 上传学校的字段模板
 * 
 * 请求体:
 * {
 *   "schoolId": "oxford_msc_cs",
 *   "fields": [
 *     {"key": "personal_statement", "label": "Personal Statement", "type": "text"},
 *     {"key": "cv", "label": "CV Upload", "type": "file"}
 *   ]
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
    // 可选：验证用户身份（如果需要权限控制）
    // const userId = await authenticate(req);
    // if (!userId) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const { schoolId, fields } = req.body;

    if (!schoolId || !Array.isArray(fields)) {
      return res.status(400).json({ 
        error: 'schoolId and fields array are required',
        example: {
          schoolId: "oxford_msc_cs",
          fields: [
            { key: "personal_statement", label: "Personal Statement", type: "text" },
            { key: "cv", label: "CV Upload", type: "file" }
          ]
        }
      });
    }

    // 验证字段格式
    for (const field of fields) {
      if (!field.key || !field.label || !field.type) {
        return res.status(400).json({ 
          error: 'Each field must have key, label, and type',
          invalidField: field
        });
      }
    }

    // 查找或创建学校模板
    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId },
      update: {
        fieldsData: fields as any,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        schoolName: schoolId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        program: 'General',
        fieldsData: fields as any,
        isActive: true,
      },
    });

    return res.status(200).json({ 
      status: 'ok',
      template: {
        schoolId: template.schoolId,
        fields: template.fieldsData,
      }
    });
  } catch (error) {
    console.error('pushFields error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

