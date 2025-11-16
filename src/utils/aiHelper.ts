import { openai } from '@/lib/openai';
import { FormField, UserProfileData, AIGuidance } from '@/types';

/**
 * Generates AI guidance for a specific form field
 */
export async function generateFieldGuidance(
  field: FormField,
  userProfile: Partial<UserProfileData>
): Promise<AIGuidance> {
  const prompt = `You are an expert college application advisor. Help the user understand and fill out this application field.

Field Label: ${field.label}
Field Type: ${field.type}
Required: ${field.required ? 'Yes' : 'No'}
${field.helpText ? `Help Text: ${field.helpText}` : ''}
${field.aiFillRule ? `AI Fill Rule: ${field.aiFillRule}` : ''}

User's Profile Information:
${JSON.stringify(userProfile, null, 2)}

Please provide:
1. A clear explanation of what this field is asking for
2. Specific requirements or format expectations
3. 2-3 brief examples or tips
${userProfile ? '4. A suggested response based on the user\'s profile (if applicable)' : ''}

Format your response as JSON with keys: explanation, requirements (array), examples (array), suggestedContent (string or null)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful college application advisor. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const guidance = JSON.parse(content);
    
    return {
      fieldId: field.id,
      explanation: guidance.explanation || '',
      requirements: guidance.requirements || [],
      examples: guidance.examples || [],
      suggestedContent: guidance.suggestedContent || undefined
    };
  } catch (error) {
    console.error('Error generating field guidance:', error);
    
    // Fallback guidance
    return {
      fieldId: field.id,
      explanation: `Please provide your ${field.label.toLowerCase()}.`,
      requirements: field.required ? ['This field is required'] : [],
      examples: []
    };
  }
}

/**
 * Generates essay content based on user profile and field requirements
 */
export async function generateEssayContent(
  field: FormField,
  userProfile: Partial<UserProfileData>,
  additionalPrompt?: string
): Promise<string> {
  const prompt = `You are an expert essay writer for college applications. Generate a high-quality essay draft.

Essay Prompt: ${field.label}
${field.helpText ? `Additional Context: ${field.helpText}` : ''}
${field.maxLength ? `Maximum Length: ${field.maxLength} characters` : ''}
${additionalPrompt ? `User's Additional Requirements: ${additionalPrompt}` : ''}

User's Background:
- Full Name: ${userProfile.basicInfo?.fullName || 'Not provided'}
- Education: ${JSON.stringify(userProfile.education || [])}
- Experiences: ${JSON.stringify(userProfile.experiences || [])}
- Previous Essays: ${JSON.stringify(userProfile.essays || {})}

Please write a well-structured essay that:
1. Has a clear introduction that hooks the reader
2. Develops the main points with specific examples from the user's background
3. Shows personal growth and motivation
4. Connects to future goals
5. Has a strong conclusion

Write in first person and maintain an authentic, personal voice. The essay should be compelling and memorable.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert college essay writer. Write compelling, authentic essays that showcase the applicant\'s unique story.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: field.maxLength ? Math.min(field.maxLength * 1.2, 4000) : 2000,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating essay:', error);
    throw new Error('Failed to generate essay content');
  }
}

/**
 * Provides AI-powered suggestions to improve existing content
 */
export async function improveContent(
  field: FormField,
  currentContent: string,
  userProfile: Partial<UserProfileData>
): Promise<{ suggestions: string[]; improvedVersion: string }> {
  const prompt = `You are an expert college application advisor reviewing an essay or response.

Field: ${field.label}
Current Content:
"${currentContent}"

User's Background:
${JSON.stringify(userProfile, null, 2)}

Please provide:
1. 3-5 specific suggestions for improvement
2. An improved version of the content

Format as JSON with keys: suggestions (array of strings), improvedVersion (string)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert editor for college applications. Provide constructive feedback. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error improving content:', error);
    throw new Error('Failed to improve content');
  }
}

/**
 * AI chatbot for general application guidance
 */
export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  context: {
    userProfile?: Partial<UserProfileData>;
    currentField?: FormField;
    applicationData?: any;
  }
): Promise<string> {
  const systemMessage = `You are a helpful and knowledgeable college application assistant. Your role is to:
1. Guide users through filling out their application forms
2. Explain what information is needed for each field
3. Provide examples and suggestions
4. Help users craft compelling essays and responses
5. Answer questions about the application process

Current Context:
${context.userProfile ? `User Profile: ${JSON.stringify(context.userProfile)}` : ''}
${context.currentField ? `Current Field: ${context.currentField.label} (${context.currentField.type})` : ''}

Be friendly, encouraging, and provide actionable advice.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw new Error('Failed to get AI response');
  }
}

