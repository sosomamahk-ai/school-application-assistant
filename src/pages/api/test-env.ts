import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * 测试环境变量配置的 API 端点
 * 访问: /api/test-env
 * 
 * 注意：此端点仅用于开发/调试，生产环境建议删除或添加认证
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 在生产环境可以添加认证检查
  if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const checks = {
    DATABASE_URL: {
      exists: !!process.env.DATABASE_URL,
      length: process.env.DATABASE_URL?.length || 0,
      startsWith: process.env.DATABASE_URL?.startsWith('postgresql://') || false,
      // 不显示实际值，只显示前几个字符
      preview: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
        : 'Not set'
    },
    JWT_SECRET: {
      exists: !!process.env.JWT_SECRET,
      length: process.env.JWT_SECRET?.length || 0,
      isLongEnough: (process.env.JWT_SECRET?.length || 0) >= 32,
      preview: process.env.JWT_SECRET 
        ? `${process.env.JWT_SECRET.substring(0, 10)}...` 
        : 'Not set'
    },
    NEXT_PUBLIC_APP_URL: {
      exists: !!process.env.NEXT_PUBLIC_APP_URL,
      value: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      isHttps: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || false
    },
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      startsWith: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
      preview: process.env.OPENAI_API_KEY 
        ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` 
        : 'Not set'
    }
  };

  // 测试数据库连接
  let dbConnectionTest = {
    connected: false,
    error: null as string | null
  };

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    dbConnectionTest.connected = true;
    await prisma.$disconnect();
  } catch (error: any) {
    dbConnectionTest.connected = false;
    dbConnectionTest.error = error?.message || 'Unknown error';
    
    // 尝试断开连接（即使连接失败）
    try {
      await prisma.$disconnect();
    } catch (e) {
      // 忽略断开连接错误
    }
  }

  // 计算总体状态
  const allRequiredSet = 
    checks.DATABASE_URL.exists &&
    checks.JWT_SECRET.exists &&
    checks.NEXT_PUBLIC_APP_URL.exists;

  const allValid = 
    allRequiredSet &&
    checks.DATABASE_URL.startsWith &&
    checks.JWT_SECRET.isLongEnough &&
    checks.NEXT_PUBLIC_APP_URL.isHttps &&
    dbConnectionTest.connected;

  res.status(200).json({
    status: allValid ? '✅ All checks passed' : '⚠️ Some checks failed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks,
    databaseConnection: dbConnectionTest,
    summary: {
      allRequiredSet,
      allValid,
      recommendations: [
        !checks.DATABASE_URL.exists && '❌ DATABASE_URL is not set',
        !checks.DATABASE_URL.startsWith && '⚠️ DATABASE_URL format may be incorrect (should start with postgresql://)',
        !checks.JWT_SECRET.exists && '❌ JWT_SECRET is not set',
        !checks.JWT_SECRET.isLongEnough && '⚠️ JWT_SECRET should be at least 32 characters',
        !checks.NEXT_PUBLIC_APP_URL.exists && '❌ NEXT_PUBLIC_APP_URL is not set',
        !checks.NEXT_PUBLIC_APP_URL.isHttps && '⚠️ NEXT_PUBLIC_APP_URL should use HTTPS',
        !dbConnectionTest.connected && `❌ Database connection failed: ${dbConnectionTest.error}`,
        !checks.OPENAI_API_KEY.exists && 'ℹ️ OPENAI_API_KEY is not set (optional, but required for AI features)'
      ].filter(Boolean)
    }
  });
}

