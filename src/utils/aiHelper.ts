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
      explanation: `该字段用于填写“${field.label}”，帮助招生官了解你的背景与优势。`,
      requirements: [
        field.required ? '此字段为必填项' : '此字段为选填项',
        '内容需具体，尽量提供可量化的事实',
        '结构清晰，突出重点'
      ],
      examples: [
        '结合个人经历举例说明',
        '强调与你申请方向相关的能力或成果',
        '保持语言真诚、自然'
      ],
      suggestedContent: userProfile.basicInfo?.fullName 
        ? '可以结合个人经历，突出你的核心竞争力与未来规划。' 
        : undefined
    };
  }

  const prompt = `你是一名资深的留学申请顾问，请使用简体中文帮助申请者理解并填写以下字段。

字段名称：${field.label}
字段类型：${field.type}
是否必填：${field.required ? '是' : '否'}
${field.helpText ? `额外提示：${field.helpText}` : ''}
${field.aiFillRule ? `AI 填写规则：${field.aiFillRule}` : ''}

申请者背景信息：
${JSON.stringify(userProfile, null, 2)}

请按照 JSON 结构返回以下内容（必须使用 explanation, requirements, examples, suggestedContent 四个键）：
1. explanation：详细说明该字段需要填写的内容与目的
2. requirements：列出 3-4 条填写要求或格式建议
3. examples：提供 2-3 条简短示例或提示
4. suggestedContent：若根据用户资料可生成参考答案，请提供；否则返回 null

务必使用简体中文输出 JSON。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一名专业的留学申请顾问。无论何时都必须输出合法 JSON，并且使用简体中文。'
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
      explanation: `请填写你的「${field.label}」。`,
      requirements: field.required ? ['该字段为必填项'] : [],
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
    const userName = userProfile.basicInfo?.fullName || '申请者';
    return `在我的求学历程中，好奇心与求知欲始终驱动着我不断探索。以下是一篇围绕“${field.label}”主题的示例文章，展示我如何结合个人经历与未来规划：

自幼我便相信，挑战是成长的起点。每一次困难都塑造了我坚韧的性格，也让我更加坚定地追求能够真正创造价值的目标。不论是在课堂、社团还是社区服务中，我都学会了如何自我驱动，并在合作中找到前进的力量。

这些经历不仅培养了我系统思考与沟通协作的能力，也帮助我明确了未来方向。我希望在更广阔的舞台上，将个人热情与社会责任结合，持续创造积极影响。

展望未来，我期待在贵校学习，与来自世界各地的同学共同成长，拓展视野并实践所学。无论遇到何种挑战，我都将以开放与坚定的态度迎接，让每一次努力都成为走向理想的脚步。

[以上内容为模拟示例，接入 OpenAI API Key 后即可获得基于个人背景的专属文本。]`;
  }

  const prompt = `你是一名资深的申请文书导师，请使用简体中文撰写一篇高质量草稿。

题目：${field.label}
${field.helpText ? `题目补充：${field.helpText}` : ''}
${field.maxLength ? `字数上限：${field.maxLength} 字符` : ''}
${additionalPrompt ? `申请者额外要求：${additionalPrompt}` : ''}

申请者背景：
- 姓名：${userProfile.basicInfo?.fullName || '未提供'}
- 教育经历：${JSON.stringify(userProfile.education || [])}
- 重要经历：${JSON.stringify(userProfile.experiences || [])}
- 既有文书：${JSON.stringify(userProfile.essays || {})}

写作要求：
1. 首段点题并吸引读者
2. 结合具体经历展开论述，体现成长
3. 说明优势、动机与未来目标
4. 语言真诚、有个人特色
5. 结尾呼应主题，给人以希望

全篇必须使用第一人称，语气真挚自然，并使用简体中文输出。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一名专业的文书写作者，请始终使用简体中文，文章需真诚且富有感染力。'
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
        '补充更具体的细节或数据，以增强说服力',
        '优化开头句式，使主题更突出',
        '明确点出该经历与你的目标之间的联系',
        '适当调整段落结构，提升行文节奏',
        '加入感受或反思，增强个人色彩'
      ],
      improvedVersion: `${currentContent}\n\n[此处为模拟改写示例，接入 OpenAI API Key 后可获得针对你内容的专属优化版本。]`
    };
  }

  const prompt = `你是一名留学申请写作指导老师，请使用简体中文审阅并优化以下内容。

字段：${field.label}
当前内容：
"${currentContent}"

申请者背景：
${JSON.stringify(userProfile, null, 2)}

请输出合法 JSON（键名必须为 suggestions 与 improvedVersion）：
1. suggestions：提供 3-5 条具体的修改建议
2. improvedVersion：根据建议给出完整的优化版本

所有说明必须使用简体中文。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一名专业编辑，请输出合法 JSON，并始终使用简体中文提供建议与改写内容。'
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
    return `感谢你的提问！我会用中文协助你完善申请材料。${
      context.currentField 
        ? `针对“${context.currentField.label}”这一字段，建议你结合真实经历，突出个人特点。`
        : '如果你对申请流程或填表有任何疑问，随时告诉我。'
    }

请多展示独特的经历与思考。如果你能提供更具体的问题或内容，我可以给出更精准的建议。

[当前为模拟应答，接入 OpenAI API Key 后即可获得个性化指导。]`;
  }

  const systemMessage = `你是一名专业且友善的申请顾问，必须使用简体中文回答。职责包括：
1. 指导用户填写各项申请表格
2. 解释每个字段需要提供的具体信息
3. 给出示例、灵感与优化建议
4. 帮助润色和提升申请文书
5. 回答与申请流程相关的问题

当前上下文：
${context.userProfile ? `用户资料：${JSON.stringify(context.userProfile)}` : ''}
${context.currentField ? `当前字段：${context.currentField.label}（${context.currentField.type}）` : ''}

请使用积极鼓励的语气，并提供可操作的建议。`;

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

