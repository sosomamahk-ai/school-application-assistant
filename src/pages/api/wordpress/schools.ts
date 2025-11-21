import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

/**
 * API route to proxy WordPress school data requests
 * This avoids CORS issues by making server-to-server requests
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set a longer timeout for this API route (2 minutes)
  req.setTimeout(120000);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true';
    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    
    if (!baseUrl) {
      console.error('[API /wordpress/schools] WordPress base URL not configured');
      return res.status(500).json({
        error: 'WordPress base URL is not configured on the server.',
        _debug: process.env.NODE_ENV === 'development' ? {
          message: 'Set WORDPRESS_BASE_URL or NEXT_PUBLIC_WORDPRESS_BASE_URL environment variable'
        } : undefined
      });
    }

    console.log('[API /wordpress/schools] Request received, forceRefresh:', forceRefresh);
    const startTime = Date.now();
    
    const data = await getWordPressSchools({ forceRefresh, baseUrl });
    
    const duration = Date.now() - startTime;
    console.log('[API /wordpress/schools] Data fetched in', duration, 'ms:', {
      profilesCount: data?.profiles?.length || 0,
      universitiesCount: data?.universities?.length || 0,
      allCount: data?.all?.length || 0
    });
    
    if (!data || (!data.profiles?.length && !data.universities?.length && !data.all?.length)) {
      console.warn('[API /wordpress/schools] Empty data returned');
      return res.status(200).json({
        profiles: [],
        universities: [],
        all: [],
        _debug: process.env.NODE_ENV === 'development' ? {
          baseUrl,
          message: 'No schools found. Check WordPress API endpoint and ACF fields.'
        } : undefined
      });
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[API /wordpress/schools] Error:', error);
    const errorMessage = error?.message || 'Failed to fetch WordPress schools';
    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}

