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

    // Delete all applications that use this template first
    // This is necessary because the foreign key constraint doesn't have onDelete: Cascade
    await prisma.application.deleteMany({
      where: { templateId: id as string }
    });

    // Delete the template - all templates can be deleted, including system-generated ones
    await prisma.schoolFormTemplate.delete({
      where: { id: id as string }
    });

    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Template delete error:', error);
    
    // Provide more specific error messages
    if (error?.code === 'P2003') {
      // Foreign key constraint error
      return res.status(400).json({ 
        error: 'Cannot delete template: There are applications using this template. Please delete them first or contact support.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete template',
      message: error?.message || 'Unknown error occurred'
    });
  }
}

