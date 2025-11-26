import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { authenticateAdmin } from '@/utils/auth';
import { prisma } from '@/lib/prisma';
import { serializeSchoolName, deserializeSchoolName } from '@/utils/templates';
import { parseWordPressTemplateId } from '@/services/wordpressSchoolService';
import { getSchoolCategory, getRequiredDateFields, type SchoolCategory } from '@/utils/templateDates';

type SchoolRecord = {
  id: string;
  wpId: number | null;
  profileType: string | null;
  school_profile_type: string | null;
  templateId: string | null;
  name: string;
  nameShort: string | null;
  shortName: string | null;
  nameEnglish: string | null;
};

const DATE_FIELDS = [
  'applicationStartDate',
  'applicationEndDate',
  'earlyStartDate',
  'earlyEndDate',
  'regularStartDate',
  'regularEndDate',
  'springStartDate',
  'springEndDate',
  'fallStartDate',
  'fallEndDate',
  'centralStartDate',
  'centralEndDate'
] as const;

const DISPLAY_CATEGORY_MAP: Record<SchoolCategory, string> = {
  university: '大学',
  'local-secondary': '香港本地中学',
  'local-primary': '香港本地小学',
  other: '国际学校'
};

const CATEGORY_DISPLAY_TO_KEY: Record<string, SchoolCategory> = {
  '大学': 'university',
  '香港本地中学': 'local-secondary',
  '本地中学': 'local-secondary',
  '香港本地小学': 'local-primary',
  '本地小学': 'local-primary'
};

const normalizeDateInput = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return value as string;
};

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      console.warn('[templates/import] Invalid date value:', value);
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('[templates/import] Failed to parse date:', value, error);
    return null;
  }
};

const deriveValidationCategory = (
  school: SchoolRecord | null,
  incomingCategory?: string | null
): SchoolCategory => {
  if (school?.profileType) {
    return getSchoolCategory(school.profileType);
  }
  if (school?.school_profile_type) {
    return getSchoolCategory(school.school_profile_type);
  }
  if (incomingCategory) {
    const trimmed = incomingCategory.trim();
    const mapped = CATEGORY_DISPLAY_TO_KEY[trimmed];
    if (mapped) return mapped;
    if (trimmed.toLowerCase().includes('university')) return 'university';
    if (trimmed.includes('本地中学')) return 'local-secondary';
    if (trimmed.includes('本地小学')) return 'local-primary';
  }
  return 'other';
};

const deriveDisplayCategory = (
  school: SchoolRecord | null,
  incomingCategory?: string | null
): string => {
  if (incomingCategory && incomingCategory.trim().length) {
    return incomingCategory;
  }
  const categoryKey = deriveValidationCategory(school, null);
  return DISPLAY_CATEGORY_MAP[categoryKey] ?? DISPLAY_CATEGORY_MAP.other;
};

const cleanDateFields = (payload: Record<string, unknown>, isOpenAllYear: boolean) => {
  const normalized: Record<string, string | null> = {};
  DATE_FIELDS.forEach((field) => {
    normalized[field] = isOpenAllYear ? null : normalizeDateInput(payload[field]);
  });
  return normalized;
};

const validateDateRequirements = (
  dates: Record<string, string | null>,
  isOpenAllYear: boolean,
  categoryKey: SchoolCategory
): { valid: true } | { valid: false; error: string; fields?: string[] } => {
  if (isOpenAllYear) {
    return { valid: true };
  }

  const required = getRequiredDateFields(categoryKey, false);
  const missing = required.filter((field) => !dates[field]);

  if (missing.length) {
    return {
      valid: false,
      error: 'Missing required date fields',
      fields: missing
    };
  }

  return { valid: true };
};

const resolveSchoolRecord = async (schoolId?: string | null): Promise<SchoolRecord | null> => {
  if (!schoolId) {
    return null;
  }

  const parsed = parseWordPressTemplateId(schoolId);
  if (parsed) {
    const schoolByWpId = await prisma.school.findFirst({
      where: { wpId: parsed.id },
      select: {
        id: true,
        wpId: true,
        profileType: true,
        school_profile_type: true,
        templateId: true,
        name: true,
        nameShort: true,
        shortName: true,
        nameEnglish: true
      }
    });
    if (schoolByWpId) {
      return schoolByWpId;
    }
  }

  const schoolById = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      wpId: true,
      profileType: true,
      school_profile_type: true,
      templateId: true,
      name: true,
      nameShort: true,
      shortName: true,
      nameEnglish: true
    }
  });

  return schoolById || null;
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

    const { id, createdAt, updatedAt, fields, fieldsData, ...rawTemplateData } = req.body ?? {};

    if (!rawTemplateData.schoolId || !rawTemplateData.schoolName || !rawTemplateData.program) {
      return res.status(400).json({ error: 'Missing required fields: schoolId, schoolName, program' });
    }

    const schoolRecord = await resolveSchoolRecord(rawTemplateData.schoolId);
    const validationCategory = deriveValidationCategory(schoolRecord, rawTemplateData.category);
    const displayCategory = deriveDisplayCategory(schoolRecord, rawTemplateData.category);

    const isApplicationOpenAllYear = rawTemplateData.isApplicationOpenAllYear === true;
    const normalizedDates = cleanDateFields(rawTemplateData, isApplicationOpenAllYear);
    const validationResult = validateDateRequirements(normalizedDates, isApplicationOpenAllYear, validationCategory);

    if (!validationResult.valid) {
      return res.status(400).json({
        error: validationResult.error,
        fields: validationResult.fields
      });
    }

    const schoolNameValue = serializeSchoolName(rawTemplateData.schoolName);
    const normalizedFieldsData = Array.isArray(fieldsData)
      ? fieldsData
      : Array.isArray(fields)
        ? fields
        : [];

    const parsedDates = Object.fromEntries(
      DATE_FIELDS.map((field) => [field, isApplicationOpenAllYear ? null : parseDate(normalizedDates[field])])
    );

    const template = await prisma.schoolFormTemplate.upsert({
      where: { schoolId: rawTemplateData.schoolId },
      update: {
        schoolName: schoolNameValue,
        program: rawTemplateData.program,
        description: rawTemplateData.description || null,
        category: displayCategory,
        fieldsData: normalizedFieldsData as any,
        isActive: rawTemplateData.isActive !== undefined ? rawTemplateData.isActive : true,
        isApplicationOpenAllYear,
        ...(parsedDates as Record<string, Date | null>),
        updatedAt: new Date()
      },
      create: {
        id: rawTemplateData.schoolId || randomUUID(),
        schoolId: rawTemplateData.schoolId,
        schoolName: schoolNameValue,
        program: rawTemplateData.program,
        description: rawTemplateData.description || null,
        category: displayCategory,
        fieldsData: normalizedFieldsData as any,
        isActive: rawTemplateData.isActive !== undefined ? rawTemplateData.isActive : true,
        isApplicationOpenAllYear,
        ...(parsedDates as Record<string, Date | null>),
        updatedAt: new Date()
      }
    });

    if (schoolRecord && schoolRecord.templateId !== template.id) {
      await prisma.school.update({
        where: { id: schoolRecord.id },
        data: { templateId: template.id, updatedAt: new Date() }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template imported successfully',
      template: {
        id: template.id,
        schoolId: template.schoolId,
        schoolName: deserializeSchoolName(template.schoolName),
        program: template.program,
        description: template.description,
        category: template.category,
        isActive: template.isActive
      }
    });
  } catch (error: any) {
    console.error('[template API error]', error);

    if (error?.code === 'P2002') {
      return res.status(400).json({
        error: 'Template with this schoolId already exists. Use update instead.',
        code: 'P2002',
        details: error?.meta?.target
      });
    }

    if (error?.code === 'P2011') {
      return res.status(400).json({
        error: 'Missing required field',
        message: error?.message || 'A required field is missing',
        code: 'P2011'
      });
    }

    if (error?.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid field value',
        message: error?.message || 'One or more field values are invalid',
        code: 'P2003'
      });
    }

    return res.status(500).json({
      error: 'Failed to import template',
      message: process.env.NODE_ENV === 'development' ? error?.message : 'An error occurred while importing the template',
      code: error?.code || 'UNKNOWN_ERROR'
    });
  }
}
