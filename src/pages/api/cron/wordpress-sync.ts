/**
 * WordPress 数据定时同步 API
 * 使用 Vercel Cron Jobs 定时同步 WordPress 数据到缓存
 * 
 * 配置 Vercel Cron:
 * 在 vercel.json 中添加 cron 配置，schedule 使用每 6 小时格式
 * 
 * 或手动触发: GET /api/cron/wordpress-sync?secret=YOUR_SECRET
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordPressSchools } from '@/services/wordpressSchoolService';
import { saveCache, getCache } from '@/services/wordpressCache';

// 验证 Cron 请求的 secret（Vercel Cron 会自动添加）
const CRON_SECRET = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证请求来源（Vercel Cron 或手动触发）
  const authHeader = req.headers['authorization'];
  const isVercelCron = authHeader === `Bearer ${CRON_SECRET}`;
  const manualSecret = req.query.secret as string;
  const isManual = manualSecret === CRON_SECRET;

  // 允许 Vercel Cron 或手动触发（带 secret）
  if (!isVercelCron && !isManual) {
    // 如果没有配置 secret，允许所有请求（仅用于开发）
    if (!CRON_SECRET && process.env.NODE_ENV === 'development') {
      console.warn('[wordpress-sync] No CRON_SECRET configured, allowing request in development mode');
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startTime = Date.now();

  try {
    console.log('[wordpress-sync] Starting WordPress data sync...');

    // 1. 从 WordPress 获取最新数据
    console.log('[wordpress-sync] Fetching data from WordPress...');
    const wordPressData = await getWordPressSchools({ forceRefresh: true });

    if (!wordPressData || !wordPressData.profiles || wordPressData.profiles.length === 0) {
      console.warn('[wordpress-sync] No data received from WordPress');
      return res.status(500).json({
        success: false,
        error: 'No data received from WordPress',
        stats: {
          profilesCount: 0,
          universitiesCount: 0
        }
      });
    }

    console.log('[wordpress-sync] Data fetched:', {
      profiles: wordPressData.profiles?.length || 0,
      universities: wordPressData.universities?.length || 0,
      total: wordPressData.all?.length || 0
    });

    // 2. 保存到所有配置的缓存后端
    console.log('[wordpress-sync] Saving to cache backends...');
    const saveResult = await saveCache(wordPressData);

    const duration = Date.now() - startTime;

    if (saveResult.success) {
      console.log('[wordpress-sync] ✅ Sync completed successfully', {
        duration: `${duration}ms`,
        savedTo: saveResult.savedTo,
        errors: saveResult.errors
      });

      return res.status(200).json({
        success: true,
        message: 'WordPress data synced successfully',
        stats: {
          profilesCount: wordPressData.profiles?.length || 0,
          universitiesCount: wordPressData.universities?.length || 0,
          totalCount: wordPressData.all?.length || 0
        },
        cache: {
          savedTo: saveResult.savedTo,
          errors: saveResult.errors,
          backendsCount: saveResult.savedTo.length
        },
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('[wordpress-sync] ❌ Sync failed:', saveResult.errors);

      return res.status(500).json({
        success: false,
        error: 'Failed to save to cache',
        stats: {
          profilesCount: wordPressData.profiles?.length || 0,
          universitiesCount: wordPressData.universities?.length || 0,
          totalCount: wordPressData.all?.length || 0
        },
        cache: {
          savedTo: saveResult.savedTo,
          errors: saveResult.errors
        },
        duration: `${duration}ms`
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[wordpress-sync] ❌ Sync error:', error);

    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message || 'Unknown error',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

