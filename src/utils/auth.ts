import type { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
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

