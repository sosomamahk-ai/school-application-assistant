/**
 * Utility functions for template date management based on school category
 */

export type SchoolCategory = 'university' | 'local-secondary' | 'local-primary' | 'other';

/**
 * Determine school category from profileType
 * @param profileType - The school's profileType field
 * @returns The normalized category
 */
export function getSchoolCategory(profileType: string | null | undefined): SchoolCategory {
  if (!profileType) return 'other';
  
  const normalized = profileType.toLowerCase().trim();
  
  if (normalized === 'university') {
    return 'university';
  }
  
  if (normalized === 'local-secondary' || normalized === 'local_secondary') {
    return 'local-secondary';
  }
  
  if (normalized === 'local-primary' || normalized === 'local_primary') {
    return 'local-primary';
  }
  
  return 'other';
}

/**
 * Get required date fields for a category
 * @param category - The school category
 * @param isOpenAllYear - Whether "Open All Year" is checked
 * @returns Array of required field names
 */
export function getRequiredDateFields(
  category: SchoolCategory,
  isOpenAllYear: boolean
): string[] {
  if (isOpenAllYear) {
    return []; // No dates required if open all year
  }
  
  switch (category) {
    case 'university':
      return ['earlyStartDate', 'earlyEndDate', 'regularStartDate', 'regularEndDate'];
    case 'local-secondary':
    case 'local-primary':
      return [
        'springStartDate',
        'springEndDate',
        'fallStartDate',
        'fallEndDate',
        'centralStartDate',
        'centralEndDate'
      ];
    default:
      return ['applicationStartDate', 'applicationEndDate'];
  }
}

/**
 * Validate date fields based on category
 * @param template - Template object with date fields
 * @param category - School category
 * @param isOpenAllYear - Whether "Open All Year" is checked
 * @returns Error message if validation fails, null if valid
 */
export function validateTemplateDates(
  template: any,
  category: SchoolCategory,
  isOpenAllYear: boolean
): string | null {
  if (isOpenAllYear) {
    return null; // No validation needed if open all year
  }
  
  const requiredFields = getRequiredDateFields(category, false);
  
  for (const field of requiredFields) {
    if (!template[field]) {
      const fieldLabels: Record<string, string> = {
        earlyStartDate: 'Early Decision Start Date',
        earlyEndDate: 'Early Decision End Date',
        regularStartDate: 'Regular Decision Start Date',
        regularEndDate: 'Regular Decision End Date',
        springStartDate: 'Spring Transfer Start Date',
        springEndDate: 'Spring Transfer End Date',
        fallStartDate: 'Fall Transfer Start Date',
        fallEndDate: 'Fall Transfer End Date',
        centralStartDate: 'Central Allocation Start Date',
        centralEndDate: 'Central Allocation End Date',
        applicationStartDate: 'Application Start Date',
        applicationEndDate: 'Application End Date'
      };
      
      return `Missing required field: ${fieldLabels[field] || field}`;
    }
  }
  
  return null;
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string or "全年开放" if null
 */
export function formatApplicationDate(date: string | Date | null | undefined): string {
  if (!date) return '全年开放';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '全年开放';
  }
}

