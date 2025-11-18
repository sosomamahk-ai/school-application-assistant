// Type definitions based on the Rule document

import { LocalizedText } from '@/utils/i18n';

export interface BasicInfo {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  nationality: string;
}

export interface Education {
  schoolName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  GPA: string;
}

export interface Experience {
  title: string;
  organization: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface Essays {
  statementOfPurpose?: string;
  personalStatement?: string;
  others?: { [key: string]: string };
}

export interface UserProfileData {
  basicInfo: BasicInfo;
  education: Education[];
  experiences: Experience[];
  essays: Essays;
  additional: { [key: string]: string };
}

export type FieldType = "text" | "date" | "select" | "essay" | "experience" | "education" | "textarea" | "email" | "tel";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  aiFillRule?: string;  // Description of how AI should auto-generate this field
  mapToUserField?: string;  // Maps to UserProfile field path (e.g., "basicInfo.fullName")
  options?: string[];  // For select type
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
}

export interface SchoolFormTemplateData {
  schoolId: string;
  schoolName: string | LocalizedText;  // Supports both string (legacy) and LocalizedText (multi-language)
  program: string;
  description?: string;
  fields: FormField[];
}

export interface AIGuidance {
  fieldId: string;
  explanation: string;
  requirements: string[];
  examples?: string[];
  suggestedContent?: string;
}

export interface ApplicationFormData {
  [fieldId: string]: any;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIConversationContext {
  applicationId?: string;
  currentFieldId?: string;
  userProfile?: Partial<UserProfileData>;
}

