import { LocalizedText } from './i18n';

type SchoolNameInput = string | LocalizedText | null | undefined;

export const TEMPLATE_CHILD_COLLECTION_KEYS = [
  'fields',
  'items',
  'sections',
  'tabs',
  'children',
  'rows',
  'columns',
  'steps',
  'groups'
] as const;

export type TemplateChildKey = (typeof TEMPLATE_CHILD_COLLECTION_KEYS)[number];

export interface TemplateNode {
  id: string;
  label?: string;
  type?: string;
  value?: string | number | boolean | null;
  fields?: TemplateNode[];
  items?: TemplateNode[];
  sections?: TemplateNode[];
  tabs?: TemplateNode[];
  children?: TemplateNode[];
  rows?: TemplateNode[];
  columns?: TemplateNode[];
  steps?: TemplateNode[];
  groups?: TemplateNode[];
  [key: string]: unknown;
}

export interface StructuredFormData {
  __structure?: TemplateNode[] | TemplateNode;
  [fieldId: string]: any;
}

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

function parsePossibleJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function coerceTemplateNode(value: unknown): TemplateNode | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as TemplateNode;
  }
  return undefined;
}

export function normalizeTemplateStructureInput(fieldsData?: unknown): TemplateNode[] {
  if (fieldsData === undefined || fieldsData === null) {
    return [];
  }

  let normalizedInput: unknown = fieldsData;
  if (typeof fieldsData === 'string') {
    normalizedInput = parsePossibleJson(fieldsData) ?? fieldsData;
  }

  if (Array.isArray(normalizedInput)) {
    return normalizedInput
      .map((item) => coerceTemplateNode(item))
      .filter((item): item is TemplateNode => Boolean(item));
  }

  const singleNode = coerceTemplateNode(normalizedInput);
  return singleNode ? [singleNode] : [];
}

function cloneTemplateNode(
  node: TemplateNode,
  valueMap: Record<string, string | number | boolean | null>
): TemplateNode {
  const cloned: TemplateNode = { ...node };
  let hasChildren = false;

  TEMPLATE_CHILD_COLLECTION_KEYS.forEach((key) => {
    const children = cloned[key];
    if (Array.isArray(children)) {
      hasChildren = true;
      cloned[key] = children.map((child) => cloneTemplateNode(child, valueMap));
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

export function buildInitialApplicationFormData(
  fieldsData?: TemplateNode[] | TemplateNode | null
): {
  structure: TemplateNode[];
  values: Record<string, string | number | boolean | null>;
  formData: StructuredFormData;
} {
  const values: Record<string, string | number | boolean | null> = {};
  const normalizedInput = normalizeTemplateStructureInput(fieldsData);
  const structure = normalizedInput.map((node) => cloneTemplateNode(node, values));

  const formData: StructuredFormData = {
    __structure: structure,
    ...values
  };

  return { structure, values, formData };
}

export function ensureFormDataStructure(
  formData: StructuredFormData | undefined,
  fieldsData?: TemplateNode[] | TemplateNode | null
): StructuredFormData {
  const safeFormData: StructuredFormData =
    formData && typeof formData === 'object' ? formData : {};
  const normalizedStructure = normalizeTemplateStructureInput(fieldsData);
  if (safeFormData.__structure || normalizedStructure.length === 0) {
    return safeFormData;
  }

  const { structure, values } = buildInitialApplicationFormData(normalizedStructure);

  return {
    ...values,
    ...safeFormData,
    __structure: structure
  };
}
