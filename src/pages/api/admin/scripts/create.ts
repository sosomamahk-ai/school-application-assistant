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

    const { schoolId, name } = req.body;

    if (!schoolId || !name) {
      return res.status(400).json({ error: 'schoolId and name are required' });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Create script
    const script = await prisma.script.create({
      data: {
        schoolId,
        name: name.trim()
      }
    });

    return res.status(200).json({
      success: true,
      script
    });
  } catch (error: any) {
    console.error('[API /admin/scripts/create] Error:', error);
    return res.status(500).json({
      error: 'Failed to create script',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

