/**
 * WordPress 学校配置文件 API（带缓存）
 * 优先从缓存读取，减少 WordPress API 负担
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCache } from '@/services/wordpressCache';
import handler from '../wordpress/school-profiles';

/**
 * 带缓存的 WordPress 学校配置文件 API
 * 优先从缓存读取，如果缓存过期或不存在，则回退到原始 API
 */
export default async function cachedHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return handler(req, res);
  }

  const forceRefresh = req.query.refresh === 'true';
  const useCache = req.query.cache !== 'false'; // 默认使用缓存

  // 如果强制刷新，直接使用原始 API
  if (forceRefresh || !useCache) {
    return handler(req, res);
  }

  try {
    // 尝试从缓存读取
    console.log('[school-profiles-cached] Attempting to read from cache...');
    const cacheResult = await getCache();

    if (cacheResult?.success && cacheResult.data) {
      // 检查缓存年龄
      const maxAge = Number(process.env.WORDPRESS_CACHE_TTL || 3600 * 1000); // 默认 1 小时
      
      if (cacheResult.age !== undefined && cacheResult.age < maxAge) {
        console.log('[school-profiles-cached] ✅ Cache hit:', {
          backend: cacheResult.backend,
          age: `${Math.round(cacheResult.age / 1000)}s`,
          profilesCount: cacheResult.data.profiles?.length || 0
        });

        // 需要获取模板映射信息（从数据库）
        const { prisma } = await import('@/lib/prisma');
        const { parseWordPressTemplateId } = await import('@/services/wordpressSchoolService');

        const templates = await prisma.schoolFormTemplate.findMany({
          select: {
            id: true,
            schoolId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            fieldsData: true
          }
        });

        // 构建模板映射
        const templateMap = new Map<string, typeof templates[0] | null>();
        templates.forEach(template => {
          const parsed = parseWordPressTemplateId(template.schoolId);
          if (parsed) {
            const key = `${parsed.type}-${parsed.id}`;
            templateMap.set(key, template);
          }
        });

        // 处理 profiles（添加模板信息）
        // 注意：这里需要重新分类，因为缓存的数据可能没有完整的分类信息
        // 为了保持一致性，我们仍然使用原始 API 的逻辑
        // 但可以优化：在缓存时保存完整的分类信息
        
        // 暂时回退到原始 API 以确保数据一致性
        // 未来可以在缓存时保存完整的分类数据
        console.log('[school-profiles-cached] Cache hit but need template mapping, using original API for consistency');
        return handler(req, res);
      } else {
        console.log('[school-profiles-cached] Cache expired, fetching fresh data...');
      }
    } else {
      console.log('[school-profiles-cached] Cache miss, fetching from WordPress...');
    }

    // 缓存未命中或过期，使用原始 API
    return handler(req, res);
  } catch (error: any) {
    console.error('[school-profiles-cached] Cache read error:', error);
    // 发生错误时回退到原始 API
    return handler(req, res);
  }
}

