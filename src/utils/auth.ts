import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export async function authenticate(req: NextApiRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    return decoded.userId;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function authenticateAdmin(req: NextApiRequest): Promise<{ userId: string; role: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
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

