import { LocalizedText } from './i18n';

type SchoolNameInput = string | LocalizedText | null | undefined;

const CHILD_COLLECTION_KEYS = ['fields', 'items', 'sections', 'tabs', 'children', 'rows', 'columns', 'steps', 'groups'];

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

function cloneTemplateNode(node: any, valueMap: Record<string, any>): any {
  if (Array.isArray(node)) {
    return node.map((child) => cloneTemplateNode(child, valueMap));
  }

  if (!node || typeof node !== 'object') {
    return node;
  }

  const cloned: any = { ...node };
  let hasChildren = false;

  CHILD_COLLECTION_KEYS.forEach((key) => {
    if (Array.isArray(cloned[key])) {
      hasChildren = true;
      cloned[key] = cloned[key].map((child: any) => cloneTemplateNode(child, valueMap));
    }
  });

  if (!hasChildren && typeof cloned.id === 'string') {
    cloned.value = '';
    if (!(cloned.id in valueMap)) {
      valueMap[cloned.id] = '';
    }
  }

  return cloned;
}

export function buildInitialApplicationFormData(fieldsData: any): {
  structure: any;
  values: Record<string, any>;
  formData: Record<string, any>;
} {
  const values: Record<string, any> = {};
  const baseStructure = Array.isArray(fieldsData)
    ? fieldsData.map((node) => cloneTemplateNode(node, values))
    : fieldsData && typeof fieldsData === 'object'
      ? cloneTemplateNode(fieldsData, values)
      : [];

  const formData = {
    __structure: baseStructure,
    ...values
  };

  return { structure: baseStructure, values, formData };
}

export function ensureFormDataStructure(formData: any, fieldsData: any) {
  const safeFormData = formData && typeof formData === 'object' ? formData : {};
  if (safeFormData.__structure || !fieldsData) {
    return safeFormData;
  }

  const { structure, values } = buildInitialApplicationFormData(fieldsData);

  return {
    ...values,
    ...safeFormData,
    __structure: structure
  };
}
