import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { getTokenFromCookieHeader } from './token';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return getTokenFromCookieHeader(req.headers.cookie);
}

export async function authenticate(req: NextApiRequest): Promise<string | null> {
  try {
    const token = extractToken(req);
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    return decoded.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function authenticateAdmin(req: NextApiRequest): Promise<{ userId: string; role: string } | null> {
  try {
    const token = extractToken(req);
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // 检查是否是管理员
    if (decoded.role !== 'admin') {
      return null;
    }
    
    return { userId: decoded.userId, role: decoded.role };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return null;
  }
}

export async function verifyAuth(req: NextApiRequest): Promise<{
  isValid: boolean;
  user?: JWTPayload;
}> {
  try {
    const token = extractToken(req);
    if (!token) {
      return { isValid: false };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return {
      isValid: true,
      user: decoded,
    };
  } catch (error) {
    return { isValid: false };
  }
}

