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

    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists (don't select role if column doesn't exist)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile
    // Handle case where role column doesn't exist in database yet
    let user;
    let userRole = 'user'; // Default role
    
    try {
      // Try creating with role field first (if column exists in DB)
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'user', // Default role for new users
          profile: {
            create: {
              fullName: fullName || null
            }
          }
        },
        include: {
          profile: true
        }
      });
      
      // If successful, get role from created user
      userRole = (user as any).role || 'user';
    } catch (error: any) {
      // Check if error is about role column not existing
      const isRoleColumnError = 
        error?.code === 'P2022' || 
        (error?.message && (
          error.message.includes('role') || 
          error.message.includes('column') ||
          error.message.includes('does not exist')
        ));
      
      if (isRoleColumnError) {
        console.warn('⚠️ Role column does not exist in database');
        console.warn('Please run this SQL in Supabase:');
        console.warn('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT \'user\';');
        
        // Create user without role field
        try {
          user = await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              profile: {
                create: {
                  fullName: fullName || null
                }
              }
            },
            include: {
              profile: true
            }
          });
          // Role will default to 'user' in our code
        } catch (retryError: any) {
          console.error('Failed to create user even without role field:', retryError);
          throw retryError;
        }
      } else {
        // Re-throw other errors (like unique constraint, etc.)
        console.error('Registration error (not related to role):', error);
        throw error;
      }
    }

    // Generate JWT token (include role in token)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: userRole },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        profileId: user.profile?.id
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    
    // 处理唯一约束冲突（用户已存在）
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

