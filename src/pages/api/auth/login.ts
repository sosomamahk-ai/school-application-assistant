import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查环境变量
    if (!process.env.JWT_SECRET) {
      console.error('[Login API] JWT_SECRET is not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'JWT_SECRET is not configured. Please check Vercel environment variables.'
      });
    }

    const identifierInput = typeof req.body.identifier === 'string'
      ? req.body.identifier
      : req.body.email;
    const password: string | undefined = req.body.password;

    if (!identifierInput || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const rawIdentifier = identifierInput.trim();
    if (!rawIdentifier) {
      return res.status(400).json({ error: 'Identifier is required' });
    }

    const identifier = rawIdentifier.toLowerCase();

    // 尝试查询用户（带重试机制）
    // Prisma 会自动管理连接，不需要手动调用 $connect()
    let user;
    let connectionRetries = 0;
    const maxRetries = 3;
    
    while (connectionRetries < maxRetries) {
      try {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier }
            ]
          },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break; // 查询成功，跳出循环
      } catch (dbQueryError: any) {
        connectionRetries++;
        const isConnectionError = 
          dbQueryError?.code === 'P1001' || 
          dbQueryError?.message?.includes('connect') || 
          dbQueryError?.message?.includes('ECONNREFUSED') ||
          dbQueryError?.message?.includes('timeout') ||
          dbQueryError?.message?.includes('Can\'t reach database server');
        
        if (isConnectionError && connectionRetries < maxRetries) {
          // 连接错误，等待后重试
          console.warn(`[Login API] Database connection attempt ${connectionRetries}/${maxRetries} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // 不是连接错误或已达到最大重试次数
        console.error('[Login API] Database query failed:', dbQueryError);
        return res.status(500).json({ 
          error: dbQueryError?.code === 'P1001' ? 'Database connection failed' : 'Database query failed',
          message: isConnectionError 
            ? 'Unable to connect to database. Please check DATABASE_URL configuration.'
            : 'Unable to query database. Please check database configuration.',
          details: process.env.NODE_ENV === 'development' ? dbQueryError?.message : undefined,
          retries: connectionRetries
        });
      }
    }

    // 查询用户资料
    let profile = null;
    if (user) {
      try {
        profile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        });
      } catch (profileError: any) {
        // 资料查询失败不影响登录，只记录错误
        console.warn('[Login API] Profile query failed (non-critical):', profileError);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userRole = user.role || 'user';

    // Generate JWT token (include role in token)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: userRole
    };

    // 生成 JWT token
    let token: string;
    try {
      token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '7d' });
    } catch (jwtError: any) {
      console.error('[Login API] JWT signing failed:', jwtError);
      return res.status(500).json({ 
        error: 'Token generation failed',
        message: 'Unable to generate authentication token.'
      });
    }

    // Prisma 会自动管理连接，不需要手动断开

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: userRole,
        profileId: profile?.id
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // Check for database connection errors
    if (error?.code === 'P1001' || error?.message?.includes('connect') || error?.message?.includes('ECONNREFUSED')) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please check DATABASE_URL configuration.'
      });
    }
    
    // Check for missing JWT_SECRET
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'JWT_SECRET is not configured'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

