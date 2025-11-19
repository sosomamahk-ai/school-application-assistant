import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 健康检查端点
 * 用于诊断服务器配置和数据库连接状态
 * 
 * 访问: GET /api/health
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      environmentVariables: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      },
      database: {
        connected: false,
        error: null as string | null,
      },
    },
  };

  // 测试数据库连接
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    health.checks.database.connected = true;
    await prisma.$disconnect();
  } catch (error: any) {
    health.status = 'error';
    health.checks.database.connected = false;
    health.checks.database.error = error?.message || 'Unknown error';
    
    // 尝试断开连接
    try {
      await prisma.$disconnect();
    } catch {
      // 忽略断开连接错误
    }
  }

  // 如果数据库未连接，返回 503
  if (!health.checks.database.connected) {
    return res.status(503).json(health);
  }

  // 如果缺少必需的环境变量，返回 503
  if (!health.checks.environmentVariables.DATABASE_URL || 
      !health.checks.environmentVariables.JWT_SECRET) {
    health.status = 'error';
    return res.status(503).json(health);
  }

  return res.status(200).json(health);
}

