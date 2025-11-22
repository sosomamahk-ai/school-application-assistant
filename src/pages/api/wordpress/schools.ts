import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

/**
 * API route to proxy WordPress school data requests
 * This avoids CORS issues by making server-to-server requests
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set a longer timeout for this API route (3 minutes for large data)
  req.setTimeout(180000);
  
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
    console.error('[API /wordpress/schools] Error stack:', error?.stack);
    
    const errorMessage = error?.message || 'Failed to fetch WordPress schools';
    
    // Extract more details from the error message
    let details: any = {
      message: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      details.stack = error?.stack;
      details.rawError = String(error);
      details.baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    }
    
    // Check if it's a WordPress API error (contains "CPT responded")
    if (errorMessage.includes('CPT responded with 400')) {
      details.suggestion = 'WordPress API returned 400. This might be due to invalid parameters or endpoint configuration. Check if the CPT (profile/university) is properly registered in WordPress.';
    } else if (errorMessage.includes('CPT responded with 401')) {
      details.suggestion = 'WordPress API authentication failed. Check if the WordPress site allows public REST API access or if authentication is required.';
    } else if (errorMessage.includes('CPT responded with 403')) {
      details.suggestion = 'WordPress API access forbidden. The CPT might not be publicly accessible or requires authentication.';
    } else if (errorMessage.includes('CPT responded with 404')) {
      details.suggestion = 'WordPress CPT endpoint not found. Verify that the CPT (profile/university) is registered and accessible via REST API.';
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: details
    });
  }
}

