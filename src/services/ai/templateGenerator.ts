import { openai } from '@/lib/openai';
import type { FormField } from '@/types';

export interface GeneratedTemplate {
  schoolName: string;
  fields: FormField[];
}

/**
 * Generate template JSON from raw form content (HTML, text, etc.)
 * Uses LLM to analyze and extract form structure
 */
export async function generateTemplateFromFormContent(
  rawContent: string,
  sourceType: 'url' | 'pdf' | 'docx' = 'url'
): Promise<{ template: GeneratedTemplate; confidence: number; fieldCount: number }> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are an expert at analyzing school application forms and extracting structured field information.

Your task is to analyze the provided form content and generate a JSON template that matches this exact schema:

{
  "schoolName": "string (extracted from the form or inferred)",
  "fields": [
    {
      "id": "string (snake_case, unique identifier)",
      "label": "string (the field label as it appears)",
      "type": "text" | "number" | "date" | "select" | "checkbox" | "radio" | "file" | "textarea" | "email" | "tel",
      "required": boolean,
      "options": string[] (only if type is "select" or "radio"),
      "placeholder": "string (optional)",
      "helpText": "string (optional, any help text or description)",
      "maxLength": number (optional, for text/textarea fields)
    }
  ]
}

Field type mapping rules:
- text: Single-line text input
- number: Numeric input
- date: Date picker
- select: Dropdown with options
- checkbox: Checkbox input
- radio: Radio button group
- file: File upload input
- textarea: Multi-line text input
- email: Email input
- tel: Phone number input

Important:
1. Extract ALL form fields you can identify
2. Determine if fields are required (look for asterisks, "required" text, etc.)
3. For select/radio fields, extract all available options
4. Use descriptive, unique IDs in snake_case format
5. Preserve original labels exactly as they appear
6. Infer field types from context and labels
7. Extract any placeholder text or help text`;

  const userPrompt = `Analyze the following ${sourceType === 'url' ? 'HTML form' : sourceType === 'pdf' ? 'PDF document' : 'Word document'} content and extract all form fields:

${rawContent.substring(0, 15000)}${rawContent.length > 15000 ? '\n\n[... content truncated for brevity ...]' : ''}

Generate the JSON template following the schema exactly. Be thorough and extract all fields you can identify.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(responseContent);
    
    // Validate and normalize the response
    const template: GeneratedTemplate = {
      schoolName: parsed.schoolName || 'Unknown School',
      fields: Array.isArray(parsed.fields) ? parsed.fields.map((field: any) => ({
        id: field.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: field.label || 'Unnamed Field',
        type: field.type || 'text',
        required: Boolean(field.required),
        options: field.options || undefined,
        placeholder: field.placeholder || undefined,
        helpText: field.helpText || undefined,
        maxLength: field.maxLength || undefined
      })) : []
    };

    // Calculate confidence based on field count and completeness
    const fieldCount = template.fields.length;
    const hasRequiredInfo = template.schoolName !== 'Unknown School';
    const confidence = Math.min(0.95, 0.5 + (fieldCount * 0.05) + (hasRequiredInfo ? 0.2 : 0));

    return {
      template,
      confidence,
      fieldCount
    };
  } catch (error) {
    console.error('Template generation error:', error);
    throw new Error(`Failed to generate template: ${(error as Error).message}`);
  }
}

