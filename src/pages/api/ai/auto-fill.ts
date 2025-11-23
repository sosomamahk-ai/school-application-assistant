import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { autoFillFormFromProfile } from '@/utils/formMatcher';
import { FormField, UserProfileData } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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

    // Get user's profile and user info
    const [profile, user] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
    ]);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userProfile: Partial<UserProfileData> = {
      basicInfo: {
        fullName: profile.fullName || '',
        email: user?.email || '',
        phone: profile.phone || '',
        birthday: profile.birthday?.toISOString() || '',
        nationality: profile.nationality || ''
      },
      education: profile.educationData as any || [],
      experiences: profile.experiencesData as any || [],
      essays: profile.essaysData as any || {},
      additional: profile.additionalData as any || {}
    };

    console.log('[Auto-fill API] User profile data:', {
      basicInfo: userProfile.basicInfo,
      hasEducation: Array.isArray(userProfile.education) && userProfile.education.length > 0,
      hasExperiences: Array.isArray(userProfile.experiences) && userProfile.experiences.length > 0,
      hasEssays: userProfile.essays && Object.keys(userProfile.essays).length > 0,
      additionalKeys: userProfile.additional && typeof userProfile.additional === 'object' 
        ? Object.keys(userProfile.additional) 
        : [],
      additionalData: userProfile.additional
    });

    console.log('[Auto-fill API] Fields to match:', fields.length, fields.map((f: FormField) => ({ 
      id: f.id, 
      label: f.label, 
      mapToUserField: f.mapToUserField 
    })));

    const filledData = autoFillFormFromProfile(fields as FormField[], userProfile);

    console.log('[Auto-fill API] Filled data:', {
      filledCount: Object.keys(filledData).length,
      filledFields: Object.keys(filledData),
      filledData
    });

    res.status(200).json({
      success: true,
      formData: filledData
    });
  } catch (error) {
    console.error('Auto-fill error:', error);
    res.status(500).json({ error: 'Failed to auto-fill form' });
  }
}

