import { openai } from '@/lib/openai';
import { FormField, UserProfileData, AIGuidance } from '@/types';

/**
 * Check if we should use mock mode (when API key is missing or API fails)
 */
const USE_MOCK_MODE = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '';

/**
 * Generates AI guidance for a specific form field
 */
export async function generateFieldGuidance(
  field: FormField,
  userProfile: Partial<UserProfileData>
): Promise<AIGuidance> {
  // Mock mode: return simulated guidance
  if (USE_MOCK_MODE) {
    return {
      fieldId: field.id,
      explanation: `This field asks for your ${field.label.toLowerCase()}. It's an important part of your application that helps admissions officers understand your background and qualifications.`,
      requirements: [
        field.required ? 'This field is required' : 'This field is optional',
        'Be specific and provide concrete details',
        'Keep your response clear and well-organized'
      ],
      examples: [
        'Use specific examples from your experience',
        'Show your unique perspective and voice',
        'Connect your response to your goals and aspirations'
      ],
      suggestedContent: userProfile.basicInfo?.fullName 
        ? `Consider highlighting aspects that showcase your strengths and align with your goals.` 
        : undefined
    };
  }

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
  // Mock mode: return simulated essay
  if (USE_MOCK_MODE) {
    const userName = userProfile.basicInfo?.fullName || 'the applicant';
    return `Throughout my academic journey, I have always been driven by a deep curiosity and passion for learning. This essay explores my experiences and aspirations for ${field.label.toLowerCase()}.

Growing up, I discovered that challenges are opportunities for growth. Each obstacle I've faced has shaped my perspective and strengthened my determination to make a meaningful impact. Whether through academic pursuits, extracurricular activities, or community involvement, I've learned the value of perseverance and dedication.

My experiences have taught me the importance of collaboration and diverse perspectives. Working with peers from different backgrounds has enriched my understanding and helped me develop strong communication and leadership skills. These experiences have prepared me to contribute meaningfully to a vibrant academic community.

Looking forward, I am excited about the opportunities to expand my knowledge and pursue my goals. I am committed to making the most of every learning opportunity and contributing positively to the community. This next chapter represents not just personal growth, but a chance to create lasting impact through dedication and innovation.

[This is a simulated AI response. Add your OpenAI API key for personalized content generation.]`;
  }

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
  // Mock mode: return simulated improvements
  if (USE_MOCK_MODE) {
    return {
      suggestions: [
        'Consider adding more specific examples to illustrate your points',
        'Strengthen the introduction to better hook the reader',
        'Connect your experiences more explicitly to your future goals',
        'Vary sentence structure for better flow and readability',
        'Add more descriptive details to make your story more vivid'
      ],
      improvedVersion: currentContent + '\n\n[Enhanced version with improved clarity, stronger examples, and better flow. This is a simulated improvement. Add your OpenAI API key for personalized content enhancement.]'
    };
  }

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
  // Mock mode: return simulated chat response
  if (USE_MOCK_MODE) {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    return `Thank you for your question! I'm here to help you with your application. ${
      context.currentField 
        ? `For the "${context.currentField.label}" field, I recommend being specific and authentic in your response.` 
        : 'Feel free to ask me anything about filling out your application.'
    } 

Remember to showcase your unique experiences and perspective. Is there anything specific about this section you'd like help with?

[This is a simulated AI response. Add your OpenAI API key for personalized guidance.]`;
  }

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

