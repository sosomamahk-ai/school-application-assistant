import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { generateFieldGuidance } from '@/utils/aiHelper';
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

    const { field } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'Field information is required' });
    }

    // Get user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const userProfile: Partial<UserProfileData> = profile ? {
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
    } : {};

    const guidance = await generateFieldGuidance(field as FormField, userProfile);

    res.status(200).json({
      success: true,
      guidance
    });
  } catch (error) {
    console.error('Field guidance error:', error);
    res.status(500).json({ error: 'Failed to generate field guidance' });
  }
}

