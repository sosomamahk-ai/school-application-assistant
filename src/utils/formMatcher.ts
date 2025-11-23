import { FormField, UserProfileData, ApplicationFormData } from '@/types';
import { MASTER_TEMPLATE_DATA } from '@/data/master-template';

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
 * Build a map of master template field IDs to their labels
 * This helps match application form fields to master template fields by label
 */
function buildMasterTemplateFieldMap(): Map<string, string> {
  const fieldMap = new Map<string, string>();
  
  try {
    const fieldsData = MASTER_TEMPLATE_DATA.fieldsData;
    if (Array.isArray(fieldsData)) {
      fieldsData.forEach((section: any) => {
        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((field: any) => {
            if (field.id && field.label) {
              // Store both exact label and normalized label (lowercase, no special chars)
              const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
              fieldMap.set(field.id, normalizedLabel);
            }
          });
        }
      });
    }
  } catch (error) {
    console.warn('[FormMatcher] Failed to build master template field map:', error);
  }
  
  return fieldMap;
}

// Cache the master template field map
let masterTemplateFieldMapCache: Map<string, string> | null = null;

function getMasterTemplateFieldMap(): Map<string, string> {
  if (!masterTemplateFieldMapCache) {
    masterTemplateFieldMapCache = buildMasterTemplateFieldMap();
  }
  return masterTemplateFieldMapCache;
}

/**
 * Find master template field ID by matching label
 */
function findMasterTemplateFieldIdByLabel(applicationFieldLabel: string): string | null {
  const masterMap = getMasterTemplateFieldMap();
  const normalizedLabel = applicationFieldLabel.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
  
  // Try exact match first
  for (const [fieldId, masterLabel] of masterMap.entries()) {
    if (masterLabel === normalizedLabel) {
      return fieldId;
    }
  }
  
  // Try contains match
  for (const [fieldId, masterLabel] of masterMap.entries()) {
    if (masterLabel.includes(normalizedLabel) || normalizedLabel.includes(masterLabel)) {
      return fieldId;
    }
  }
  
  return null;
}

/**
 * Smart field matching: tries to match field by label/name to profile data
 * Priority: 1. additionalData (from profile page) 2. basicInfo 3. other fields
 */
function smartMatchField(
  field: FormField,
  userProfile: Partial<UserProfileData>
): any {
  // FIRST PRIORITY: Check additionalData - this contains all fields saved from profile page
  if (userProfile.additional && typeof userProfile.additional === 'object') {
    const additional = userProfile.additional as Record<string, any>;
    
    // Direct match by field ID (most reliable)
    if (additional[field.id] !== undefined && additional[field.id] !== null && additional[field.id] !== '') {
      return additional[field.id];
    }
    
    // Try matching by label (case-insensitive)
    const label = (field.label || '').toLowerCase();
    const labelKey = Object.keys(additional).find(key => {
      const keyLower = key.toLowerCase();
      return keyLower === label || keyLower.includes(label) || label.includes(keyLower);
    });
    if (labelKey && additional[labelKey] !== undefined && additional[labelKey] !== null && additional[labelKey] !== '') {
      return additional[labelKey];
    }
  }

  // SECOND PRIORITY: Match common field patterns from basicInfo
  const label = (field.label || '').toLowerCase();
  const fieldId = (field.id || '').toLowerCase();
  const searchText = `${label} ${fieldId}`;

  // Match common field patterns
  const namePatterns = ['姓名', 'name', 'fullname', 'full name', '中文姓名', '英文姓名'];
  const phonePatterns = ['电话', 'phone', 'mobile', 'tel', '联系电话', '手机'];
  const emailPatterns = ['邮箱', 'email', 'e-mail', '电子邮箱'];
  const birthdayPatterns = ['生日', 'birthday', 'date of birth', '出生日期', '出生年月'];
  const nationalityPatterns = ['国籍', 'nationality', 'country', '国家'];
  const addressPatterns = ['地址', 'address', '住址', '居住地址'];

  // Check name fields
  if (namePatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.basicInfo?.fullName) {
      return userProfile.basicInfo.fullName;
    }
  }

  // Check phone fields
  if (phonePatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.basicInfo?.phone) {
      return userProfile.basicInfo.phone;
    }
  }

  // Check email fields
  if (emailPatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.basicInfo?.email) {
      return userProfile.basicInfo.email;
    }
  }

  // Check birthday fields
  if (birthdayPatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.basicInfo?.birthday) {
      // Convert ISO string to date format if needed
      const date = new Date(userProfile.basicInfo.birthday);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }
  }

  // Check nationality fields
  if (nationalityPatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.basicInfo?.nationality) {
      return userProfile.basicInfo.nationality;
    }
  }

  // Check address fields
  if (addressPatterns.some(pattern => searchText.includes(pattern))) {
    if (userProfile.additional?.address) {
      return userProfile.additional.address;
    }
  }

  // THIRD PRIORITY: For education/experience fields, try to match by type
  if (field.type === 'education' && Array.isArray(userProfile.education) && userProfile.education.length > 0) {
    // Return the most recent education entry
    return userProfile.education[userProfile.education.length - 1];
  }

  if (field.type === 'experience' && Array.isArray(userProfile.experiences) && userProfile.experiences.length > 0) {
    // Return the most recent experience entry
    return userProfile.experiences[userProfile.experiences.length - 1];
  }

  return undefined;
}

/**
 * Maps user profile data to application form fields.
 * Priority: 1. additionalData (from profile page) 2. mapToUserField 3. smart matching
 */
export function autoFillFormFromProfile(
  fields: FormField[],
  userProfile: Partial<UserProfileData>
): ApplicationFormData {
  const filledData: ApplicationFormData = {};

  fields.forEach((field) => {
    let value: any = undefined;
    let matchedBy = '';

    // FIRST PRIORITY: Check additionalData - this contains all fields saved from profile page
    // This should be checked first because profile page saves all field values here
    if (userProfile.additional && typeof userProfile.additional === 'object') {
      const additional = userProfile.additional as Record<string, any>;
      
      // Strategy 1: Direct match by field ID (most reliable)
      if (additional.hasOwnProperty(field.id)) {
        const fieldValue = additional[field.id];
        // Accept any value except undefined/null
        // Note: We skip empty strings here because we don't want to import empty values
        // But the field ID exists, which means the field is present in profile
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          value = fieldValue;
          matchedBy = 'additionalData[field.id]';
        }
      }
      
      // Strategy 2: Match by master template field ID (if application field label matches master template)
      // This is crucial because application forms may use different field IDs but same labels as master template
      if (value === undefined && field.label) {
        const masterFieldId = findMasterTemplateFieldIdByLabel(field.label);
        if (masterFieldId && additional.hasOwnProperty(masterFieldId)) {
          const fieldValue = additional[masterFieldId];
          // Skip empty strings - we only want to import non-empty values
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
            value = fieldValue;
            matchedBy = `additionalData[masterTemplate:${masterFieldId}]`;
          }
        }
      }
      
      // Strategy 3: Match by label directly in additionalData (case-insensitive)
      if (value === undefined && field.label) {
        const label = field.label.toLowerCase().trim();
        const labelKey = Object.keys(additional).find(key => {
          const keyLower = key.toLowerCase().trim();
          // Exact match or contains match
          return keyLower === label || 
                 keyLower.includes(label) || 
                 label.includes(keyLower) ||
                 // Also try matching without spaces/special chars
                 keyLower.replace(/[^a-z0-9\u4e00-\u9fa5]/g, '') === label.replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
        });
        if (labelKey !== undefined && additional.hasOwnProperty(labelKey)) {
          const fieldValue = additional[labelKey];
          // Skip empty strings - we only want to import non-empty values
          if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
            value = fieldValue;
            matchedBy = `additionalData[label:${labelKey}]`;
          }
        }
      }
    }

    // SECOND PRIORITY: Try to use mapToUserField if configured and value not found yet
    if (value === undefined && field.mapToUserField) {
      const mappedValue = getNestedValue(userProfile, field.mapToUserField);
      if (mappedValue !== undefined && mappedValue !== null && mappedValue !== '') {
        value = mappedValue;
        matchedBy = `mapToUserField[${field.mapToUserField}]`;
      }
    }

    // THIRD PRIORITY: If no value found yet, try smart matching
    if (value === undefined) {
      const smartValue = smartMatchField(field, userProfile);
      if (smartValue !== undefined && smartValue !== null && smartValue !== '') {
        value = smartValue;
        matchedBy = 'smartMatch';
      }
    }

    // Only set value if it's not undefined/null/empty string
    // We skip empty strings because we don't want to import empty values
    if (value !== undefined && value !== null && value !== '') {
      filledData[field.id] = value;
      if (matchedBy) {
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        console.log(`[FormMatcher] ✓ Field "${field.id}" (${field.label}) matched by ${matchedBy}:`, displayValue);
      }
    } else {
      // Log why field wasn't matched
      if (value === '') {
        console.log(`[FormMatcher] ✗ Field "${field.id}" (${field.label}) found but value is empty - skipping`);
      } else {
        console.log(`[FormMatcher] ✗ Field "${field.id}" (${field.label}) not matched - no value found`);
        
        // Debug: Check if field ID exists in additionalData
        if (userProfile.additional && typeof userProfile.additional === 'object') {
          const additional = userProfile.additional as Record<string, any>;
          if (additional.hasOwnProperty(field.id)) {
            console.log(`[FormMatcher]   → Field ID exists in additionalData but value is:`, additional[field.id]);
          } else {
            // Try to find by master template
            const masterFieldId = findMasterTemplateFieldIdByLabel(field.label);
            if (masterFieldId) {
              if (additional.hasOwnProperty(masterFieldId)) {
                console.log(`[FormMatcher]   → Master template field "${masterFieldId}" exists but value is:`, additional[masterFieldId]);
              } else {
                console.log(`[FormMatcher]   → Master template field "${masterFieldId}" not found in additionalData`);
              }
            } else {
              console.log(`[FormMatcher]   → No master template field found for label "${field.label}"`);
            }
          }
        }
      }
    }
  });

  console.log(`[FormMatcher] Total matched: ${Object.keys(filledData).length} out of ${fields.length} fields`);
  return filledData;
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

