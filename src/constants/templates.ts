/**
 * Template constants
 * Template-related constants and helper functions
 */

// Master template schoolId - legacy ID for the first master template
export const MASTER_TEMPLATE_SCHOOL_ID = 'template-master-all-fields';

// Prefix for all system master templates
export const MASTER_TEMPLATE_PREFIX = 'template-master-';

/**
 * Check if a template is the master template
 * @param schoolId - The schoolId to check
 * @returns true if the template is the master template
 */
export function isMasterTemplate(schoolId: string | null | undefined): boolean {
  if (!schoolId) return false;
  return (
    schoolId === MASTER_TEMPLATE_SCHOOL_ID ||
    schoolId.startsWith(MASTER_TEMPLATE_PREFIX)
  );
}

