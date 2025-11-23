/**
 * WordPress 数据缓存服务
 * 支持多个存储后端：Vercel KV/Redis, Postgres, Supabase, JSON 文件缓存
 */

import { prisma } from '@/lib/prisma';
import type { WordPressSchoolResponse, WordPressSchool } from '@/types/wordpress';
import * as fs from 'fs/promises';
import * as path from 'path';

// 缓存配置
const CACHE_TTL = Number(process.env.WORDPRESS_CACHE_TTL || 3600 * 1000); // 默认 1 小时
const JSON_CACHE_PATH = process.env.WORDPRESS_JSON_CACHE_PATH || '.cache/wordpress-profiles.json';

// 存储后端类型
export type CacheBackend = 'kv' | 'postgres' | 'supabase' | 'json' | 'all';
export type CacheResult = {
  success: boolean;
  backend: string;
  data?: WordPressSchoolResponse;
  error?: string;
  cached?: boolean;
  age?: number; // 缓存年龄（毫秒）
};

/**
 * Vercel KV / Redis 缓存
 */
async function getFromKV(): Promise<CacheResult | null> {
  try {
    // 检查是否配置了 Vercel KV
    const kvUrl = process.env.KV_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!kvUrl) {
      return null; // 未配置 KV
    }

    // 使用 Upstash REST API 或 Vercel KV
    const kvRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (kvRestToken && kvUrl.includes('upstash') || kvUrl.includes('rest.redis')) {
      // Upstash Redis REST API
      const response = await fetch(`${kvUrl}/get/wp:schools:profiles`, {
        headers: {
          'Authorization': `Bearer ${kvRestToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.result !== null && result.result !== undefined) {
          const dataStr = typeof result.result === 'string' ? result.result : JSON.stringify(result.result);
          let data: WordPressSchoolResponse;
          try {
            data = JSON.parse(dataStr);
          } catch {
            // 如果解析失败，可能是已经是对象
            data = result.result as WordPressSchoolResponse;
          }
          
          const timestampRes = await fetch(`${kvUrl}/get/wp:schools:profiles:timestamp`, {
            headers: { 'Authorization': `Bearer ${kvRestToken}` }
          }).then(r => r.ok ? r.json() : null);
          
          const timestampValue = timestampRes?.result;
          const age = timestampValue ? Date.now() - Number(timestampValue) : 0;
          
          return {
            success: true,
            backend: 'kv',
            data,
            cached: true,
            age
          };
        }
      }
    } else {
      // 标准 Redis (需要安装 @vercel/kv 或 ioredis)
      // 这里提供基础实现，实际使用时需要安装对应包
      console.warn('[wordpressCache] KV URL found but no REST token. Install @vercel/kv for full support.');
    }

    return null;
  } catch (error) {
    console.error('[wordpressCache] KV read error:', error);
    return null;
  }
}

async function saveToKV(data: WordPressSchoolResponse): Promise<boolean> {
  try {
    const kvUrl = process.env.KV_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!kvUrl || !kvRestToken) {
      return false;
    }

    if (kvUrl.includes('upstash') || kvUrl.includes('rest.redis')) {
      // Upstash Redis REST API
      const dataStr = JSON.stringify(data);
      const timestamp = String(Date.now());
      
      const [dataRes, timestampRes] = await Promise.all([
        fetch(`${kvUrl}/set/wp:schools:profiles`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvRestToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataStr)
        }),
        fetch(`${kvUrl}/set/wp:schools:profiles:timestamp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kvRestToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(timestamp)
        })
      ]);

      return dataRes.ok && timestampRes.ok;
    }

    return false;
  } catch (error) {
    console.error('[wordpressCache] KV save error:', error);
    return false;
  }
}

/**
 * PostgreSQL 缓存 (使用 Prisma)
 */
async function getFromPostgres(): Promise<CacheResult | null> {
  try {
    // 检查 WordPressProfileCache 表是否存在
    const cache = await prisma.$queryRawUnsafe<Array<{
      id: string;
      rawData: any;
      lastSyncedAt: Date;
      createdAt: Date;
    }>>(
      `SELECT id, "rawData", "lastSyncedAt", "createdAt" 
       FROM "WordPressProfileCache" 
       WHERE id = 'current' 
       LIMIT 1`
    ).catch(() => null);

    if (!cache || cache.length === 0) {
      return null;
    }

    const entry = cache[0];
    const age = Date.now() - new Date(entry.lastSyncedAt).getTime();
    const data = entry.rawData as WordPressSchoolResponse;

    return {
      success: true,
      backend: 'postgres',
      data,
      cached: true,
      age
    };
  } catch (error: any) {
    // 表可能不存在
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      return null;
    }
    console.error('[wordpressCache] Postgres read error:', error);
    return null;
  }
}

async function saveToPostgres(data: WordPressSchoolResponse): Promise<boolean> {
  try {
    // 使用 UPSERT 保存到 WordPressProfileCache 表
    const dataJson = JSON.stringify(data);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "WordPressProfileCache" (id, "rawData", "lastSyncedAt", "createdAt", "updatedAt")
      VALUES ('current', $1::jsonb, NOW(), NOW(), NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        "rawData" = $1::jsonb,
        "lastSyncedAt" = NOW(),
        "updatedAt" = NOW()
    `, dataJson).catch((error: any) => {
      // 如果表不存在，返回 false（由迁移处理）
      if (error?.code === 'P2021' || error?.message?.includes('does not exist') || error?.message?.includes('relation') || error?.message?.includes('table')) {
        console.warn('[wordpressCache] WordPressProfileCache table does not exist. Run migration first.');
        return false;
      }
      throw error;
    });

    return true;
  } catch (error) {
    console.error('[wordpressCache] Postgres save error:', error);
    return false;
  }
}

/**
 * Supabase 缓存（使用 Prisma，Supabase 基于 Postgres）
 */
async function getFromSupabase(): Promise<CacheResult | null> {
  // Supabase 使用 PostgreSQL，所以复用 Postgres 逻辑
  // 但可以通过环境变量区分
  if (process.env.SUPABASE_URL && process.env.DATABASE_URL?.includes('supabase')) {
    return getFromPostgres();
  }
  return null;
}

async function saveToSupabase(data: WordPressSchoolResponse): Promise<boolean> {
  if (process.env.SUPABASE_URL && process.env.DATABASE_URL?.includes('supabase')) {
    return saveToPostgres(data);
  }
  return false;
}

/**
 * JSON 文件缓存
 */
async function getFromJSON(): Promise<CacheResult | null> {
  try {
    // 确保在服务器环境
    if (typeof window !== 'undefined') {
      return null;
    }

    const cacheDir = path.dirname(JSON_CACHE_PATH);
    try {
      await fs.access(cacheDir);
    } catch {
      await fs.mkdir(cacheDir, { recursive: true });
    }

    const content = await fs.readFile(JSON_CACHE_PATH, 'utf-8');
    const cache = JSON.parse(content);

    if (cache.data && cache.timestamp) {
      const age = Date.now() - cache.timestamp;
      
      // 检查是否过期
      if (age > CACHE_TTL) {
        return null;
      }

      return {
        success: true,
        backend: 'json',
        data: cache.data as WordPressSchoolResponse,
        cached: true,
        age
      };
    }

    return null;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // 文件不存在
    }
    console.error('[wordpressCache] JSON read error:', error);
    return null;
  }
}

async function saveToJSON(data: WordPressSchoolResponse): Promise<boolean> {
  try {
    // 确保在服务器环境
    if (typeof window !== 'undefined') {
      return false;
    }

    const cacheDir = path.dirname(JSON_CACHE_PATH);
    try {
      await fs.access(cacheDir);
    } catch {
      await fs.mkdir(cacheDir, { recursive: true });
    }

    const cache = {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    };

    await fs.writeFile(JSON_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[wordpressCache] JSON save error:', error);
    return false;
  }
}

/**
 * 从所有后端读取缓存（优先顺序：KV > Postgres > Supabase > JSON）
 */
export async function getCache(backend?: CacheBackend): Promise<CacheResult | null> {
  if (backend && backend !== 'all') {
    switch (backend) {
      case 'kv':
        return getFromKV();
      case 'postgres':
        return getFromPostgres();
      case 'supabase':
        return getFromSupabase();
      case 'json':
        return getFromJSON();
      default:
        return null;
    }
  }

  // 尝试所有后端（按优先级）
  const backends: Array<() => Promise<CacheResult | null>> = [
    getFromKV,
    getFromPostgres,
    getFromSupabase,
    getFromJSON
  ];

  for (const getCacheFn of backends) {
    try {
      const result = await getCacheFn();
      if (result?.success && result.data) {
        // 检查缓存是否过期
        if (result.age !== undefined && result.age < CACHE_TTL) {
          return result;
        }
      }
    } catch (error) {
      // 继续尝试下一个后端
      continue;
    }
  }

  return null;
}

/**
 * 保存到所有配置的后端
 */
export async function saveCache(
  data: WordPressSchoolResponse,
  backends?: CacheBackend[]
): Promise<{ success: boolean; savedTo: string[]; errors: string[] }> {
  const savedTo: string[] = [];
  const errors: string[] = [];

  const targetBackends = backends || ['kv', 'postgres', 'supabase', 'json'];

  for (const backend of targetBackends) {
    try {
      let success = false;

      switch (backend) {
        case 'kv':
          success = await saveToKV(data);
          if (success) savedTo.push('kv');
          break;
        case 'postgres':
          success = await saveToPostgres(data);
          if (success) savedTo.push('postgres');
          break;
        case 'supabase':
          success = await saveToSupabase(data);
          if (success) savedTo.push('supabase');
          break;
        case 'json':
          success = await saveToJSON(data);
          if (success) savedTo.push('json');
          break;
      }

      if (!success && backend !== 'all') {
        errors.push(`${backend}: failed to save`);
      }
    } catch (error: any) {
      errors.push(`${backend}: ${error.message || 'unknown error'}`);
    }
  }

  return {
    success: savedTo.length > 0,
    savedTo,
    errors
  };
}

/**
 * 清除所有缓存
 */
export async function clearCache(): Promise<{ success: boolean; cleared: string[]; errors: string[] }> {
  const cleared: string[] = [];
  const errors: string[] = [];

  // Clear KV
  try {
    const kvUrl = process.env.KV_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (kvUrl && kvRestToken && (kvUrl.includes('upstash') || kvUrl.includes('rest.redis'))) {
      const [dataRes, timestampRes] = await Promise.all([
        fetch(`${kvUrl}/del/wp:schools:profiles`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${kvRestToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify('wp:schools:profiles')
        }),
        fetch(`${kvUrl}/del/wp:schools:profiles:timestamp`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${kvRestToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify('wp:schools:profiles:timestamp')
        })
      ]);
      
      if (dataRes.ok && timestampRes.ok) {
        cleared.push('kv');
      }
    }
  } catch (error: any) {
    errors.push(`kv: ${error.message}`);
  }

  // Clear Postgres
  try {
    await prisma.$executeRaw`DELETE FROM "WordPressProfileCache" WHERE id = 'current'`.catch(() => {});
    cleared.push('postgres');
  } catch (error: any) {
    errors.push(`postgres: ${error.message}`);
  }

  // Clear JSON
  try {
    if (typeof window === 'undefined') {
      await fs.unlink(JSON_CACHE_PATH).catch(() => {});
      cleared.push('json');
    }
  } catch (error: any) {
    errors.push(`json: ${error.message}`);
  }

  return {
    success: cleared.length > 0,
    cleared,
    errors
  };
}

