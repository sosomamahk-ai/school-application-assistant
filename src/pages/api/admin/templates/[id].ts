import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证管理员权限
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.query;

    // Check if template exists
    const template = await prisma.schoolFormTemplate.findUnique({
      where: { id: id as string }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Delete the template - all templates can be deleted, including system-generated ones
    await prisma.schoolFormTemplate.delete({
      where: { id: id as string }
    });

    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template delete error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

