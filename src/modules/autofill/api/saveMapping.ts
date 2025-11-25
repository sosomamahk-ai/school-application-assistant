import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

export default async function saveMappingHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Authenticate
  const userId = await authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2) Validate body
  const { domain, selector, profileField, domId, domName } = req.body;

  if (!domain || !selector || !profileField) {
    return res.status(400).json({ error: 'domain, selector and profileField required' });
  }

  try {
    // 3) Fix the missing userId issue
    const mapping = await prisma.fieldMapping.upsert({
      where: {
        userId_domain_selector: {
          userId,
          domain,
          selector,
        },
      },
      update: {
        profileField,
        domId,
        domName,
      },
      create: {
        id: randomUUID(),
        userId,
        domain,
        selector,
        profileField,
        domId,
        domName,
      },
    });

    return res.json({ success: true, mapping });
  } catch (error) {
    console.error('saveMapping error:', error);
    return res.status(500).json({ error: 'Server error', details: String(error) });
  }
}

