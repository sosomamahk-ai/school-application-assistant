import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { getWordPressSchools } from '@/services/wordpressSchoolService';
import { buildWordPressTemplateId, buildStandardizedTemplateId, parseWordPressTemplateId } from '@/services/wordpressSchoolService';
import { serializeSchoolName } from '@/utils/templates';
import { MASTER_TEMPLATE_PREFIX, MASTER_TEMPLATE_SCHOOL_ID } from '@/constants/templates';

/**
 * Create a template from WordPress school profile
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { profileId, profileType, baseTemplateId } = req.body;

    if (!profileId || !profileType) {
      return res.status(400).json({ error: 'Missing required fields: profileId, profileType' });
    }

    // Get WordPress schools
    const wordPressData = await getWordPressSchools({ forceRefresh: true });
    const profiles = wordPressData.profiles || [];
    
    // Find the profile
    const profile = profiles.find(p => p.id === Number(profileId) && p.type === profileType);
    
    if (!profile) {
      return res.status(404).json({ error: 'WordPress profile not found' });
    }

    // Generate standardized template ID: name_short-category-year
    // Try to get name_short from ACF
    const nameShort = profile.acf?.name_short || profile.acf?.nameShort || null;
    
    // Build standardized template ID
    const templateId = buildStandardizedTemplateId(profile, nameShort);
    
    // Check if template already exists
    const existingTemplate = await prisma.schoolFormTemplate.findUnique({
      where: { schoolId: templateId }
    });

    if (existingTemplate) {
      return res.status(400).json({ 
        error: 'Template already exists',
        templateId: existingTemplate.id,
        schoolId: existingTemplate.schoolId
      });
    }

    // Get base template - default to master template if not provided
    let fieldsData: any = [];
    
    if (baseTemplateId) {
      // Use provided base template
      const baseTemplate = await prisma.schoolFormTemplate.findUnique({
        where: { id: baseTemplateId },
        select: { fieldsData: true }
      });
      if (baseTemplate) {
        fieldsData = baseTemplate.fieldsData;
      }
    } else {
      // Default: find and use master template
      // Try legacy ID first, then try prefix-based search
      let masterTemplate = await prisma.schoolFormTemplate.findUnique({
        where: { schoolId: MASTER_TEMPLATE_SCHOOL_ID },
        select: { fieldsData: true }
      });
      
      // If not found, try to find any template with master prefix
      if (!masterTemplate) {
        const allTemplates = await prisma.schoolFormTemplate.findMany({
          where: {
            schoolId: {
              startsWith: MASTER_TEMPLATE_PREFIX
            }
          },
          select: { fieldsData: true },
          take: 1
        });
        if (allTemplates.length > 0) {
          masterTemplate = allTemplates[0];
        }
      }
      
      if (masterTemplate) {
        fieldsData = masterTemplate.fieldsData;
      }
      // If still no master template found, fieldsData remains empty array
      // This allows the system to work even without a master template
      // However, we should log a warning if no master template is found
      if (!masterTemplate) {
        console.warn('[create-from-profile] No master template found, creating template with empty fieldsData');
      }
    }
    
    // Ensure fieldsData is valid (not null)
    if (!fieldsData) {
      fieldsData = [];
    }

    // Create template
    const schoolName = {
      en: profile.title,
      'zh-CN': profile.acf?.name_chinese || profile.title,
      'zh-TW': profile.acf?.name_chinese || profile.title
    };

    const template = await prisma.schoolFormTemplate.create({
      data: {
        schoolId: templateId,
        schoolName: serializeSchoolName(schoolName),
        program: profile.acf?.program || '申请表单',
        description: profile.acf?.description || null,
        category: profile.category || null,
        fieldsData: fieldsData,
        isActive: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template: {
        id: template.id,
        schoolId: template.schoolId,
        isActive: template.isActive
      }
    });
  } catch (error: any) {
    console.error('Create template from profile error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Template with this schoolId already exists' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create template',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

