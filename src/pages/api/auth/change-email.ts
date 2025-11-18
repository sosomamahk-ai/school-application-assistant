import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证用户身份
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email and current password are required' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查新邮箱是否与当前邮箱相同
    if (user.email === normalizedEmail) {
      return res.status(400).json({ error: 'New email must be different from current email' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // 检查新邮箱是否已被使用
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 更新邮箱
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        updatedAt: new Date()
      }
    });

    // 生成新的 JWT token（包含新邮箱）
    const token = jwt.sign(
      { userId: user.id, email: normalizedEmail, username: user.username, role: (user as any).role || 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email changed successfully',
      token, // 返回新token
      user: {
        id: user.id,
        email: normalizedEmail,
        username: user.username,
        role: user.role || 'user'
      }
    });
  } catch (error: any) {
    console.error('Change email error:', error);
    
    // 处理唯一约束冲突
    if (error?.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

