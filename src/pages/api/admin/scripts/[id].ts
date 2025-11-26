import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id parameter is required' });
    }

    const scriptId = parseInt(id);

    if (isNaN(scriptId)) {
      return res.status(400).json({ error: 'Invalid script id' });
    }

    // Verify script exists
    const existingScript = await prisma.script.findUnique({
      where: { id: scriptId }
    });

    if (!existingScript) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Delete script
    await prisma.script.delete({
      where: { id: scriptId }
    });

    return res.status(200).json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error: any) {
    console.error('[API /admin/scripts/[id]] Error:', error);
    return res.status(500).json({
      error: 'Failed to delete script',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

