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
  console.log(`[LLM Template] Starting template generation from ${sourceType}. Content length: ${rawContent.length} chars`);
  
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Raw content is empty. Cannot generate template from empty content.');
  }

  // Check if OpenAI is configured
  if (!openai) {
    console.error(`[LLM Template] OpenAI API key not configured`);
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Truncate content if too long (LLM has token limits)
  const maxContentLength = 15000;
  const truncatedContent = rawContent.length > maxContentLength 
    ? rawContent.substring(0, maxContentLength) + '\n\n[... content truncated for brevity ...]'
    : rawContent;
  
  console.log(`[LLM Template] Using ${truncatedContent.length} chars for LLM prompt`);

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
7. Extract any placeholder text or help text

Return ONLY valid JSON, no additional text or explanation.`;

  const userPrompt = `Analyze the following ${sourceType === 'url' ? 'HTML form' : sourceType === 'pdf' ? 'PDF document' : 'Word document'} content and extract all form fields:

${truncatedContent}

Generate the JSON template following the schema exactly. Be thorough and extract all fields you can identify.`;

  try {
    console.log(`[LLM Template] Sending request to OpenAI (model: gpt-4o-mini)...`);
    const requestStartTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    const requestTime = Date.now() - requestStartTime;
    console.log(`[LLM Template] OpenAI request completed in ${requestTime}ms`);

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.error(`[LLM Template] No response content from OpenAI`);
      throw new Error('No response from OpenAI. The API did not return any content.');
    }

    console.log(`[LLM Template] Received response. Length: ${responseContent.length} chars`);
    console.log(`[LLM Template] Response preview: ${responseContent.substring(0, 200)}...`);

    let parsed: any;
    try {
      parsed = JSON.parse(responseContent);
      console.log(`[LLM Template] Successfully parsed JSON response`);
    } catch (parseError) {
      console.error(`[LLM Template] Failed to parse JSON response: ${(parseError as Error).message}`);
      console.error(`[LLM Template] Response content: ${responseContent}`);
      throw new Error(`Failed to parse LLM response as JSON: ${(parseError as Error).message}`);
    }
    
    // Validate and normalize the response
    const template: GeneratedTemplate = {
      schoolName: parsed.schoolName || 'Unknown School',
      fields: Array.isArray(parsed.fields) ? parsed.fields.map((field: any, index: number) => ({
        id: field.id || `field_${Date.now()}_${index}`,
        label: field.label || 'Unnamed Field',
        type: field.type || 'text',
        required: Boolean(field.required),
        options: field.options || undefined,
        placeholder: field.placeholder || undefined,
        helpText: field.helpText || undefined,
        maxLength: field.maxLength || undefined
      })) : []
    };

    console.log(`[LLM Template] Generated template with ${template.fields.length} fields for school: ${template.schoolName}`);

    // Calculate confidence based on field count and completeness
    const fieldCount = template.fields.length;
    const hasRequiredInfo = template.schoolName !== 'Unknown School';
    const confidence = Math.min(0.95, 0.5 + (fieldCount * 0.05) + (hasRequiredInfo ? 0.2 : 0));

    console.log(`[LLM Template] Template generation completed. Confidence: ${confidence.toFixed(2)}, Fields: ${fieldCount}`);

    return {
      template,
      confidence,
      fieldCount
    };
  } catch (error) {
    console.error(`[LLM Template] Template generation error: ${(error as Error).message}`);
    console.error(`[LLM Template] Stack: ${(error as Error).stack}`);
    
    const errorStatus = (error as any).status || (error as any).response?.status;
    const errorCode = (error as any).code;
    const errorMessage = (error as Error).message;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;
    
    // Log additional debug information
    console.error(`[LLM Template] Error details:`, {
      message: errorMessage,
      status: errorStatus,
      code: errorCode,
      baseURL: baseURL || 'not set (using default)',
      type: error?.constructor?.name || 'Unknown'
    });
    
    // Handle connection errors specifically
    if (errorMessage.includes('Connection error') || 
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ETIMEDOUT') {
      
      let connectionErrorMsg = '无法连接到 OpenAI API。';
      
      if (baseURL) {
        connectionErrorMsg += `\n\n代理配置：${baseURL}`;
        connectionErrorMsg += `\n\n可能的原因：`;
        connectionErrorMsg += `\n1. 代理服务器可能无法访问（检查 Cloudflare Workers 是否正常运行）`;
        connectionErrorMsg += `\n2. 代理 URL 配置可能不正确（检查 OPENAI_BASE_URL 是否正确）`;
        connectionErrorMsg += `\n3. 网络连接问题（检查网络连接）`;
        connectionErrorMsg += `\n4. Cloudflare Workers 代码可能有问题（检查 Worker 代码）`;
        connectionErrorMsg += `\n\n请检查：`;
        connectionErrorMsg += `\n- 测试代理 URL 是否可以访问：curl ${baseURL}/health（如果 Worker 有健康检查端点）`;
        connectionErrorMsg += `\n- 检查 Cloudflare Workers 日志`;
        connectionErrorMsg += `\n- 验证 OPENAI_BASE_URL 配置是否正确`;
      } else {
        connectionErrorMsg += `\n\n未配置代理。如果遇到地区限制，请配置 OPENAI_BASE_URL 环境变量。`;
      }
      
      console.error(`[LLM Template] Connection error: ${connectionErrorMsg}`);
      throw new Error(connectionErrorMsg);
    }
    
    // Provide more specific error messages
    if (errorStatus === 403 || errorMessage.includes('Country, region, or territory not supported')) {
      const detailedMessage = 'OpenAI API is not available in your country/region. ' +
        'Solutions: 1) Use a VPN/proxy service, 2) Configure OpenAI API proxy in environment variables, ' +
        '3) Use Azure OpenAI Service (if available in your region), ' +
        '4) Contact your administrator for proxy configuration. ' +
        'For proxy setup, set OPENAI_BASE_URL environment variable (e.g., https://your-proxy.com/v1).';
      console.error(`[LLM Template] Region restriction error: ${detailedMessage}`);
      throw new Error(detailedMessage);
    }
    if (errorCode === 'insufficient_quota' || errorMessage.includes('insufficient_quota')) {
      throw new Error('OpenAI API quota exceeded. Please check your API key and billing at platform.openai.com/account/billing');
    }
    if (errorCode === 'invalid_api_key' || errorMessage.includes('Invalid API key') || errorStatus === 401) {
      throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
    }
    if (errorStatus === 429 || errorMessage.includes('rate limit')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later or upgrade your plan.');
    }
    if (errorStatus === 500 || errorCode === 'internal_error') {
      throw new Error('OpenAI API internal error. Please try again later.');
    }
    
    // Generic error with more context
    throw new Error(`Failed to generate template: ${errorMessage}`);
  }
}

