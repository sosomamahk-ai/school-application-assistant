import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id, name } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    // Verify script exists
    const existingScript = await prisma.script.findUnique({
      where: { id: parseInt(id.toString()) }
    });

    if (!existingScript) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Update script
    const script = await prisma.script.update({
      where: { id: parseInt(id.toString()) },
      data: {
        name: name.trim()
      }
    });

    return res.status(200).json({
      success: true,
      script
    });
  } catch (error: any) {
    console.error('[API /admin/scripts/update] Error:', error);
    return res.status(500).json({
      error: 'Failed to update script',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

