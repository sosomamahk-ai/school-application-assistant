import type { WordPressSchool, WordPressSchoolType } from '@/types/wordpress';

export interface TemplateOption {
  id: string;
  label: string;
  schoolId: string;
  schoolName?: string;
  program?: string;
  category?: string | null;
  wordpressSchool?: WordPressSchool | null;
}

export interface School {
  id: string;
  name: string;
  shortName: string | null;
  templateId: string;
  applicationStart?: string | null;
  applicationEnd?: string | null;
  interviewTime?: string | null;
  examTime?: string | null;
  resultTime?: string | null;
  officialLink?: string | null;
  notes?: string | null;
  isNew?: boolean;
  wordpressSchoolId?: number | null;
  wordpressSchoolType?: WordPressSchoolType | null;
}

export type RowValidationMap = Record<string, string[]>;


