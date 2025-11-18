/**
 * Internationalization utilities
 * Handles multi-language text processing
 */

import { Language } from '@/contexts/TranslationContext';

export interface LocalizedText {
  en: string;
  'zh-CN': string;
  'zh-TW': string;
}

/**
 * Get localized school name from either a string or localized object
 * @param schoolName - Can be a string (legacy format) or LocalizedText object
 * @param language - Current language preference
 * @returns Localized school name string
 */
export function getLocalizedSchoolName(
  schoolName: string | LocalizedText | any,
  language: Language = 'en'
): string {
  // If it's already a string (legacy format or fallback), return as is
  if (typeof schoolName === 'string') {
    return schoolName;
  }

  // If it's an object with language keys, return the appropriate language
  if (schoolName && typeof schoolName === 'object') {
    // Try to get the current language
    if (schoolName[language]) {
      return schoolName[language];
    }
    
    // Fallback to English
    if (schoolName.en) {
      return schoolName.en;
    }
    
    // Fallback to any available language
    if (schoolName['zh-CN']) {
      return schoolName['zh-CN'];
    }
    if (schoolName['zh-TW']) {
      return schoolName['zh-TW'];
    }
    
    // If object has string values, try to return first one
    const values = Object.values(schoolName);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0] as string;
    }
  }

  // Final fallback
  return typeof schoolName === 'string' ? schoolName : '[Unknown School]';
}

/**
 * Check if a value is a localized text object
 */
export function isLocalizedText(value: any): value is LocalizedText {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (typeof value.en === 'string' || typeof value['zh-CN'] === 'string' || typeof value['zh-TW'] === 'string')
  );
}

/**
 * Convert string to localized text object (for backward compatibility)
 */
export function toLocalizedText(text: string): LocalizedText {
  return {
    en: text,
    'zh-CN': text,
    'zh-TW': text,
  };
}

