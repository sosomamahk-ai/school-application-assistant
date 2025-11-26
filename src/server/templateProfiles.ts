import type { Prisma } from '@prisma/client';
import { parseWordPressTemplateId } from '@/services/wordpressSchoolService';

export const PROFILE_TYPES = [
  '国际学校',
  '本地中学',
  '本地小学',
  '幼稚园',
  '大学',
  '内地学校',
  'unresolved_raw'
] as const;

export type ProfileCategory = (typeof PROFILE_TYPES)[number];

const SLUG_CATEGORY_MAP: Record<string, ProfileCategory> = {
  'hk-is-template': '国际学校',
  'hk-ls-template': '本地中学',
  'hk-ls-primary-template': '本地小学',
  'hk-kg-template': '幼稚园',
  'mainland-school-template': '内地学校'
};

const CODE_CATEGORY_MAP: Record<string, ProfileCategory> = {
  A: '国际学校',
  B: '本地中学',
  C: '本地小学',
  D: '幼稚园',
  E: '内地学校'
};

export const templateListSchoolSelect = {
  id: true,
  wpId: true,
  name: true,
  nameEnglish: true,
  nameShort: true,
  permalink: true,
  school_profile_type: true,
  profileType: true,
  postType: true,
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
} as const;

export type TemplateListSchool = Prisma.SchoolGetPayload<{
  select: typeof templateListSchoolSelect;
}>;

export function mapSlugToCategory(slug: string | null | undefined): ProfileCategory {
  if (!slug) return 'unresolved_raw';
  return SLUG_CATEGORY_MAP[slug] || 'unresolved_raw';
}

export function mapSchoolProfileTypeCode(code: string | null | undefined) {
  if (!code || typeof code !== 'string') {
    return { category: 'unresolved_raw' as ProfileCategory, normalized: null as string | null };
  }
  const normalized = code.trim().toUpperCase();
  return {
    category: CODE_CATEGORY_MAP[normalized] || 'unresolved_raw',
    normalized
  };
}

export function buildTemplateProfile(school: TemplateListSchool) {
  const wpId = school.wpId!;
  const { category: codeCategory, normalized } = mapSchoolProfileTypeCode(school.school_profile_type);
  const taxonomyCategory = mapSlugToCategory(school.profileType);

  const isUniversityFromPostType = school.postType === 'university';
  const parsedTemplate = school.template?.schoolId ? parseWordPressTemplateId(school.template.schoolId) : null;
  const isUniversityFromTemplate = parsedTemplate?.type === 'university';
  const isUniversity = isUniversityFromPostType || isUniversityFromTemplate;

  let finalCategory: ProfileCategory = 'unresolved_raw';
  let classificationSource: 'school_profile_type' | 'taxonomy' | 'post_type' | undefined;

  if (isUniversity) {
    finalCategory = '大学';
    classificationSource = 'post_type';
  } else if (codeCategory !== 'unresolved_raw') {
    finalCategory = codeCategory;
    classificationSource = 'school_profile_type';
  } else if (taxonomyCategory !== 'unresolved_raw') {
    finalCategory = taxonomyCategory;
    classificationSource = 'taxonomy';
  }

  const hasTemplate = Boolean(school.template) && Boolean(school.templateId);

  const template = school.template
    ? {
        ...school.template,
        school: {
          name: school.name,
          nameShort: school.nameShort,
          permalink: school.permalink,
          school_profile_type: school.school_profile_type
        }
      }
    : null;

  return {
    id: wpId,
    type: 'profile',
    title: school.nameEnglish || school.name,
    nameShort: school.nameShort,
    permalink: school.permalink,
    acf: {
      name_short: school.nameShort,
      school_profile_type: school.school_profile_type
    },
    schoolNameDb: school.name,
    profileType: finalCategory,
    profileTypeSlug: school.profileType,
    schoolProfileType: normalized,
    classificationSource,
    unresolvedReason:
      finalCategory === 'unresolved_raw'
        ? 'Missing school_profile_type and taxonomy profileType'
        : undefined,
    templateId: template?.id || school.templateId || undefined,
    template,
    hasTemplate,
    templateStatus: hasTemplate ? 'created' : 'pending',
    category: finalCategory
  };
}


