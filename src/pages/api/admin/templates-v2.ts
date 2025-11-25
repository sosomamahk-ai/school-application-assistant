import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateAdmin } from '@/utils/auth';

const PROFILE_TYPES = ['国际学校', '本地中学', '本地小学', '幼稚园', 'unresolved_raw'] as const;
type ProfileCategory = (typeof PROFILE_TYPES)[number];

const SLUG_CATEGORY_MAP: Record<string, ProfileCategory> = {
  'hk-is-template': '国际学校',
  'hk-ls-template': '本地中学',
  'hk-ls-primary-template': '本地小学',
  'hk-kg-template': '幼稚园'
};

const CODE_CATEGORY_MAP: Record<string, ProfileCategory> = {
  A: '国际学校',
  B: '本地中学',
  C: '本地小学',
  D: '幼稚园'
};

function mapSlugToCategory(slug: string | null | undefined): ProfileCategory {
  if (!slug) return 'unresolved_raw';
  return SLUG_CATEGORY_MAP[slug] || 'unresolved_raw';
}

function mapSchoolProfileTypeCode(code: string | null | undefined) {
  if (!code || typeof code !== 'string') {
    return { category: 'unresolved_raw' as ProfileCategory, normalized: null as string | null };
  }
  const normalized = code.trim().toUpperCase();
  return {
    category: CODE_CATEGORY_MAP[normalized] || 'unresolved_raw',
    normalized
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await authenticateAdmin(req);
    if (!admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Only load schools that have been mapped to WordPress (wpId is present)
    const schools = await prisma.school.findMany({
      where: {
        wpId: {
          not: null
        }
      },
      select: {
        id: true,
        wpId: true,
        name: true,
        nameEnglish: true,
        nameShort: true,
        permalink: true,
        school_profile_type: true,
        profileType: true,
        templateId: true,
        template: {
          select: {
            id: true,
            schoolId: true,
            isActive: true,
            fieldsData: true,
            createdAt: true,
            updatedAt: true,
            category: true,
            applicationStartDate: true,
            applicationEndDate: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const groupedProfiles: Record<ProfileCategory, any[]> = {
      国际学校: [],
      本地中学: [],
      本地小学: [],
      幼稚园: [],
      unresolved_raw: []
    };

    const statsByType: Record<ProfileCategory, number> = {
      国际学校: 0,
      本地中学: 0,
      本地小学: 0,
      幼稚园: 0,
      unresolved_raw: 0
    };

    schools.forEach((school) => {
      const wpId = school.wpId!;
      const { category: codeCategory, normalized } = mapSchoolProfileTypeCode(school.school_profile_type);
      const taxonomyCategory = mapSlugToCategory(school.profileType);
      const finalCategory = codeCategory !== 'unresolved_raw' ? codeCategory : taxonomyCategory;
      const classificationSource: 'school_profile_type' | 'taxonomy' | undefined =
        codeCategory !== 'unresolved_raw'
          ? 'school_profile_type'
          : taxonomyCategory !== 'unresolved_raw'
          ? 'taxonomy'
          : undefined;

      const template = school.template
        ? {
          ...school.template,
          school: {
            nameShort: school.nameShort,
            permalink: school.permalink,
            school_profile_type: school.school_profile_type
          }
        }
        : null;

      const profile = {
        id: wpId,
        type: 'profile',
        title: school.nameEnglish || school.name,
        nameShort: school.nameShort,
        permalink: school.permalink,
        acf: {
          name_short: school.nameShort,
          school_profile_type: school.school_profile_type
        },
        profileType: finalCategory,
        profileTypeSlug: school.profileType,
        schoolProfileType: normalized,
        classificationSource,
        unresolvedReason:
          finalCategory === 'unresolved_raw'
            ? 'Missing school_profile_type and taxonomy profileType'
            : undefined,
        templateId: template?.id,
        template,
        hasTemplate: Boolean(template),
        templateStatus: template ? 'created' : 'pending',
        category: finalCategory
      };

      groupedProfiles[finalCategory].push(profile);
      statsByType[finalCategory] += 1;
    });

    // Sort entries alphabetically within each category for consistency
    Object.keys(groupedProfiles).forEach((key) => {
      groupedProfiles[key as ProfileCategory].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-Hans-CN'));
    });

    const total = schools.length;
    const withTemplate = schools.filter((school) => Boolean(school.templateId)).length;
    const withoutTemplate = total - withTemplate;

    return res.status(200).json({
      success: true,
      profiles: groupedProfiles,
      stats: {
        total,
        withTemplate,
        withoutTemplate,
        byType: statsByType,
        unresolved: statsByType['unresolved_raw']
      }
    });
  } catch (error: any) {
    console.error('[API /admin/templates-v2] Error:', error);
    return res.status(500).json({
      error: 'Failed to load template data',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    });
  }
}

