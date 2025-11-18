import { LocalizedText } from './i18n';

type SchoolNameInput = string | LocalizedText | null | undefined;

export function serializeSchoolName(value: SchoolNameInput): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to serialize schoolName:', error);
    return '';
  }
}

export function deserializeSchoolName(value: unknown): string | LocalizedText {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return parsed as LocalizedText;
        }
      } catch (error) {
        // Value is plain string, ignore parse error
      }
    }
    return value;
  }

  if (value && typeof value === 'object') {
    return value as LocalizedText;
  }

  return '';
}

