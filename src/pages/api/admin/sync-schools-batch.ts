import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { syncAllWPSchools } from '@/services/syncWPSchools';

/**
 * Batch sync endpoint with longer timeout
 * This endpoint has increased timeout for large syncs
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set longer timeout (10 minutes)
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

    const { batchSize, startFrom } = req.body;
    const batchSizeNum = batchSize ? parseInt(batchSize, 10) : 100;
    const startFromNum = startFrom ? parseInt(startFrom, 10) : 0;

    console.log(`[api/admin/sync-schools-batch] Starting batch sync from ${startFromNum}, batch size: ${batchSizeNum}`);
    const startTime = Date.now();

    // Run the sync (will process all, but we can optimize later)
    const result = await syncAllWPSchools();

    const duration = Date.now() - startTime;
    console.log(`[api/admin/sync-schools-batch] Sync completed in ${duration}ms`);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Successfully synced ${result.synced} schools`,
        synced: result.synced,
        errors: result.errors,
        errorsList: result.errorsList,
        duration: `${duration}ms`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Sync completed with errors',
        synced: result.synced,
        errors: result.errors,
        errorsList: result.errorsList,
        duration: `${duration}ms`
      });
    }
  } catch (error: any) {
    console.error('[api/admin/sync-schools-batch] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync schools',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

