import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    // Check if template exists
    const template = await prisma.schoolFormTemplate.findUnique({
      where: { id: id as string }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Delete the template
    await prisma.schoolFormTemplate.delete({
      where: { id: id as string }
    });

    res.status(200).json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Template delete error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
}

