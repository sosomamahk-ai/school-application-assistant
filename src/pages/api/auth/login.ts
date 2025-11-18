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
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ error: 'Server configuration error' });
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
    const isEmail = rawIdentifier.includes('@');
    const searchFilters: any[] = [];

    if (isEmail) {
      searchFilters.push({ email: identifier });
      if (identifier !== rawIdentifier) {
        searchFilters.push({ email: rawIdentifier });
      }
    } else {
      const username = identifier.replace(/\s+/g, '');
      searchFilters.push({ username });
      if (username !== rawIdentifier) {
        searchFilters.push({ username: rawIdentifier });
      }
      // Allow email fallback just in case users mistakenly enter email without @
      searchFilters.push({ email: identifier });
      if (identifier !== rawIdentifier) {
        searchFilters.push({ email: rawIdentifier });
      }
    }

    // Find user (role is required for RBAC)
    const user = await prisma.user.findFirst({
      where: {
        OR: searchFilters
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true
          }
        }
      }
    }) as any;

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

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: userRole,
        profileId: user.profile?.id
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

