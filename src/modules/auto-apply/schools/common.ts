import type {
  AutoApplyTemplate,
  AutoApplyTemplateField,
} from "../engine/types";

export type FieldOverrideMap = Record<
  string,
  Partial<Pick<AutoApplyTemplateField, "label" | "htmlType" | "metadata">>
>;

export function remapTemplateFields(
  template: AutoApplyTemplate,
  overrides: FieldOverrideMap,
): AutoApplyTemplateField[] {
  const fieldMap = new Map(template.fields.map((field) => [field.fieldId, field]));
  const result: AutoApplyTemplateField[] = [];

  for (const [fieldId, override] of Object.entries(overrides)) {
    const base = fieldMap.get(fieldId);
    if (!base) {
      continue;
    }
    result.push({
      ...base,
      ...override,
    });
  }

  return result;
}

