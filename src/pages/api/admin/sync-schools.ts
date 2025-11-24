import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { syncAllWPSchools } from '@/services/syncWPSchools';

/**
 * Admin API route to sync all WordPress schools to the database
 * 
 * This endpoint:
 * 1. Fetches ALL schools from WordPress REST API
 * 2. Upserts them into the School table
 * 3. Populates name_short, permalink, and other fields for ALL schools
 * 
 * Usage:
 * POST /api/admin/sync-schools
 * Headers: Authorization: Bearer <admin-token>
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Increase timeout to 10 minutes for large syncs
  req.setTimeout(600000);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    console.log('[api/admin/sync-schools] Starting sync...');
    const startTime = Date.now();

    // Run the sync
    const result = await syncAllWPSchools();

    const duration = Date.now() - startTime;
    console.log(`[api/admin/sync-schools] Sync completed in ${duration}ms`);

    // Return 200 even if there are errors, as long as some schools were synced
    // This allows the client to see partial results
    if (result.synced > 0) {
      return res.status(200).json({
        success: result.success,
        message: result.errors > 0 
          ? `Synced ${result.synced} schools with ${result.errors} errors`
          : `Successfully synced ${result.synced} schools`,
        synced: result.synced,
        errors: result.errors,
        errorsList: result.errorsList,
        duration: `${duration}ms`,
        total: result.synced + result.errors
      });
    } else {
      // No schools synced at all - this is a real failure
      return res.status(500).json({
        success: false,
        message: 'Sync failed: No schools were synced',
        synced: result.synced,
        errors: result.errors,
        errorsList: result.errorsList,
        duration: `${duration}ms`
      });
    }
  } catch (error: any) {
    console.error('[api/admin/sync-schools] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync schools',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

