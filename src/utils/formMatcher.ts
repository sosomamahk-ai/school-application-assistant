import { FormField, UserProfileData, ApplicationFormData } from '@/types';

/**
 * Maps user profile data to application form fields based on mapToUserField
 */
export function autoFillFormFromProfile(
  fields: FormField[],
  userProfile: Partial<UserProfileData>
): ApplicationFormData {
  const filledData: ApplicationFormData = {};

  fields.forEach((field) => {
    if (!field.mapToUserField) return;

    const value = getNestedValue(userProfile, field.mapToUserField);
    
    if (value !== undefined && value !== null) {
      filledData[field.id] = value;
    }
  });

  return filledData;
}

/**
 * Gets nested value from object using dot notation path
 * e.g., getNestedValue(obj, "basicInfo.fullName")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Identifies missing required fields that haven't been filled
 */
export function getMissingRequiredFields(
  fields: FormField[],
  formData: ApplicationFormData
): FormField[] {
  return fields.filter(field => {
    if (!field.required) return false;
    
    const value = formData[field.id];
    return value === undefined || value === null || value === '';
  });
}

/**
 * Identifies fields that can be auto-filled from user profile
 */
export function getAutoFillableFields(
  fields: FormField[],
  userProfile: Partial<UserProfileData>
): FormField[] {
  return fields.filter(field => {
    if (!field.mapToUserField) return false;
    
    const value = getNestedValue(userProfile, field.mapToUserField);
    return value !== undefined && value !== null;
  });
}

/**
 * Validates form data against field requirements
 */
export function validateFormData(
  fields: FormField[],
  formData: ApplicationFormData
): { isValid: boolean; errors: { [fieldId: string]: string } } {
  const errors: { [fieldId: string]: string } = {};

  fields.forEach(field => {
    const value = formData[field.id];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.id] = `${field.label} is required`;
      return;
    }

    // Check max length
    if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
      errors[field.id] = `${field.label} must be less than ${field.maxLength} characters`;
    }

    // Type-specific validation
    if (value) {
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field.id] = 'Invalid email format';
          }
          break;
        case 'tel':
          if (!/^\+?[\d\s\-()]+$/.test(value)) {
            errors[field.id] = 'Invalid phone number format';
          }
          break;
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors[field.id] = 'Invalid date format';
          }
          break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Calculates form completion percentage
 */
export function calculateFormCompletion(
  fields: FormField[],
  formData: ApplicationFormData
): number {
  if (fields.length === 0) return 0;

  const filledFields = fields.filter(field => {
    const value = formData[field.id];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledFields.length / fields.length) * 100);
}

