import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
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
    const existingTemplate = await prisma.schoolFormTemplate.findUnique({
      where: { schoolId },
      select: {
        id: true,
        schoolName: true,
        program: true,
        fieldsData: true,
        isActive: true,
      },
    });

    const mergedFields = (() => {
      if (!existingTemplate?.fieldsData || !Array.isArray(existingTemplate.fieldsData)) {
        return fields;
      }

      const fieldMap = new Map<string, any>();
      existingTemplate.fieldsData.forEach((field: any) => {
        if (field?.key) {
          fieldMap.set(field.key, field);
        }
      });
      fields.forEach((field: any) => {
        if (field?.key) {
          fieldMap.set(field.key, { ...fieldMap.get(field.key), ...field });
        }
      });
      return Array.from(fieldMap.values());
    })();

    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId },
      update: {
        fieldsData: mergedFields as any,
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        schoolId,
        schoolName: schoolId.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        program: 'General',
        fieldsData: mergedFields as any,
        isActive: true,
        updatedAt: new Date(),
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

