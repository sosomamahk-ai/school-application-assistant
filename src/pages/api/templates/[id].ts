import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const template = await prisma.schoolFormTemplate.findUnique({
      where: { id: id as string }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(200).json({ template });
  } catch (error) {
    console.error('Template fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
}

