import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { serializeSchoolName } from '@/utils/templates';
import { MASTER_TEMPLATE_PREFIX, MASTER_TEMPLATE_SCHOOL_ID } from '@/constants/templates';
import { getCategoryAbbreviation } from '@/services/wordpressSchoolService';

const mapProfileTypeToDisplayCategory = (profileType?: string | null): string => {
  if (!profileType) return '国际学校';
  const normalized = profileType.trim().toLowerCase();
  if (normalized.includes('university')) return '大学';
  if (normalized.includes('local-secondary') || normalized.includes('local_secondary')) {
    return '香港本地中学';
  }
  if (normalized.includes('local-primary') || normalized.includes('local_primary')) {
    return '香港本地小学';
  }
  return '国际学校';
};

const sanitizeIdentifier = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || null;
};

const buildTemplateIdFromSchool = (
  school: { id: string; wpId: number | null; name: string; nameShort: string | null; shortName: string | null; nameEnglish: string | null; profileType: string | null; school_profile_type: string | null },
  profileTypeFromRequest?: string | null
): string => {
  const categoryDisplay = mapProfileTypeToDisplayCategory(school.profileType || school.school_profile_type || profileTypeFromRequest);
  const categoryAbbr = getCategoryAbbreviation(categoryDisplay);
  const shortName = sanitizeIdentifier(school.nameShort || school.shortName || school.nameEnglish || school.name);

  if (shortName) {
    return `${shortName}-${categoryAbbr}-${new Date().getFullYear()}`;
  }

  if (school.wpId) {
    const wpType = profileTypeFromRequest && typeof profileTypeFromRequest === 'string'
      ? profileTypeFromRequest
      : 'profile';
    return `wp-${wpType}-${school.wpId}`;
  }

  return `school-${school.id}-${Date.now()}`;
};

const loadBaseFieldsData = async (baseTemplateId?: string | null) => {
  if (baseTemplateId) {
    const baseTemplate = await prisma.schoolFormTemplate.findUnique({
      where: { id: baseTemplateId },
      select: { fieldsData: true }
    });
    if (baseTemplate?.fieldsData) {
      return baseTemplate.fieldsData;
    }
  }

  let masterTemplate = await prisma.schoolFormTemplate.findUnique({
    where: { schoolId: MASTER_TEMPLATE_SCHOOL_ID },
    select: { fieldsData: true }
  });

  if (!masterTemplate) {
    const fallbackMaster = await prisma.schoolFormTemplate.findFirst({
      where: {
        schoolId: {
          startsWith: MASTER_TEMPLATE_PREFIX
        }
      },
      select: { fieldsData: true }
    });
    masterTemplate = fallbackMaster || null;
  }

  if (!masterTemplate?.fieldsData) {
    console.warn('[create-from-profile] No base template found; creating template with empty fieldsData');
    return [];
  }

  return masterTemplate.fieldsData;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authResult = await authenticateAdmin(req);
    if (!authResult) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { profileId, profileType, baseTemplateId } = req.body ?? {};

    if (profileId === null || profileId === undefined) {
      return res.status(400).json({ error: 'Missing required field: profileId' });
    }

    const numericProfileId = Number(profileId);
    if (Number.isNaN(numericProfileId)) {
      return res.status(400).json({ error: 'Invalid profileId: must be a number' });
    }

    const school = await prisma.school.findFirst({
      where: { wpId: numericProfileId },
      include: {
        template: {
          select: { id: true }
        }
      }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found in local database. Please sync WordPress schools first.' });
    }

    if (school.template || school.templateId) {
      return res.status(400).json({
        error: 'Template already exists for this school',
        message: 'Each school can only have one template'
      });
    }

    const templateSchoolId = buildTemplateIdFromSchool(school, profileType);

    const existingTemplate = await prisma.schoolFormTemplate.findUnique({
      where: { schoolId: templateSchoolId }
    });

    if (existingTemplate) {
      return res.status(400).json({
        error: 'Template already exists for this identifier',
        message: `Template with schoolId "${templateSchoolId}" already exists`
      });
    }

    const fieldsData = await loadBaseFieldsData(baseTemplateId);
    const localizedSchoolName = {
      en: school.nameEnglish || school.name,
      'zh-CN': school.name,
      'zh-TW': school.name
    };

    const categoryDisplay = mapProfileTypeToDisplayCategory(school.profileType || school.school_profile_type || profileType);

    const template = await prisma.schoolFormTemplate.create({
      data: {
        id: templateSchoolId,
        schoolId: templateSchoolId,
        schoolName: serializeSchoolName(localizedSchoolName),
        program: '申请表单',
        description: null,
        category: categoryDisplay,
        fieldsData,
        isActive: true,
        isApplicationOpenAllYear: true,
        applicationStartDate: null,
        applicationEndDate: null,
        earlyStartDate: null,
        earlyEndDate: null,
        regularStartDate: null,
        regularEndDate: null,
        springStartDate: null,
        springEndDate: null,
        fallStartDate: null,
        fallEndDate: null,
        centralStartDate: null,
        centralEndDate: null,
        updatedAt: new Date()
      }
    });

    await prisma.school.update({
      where: { id: school.id },
      data: {
        templateId: template.id,
        updatedAt: new Date()
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
    console.error('[template API error]', error);

    if (error?.code === 'P2002') {
      const target = error.meta?.target || [];
      const field = Array.isArray(target) ? target.join(', ') : 'unknown';
      return res.status(400).json({
        error: 'Template with this schoolId already exists',
        message: `Duplicate entry for field(s): ${field}`,
        code: 'P2002'
      });
    }

    if (error?.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid foreign key reference',
        message: error?.message || 'Referenced record does not exist',
        code: 'P2003'
      });
    }

    if (error?.code === 'P2011') {
      return res.status(400).json({
        error: 'Missing required field',
        message: error?.message || 'A required field is missing',
        code: 'P2011'
      });
    }

    const errorMessage = process.env.NODE_ENV === 'development'
      ? (error?.message || 'Internal server error')
      : 'Failed to create template. Please check server logs for details.';

    return res.status(500).json({
      error: 'Failed to create template',
      message: errorMessage,
      code: error?.code || 'UNKNOWN_ERROR'
    });
  }
}

