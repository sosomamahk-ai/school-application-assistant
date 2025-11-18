/**
 * Template constants
 * Template-related constants and helper functions
 */

// Master template schoolId - this is the system template that contains all available fields
export const MASTER_TEMPLATE_SCHOOL_ID = 'template-master-all-fields';

/**
 * Check if a template is the master template
 * @param schoolId - The schoolId to check
 * @returns true if the template is the master template
 */
export function isMasterTemplate(schoolId: string | null | undefined): boolean {
  return schoolId === MASTER_TEMPLATE_SCHOOL_ID;
}

