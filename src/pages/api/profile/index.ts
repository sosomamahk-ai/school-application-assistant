import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/utils/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get user profile
      const profile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.status(200).json({
        success: true,
        profile: {
          userId: userId,
          id: profile.id,
          fullName: profile.fullName,
          phone: profile.phone,
          birthday: profile.birthday,
          nationality: profile.nationality,
          education: profile.educationData,
          experiences: profile.experiencesData,
          essays: profile.essaysData,
          additional: profile.additionalData
        }
      });
    } else if (req.method === 'PUT') {
      // Update user profile
      const {
        fullName,
        phone,
        birthday,
        nationality,
        education,
        experiences,
        essays,
        additional
      } = req.body;

      const profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          fullName,
          phone,
          birthday: birthday ? new Date(birthday) : null,
          nationality,
          educationData: education || undefined,
          experiencesData: experiences || undefined,
          essaysData: essays || undefined,
          additionalData: additional || undefined
        }
      });

      res.status(200).json({
        success: true,
        profile: {
          userId: userId,
          id: profile.id,
          fullName: profile.fullName,
          phone: profile.phone,
          birthday: profile.birthday,
          nationality: profile.nationality,
          education: profile.educationData,
          experiences: profile.experiencesData,
          essays: profile.essaysData,
          additional: profile.additionalData
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Profile API error:', error);
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
    
    // Check for Prisma client errors
    if (error?.code?.startsWith('P')) {
      return res.status(500).json({ 
        error: 'Database error',
        message: process.env.NODE_ENV === 'development' ? error?.message : 'Database operation failed'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
}

