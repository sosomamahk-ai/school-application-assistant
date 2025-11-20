import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

/**
 * API route to proxy WordPress school data requests
 * This avoids CORS issues by making server-to-server requests
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await getWordPressSchools({ forceRefresh });
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[API /wordpress/schools] Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to fetch WordPress schools',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}

