import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { autoFillFormFromProfile } from '@/utils/formMatcher';
import { FormField, UserProfileData } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fields } = req.body;

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Fields array is required' });
    }

    // Get user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userProfile: Partial<UserProfileData> = {
      basicInfo: {
        fullName: profile.fullName || '',
        email: '',
        phone: profile.phone || '',
        birthday: profile.birthday?.toISOString() || '',
        nationality: profile.nationality || ''
      },
      education: profile.educationData as any || [],
      experiences: profile.experiencesData as any || [],
      essays: profile.essaysData as any || {},
      additional: profile.additionalData as any || {}
    };

    const filledData = autoFillFormFromProfile(fields as FormField[], userProfile);

    res.status(200).json({
      success: true,
      formData: filledData
    });
  } catch (error) {
    console.error('Auto-fill error:', error);
    res.status(500).json({ error: 'Failed to auto-fill form' });
  }
}

