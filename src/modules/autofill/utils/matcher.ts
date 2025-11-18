import { prisma } from "@/lib/prisma";

/**
 * 增强的字段匹配器
 * 支持：用户自定义映射、智能关键字匹配、模糊匹配、上下文分析
 */

// 字段匹配规则（支持中英文）
const FIELD_PATTERNS: Array<{
  keys: string[];
  field: string;
  confidence: number;
  type?: string;
}> = [
  // 名字
  { keys: ['first name', 'given name', '名', '名字', 'firstname', 'givenname'], field: 'given_name', confidence: 0.9 },
  { keys: ['last name', 'family name', 'surname', '姓', '姓氏', 'lastname', 'familyname'], field: 'family_name', confidence: 0.9 },
  { keys: ['full name', '姓名', '全名', 'fullname'], field: 'fullName', confidence: 0.95 },
  
  // 联系信息
  { keys: ['email', 'e-mail', '邮箱', '電子郵件', 'email address'], field: 'email', confidence: 0.95, type: 'email' },
  { keys: ['phone', 'mobile', 'telephone', 'tel', '电话', '電話', '手机', '手機'], field: 'phone', confidence: 0.85, type: 'tel' },
  { keys: ['address', '地址', '住址'], field: 'address', confidence: 0.8 },
  { keys: ['city', '城市', '市'], field: 'city', confidence: 0.75 },
  { keys: ['country', '国家', '國家', 'country of residence'], field: 'country', confidence: 0.8 },
  
  // 日期
  { keys: ['date of birth', 'dob', 'birthday', 'birth date', '出生日期', '生日', '出生年月'], field: 'dob', confidence: 0.85, type: 'date' },
  { keys: ['birthday', '生日'], field: 'birthday', confidence: 0.8, type: 'date' },
  
  // 个人信息
  { keys: ['nationality', '国籍', '國籍'], field: 'nationality', confidence: 0.8 },
  { keys: ['gender', '性别', '性別', 'sex'], field: 'gender', confidence: 0.7 },
  { keys: ['id number', 'id card', '身份证', '身份證', 'passport'], field: 'id_number', confidence: 0.75 },
  
  // 教育背景
  { keys: ['school name', 'school', '学校', '學校', 'high school', 'university'], field: 'school_name', confidence: 0.75 },
  { keys: ['degree', '学位', '學位', 'qualification'], field: 'degree', confidence: 0.7 },
  { keys: ['major', '专业', '專業', 'subject'], field: 'major', confidence: 0.7 },
  { keys: ['gpa', 'grade point average', '成绩', '成績'], field: 'gpa', confidence: 0.7 },
  
  // 文书
  { keys: ['personal statement', 'personal essay', '个人陈述', '個人陳述'], field: 'personal_statement', confidence: 0.8 },
  { keys: ['statement of purpose', 'sop', '目的陈述', '目的陳述'], field: 'statement_of_purpose', confidence: 0.8 },
  { keys: ['essay', '短文', '文章'], field: 'essay', confidence: 0.6 },
  { keys: ['motivation letter', 'motivation', '动机信', '動機信'], field: 'motivation_letter', confidence: 0.75 },
  
  // 其他
  { keys: ['resume', 'cv', 'curriculum vitae', '简历', '履歷'], field: 'resume', confidence: 0.7 },
  { keys: ['recommendation', 'reference', '推荐信', '推薦信'], field: 'recommendation', confidence: 0.7 },
];

/**
 * 主匹配函数
 */
export async function matchFields(domFields: any[], userId: string | null, domain?: string) {
  // 1. 获取用户保存的映射
  let mappings: any[] = [];
  if (userId) {
    try {
      mappings = await prisma.fieldMapping.findMany({
        where: { userId, domain },
      });
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  }

  return domFields.map((field) => {
    // 2. 优先使用用户自定义映射
    const userMapping = findUserMapping(field, mappings);
    if (userMapping) {
      return {
        ...field,
        mappedField: userMapping.profileField,
        confidence: 0.99,
      };
    }

    // 3. 智能匹配
    const match = smartMatch(field);
    return {
      ...field,
      mappedField: match.field,
      confidence: match.confidence,
    };
  });
}

/**
 * 查找用户自定义映射
 */
function findUserMapping(field: any, mappings: any[]) {
  const selector = field.selector || "";
  const domId = field.id || "";
  const domName = field.name || "";

  // 按优先级匹配
  const bySelector = mappings.find((m) => m.selector === selector);
  if (bySelector) return bySelector;

  const byId = mappings.find((m) => m.domId && m.domId === domId);
  if (byId) return byId;

  const byName = mappings.find((m) => m.domName && m.domName === domName);
  if (byName) return byName;

  return null;
}

/**
 * 智能匹配字段
 */
function smartMatch(field: any): { field: string | null; confidence: number } {
  // 收集所有文本信息
  const texts = [
    field.label,
    field.placeholder,
    field.name,
    field.id,
    field.ariaLabel,
  ].filter(Boolean).map(t => t.toLowerCase().trim());

  const combinedText = texts.join(' ');

  // 1. 精确匹配
  for (const pattern of FIELD_PATTERNS) {
    for (const key of pattern.keys) {
      if (combinedText.includes(key)) {
        // 检查字段类型是否匹配
        if (pattern.type && field.type !== pattern.type) {
          // 类型不匹配，降低置信度
          return { field: pattern.field, confidence: pattern.confidence * 0.7 };
        }
        return { field: pattern.field, confidence: pattern.confidence };
      }
    }
  }

  // 2. 模糊匹配（使用简单的包含检查）
  const fuzzyMatches: Array<{ field: string; confidence: number }> = [];
  for (const pattern of FIELD_PATTERNS) {
    for (const key of pattern.keys) {
      // 检查是否包含关键词的一部分
      const keyWords = key.split(' ');
      const matchCount = keyWords.filter(word => 
        combinedText.includes(word) && word.length > 2
      ).length;
      
      if (matchCount > 0 && matchCount === keyWords.length) {
        fuzzyMatches.push({
          field: pattern.field,
          confidence: pattern.confidence * 0.8,
        });
      }
    }
  }

  if (fuzzyMatches.length > 0) {
    // 返回置信度最高的匹配
    fuzzyMatches.sort((a, b) => b.confidence - a.confidence);
    return fuzzyMatches[0];
  }

  // 3. 上下文分析
  const contextMatch = analyzeContext(field);
  if (contextMatch) {
    return contextMatch;
  }

  return { field: null, confidence: 0 };
}

/**
 * 上下文分析
 */
function analyzeContext(field: any): { field: string | null; confidence: number } | null {
  const context = field.context || {};
  const section = (context.section || '').toLowerCase();
  const nearbyFields = (context.nearbyFields || []).map((f: string) => f.toLowerCase());

  // 如果附近有 email 字段，当前字段可能是名字
  if (nearbyFields.some((f: string) => f.includes('email'))) {
    if (field.type === 'text' && !field.mappedField) {
      if (nearbyFields.some((f: string) => f.includes('last') || f.includes('family'))) {
        return { field: 'given_name', confidence: 0.6 };
      }
      if (nearbyFields.some((f: string) => f.includes('first') || f.includes('given'))) {
        return { field: 'family_name', confidence: 0.6 };
      }
    }
  }

  // 根据区块标题推断
  if (section.includes('personal') || section.includes('个人信息') || section.includes('個人信息')) {
    if (field.type === 'text' && !field.mappedField) {
      const text = (field.label || field.placeholder || '').toLowerCase();
      if (text.length < 50 && !text.includes('statement') && !text.includes('essay')) {
        return { field: 'fullName', confidence: 0.5 };
      }
    }
  }

  if (section.includes('contact') || section.includes('联系') || section.includes('聯繫')) {
    if (field.type === 'email') {
      return { field: 'email', confidence: 0.9 };
    }
    if (field.type === 'tel') {
      return { field: 'phone', confidence: 0.85 };
    }
  }

  if (section.includes('education') || section.includes('教育') || section.includes('學歷')) {
    const text = (field.label || field.placeholder || '').toLowerCase();
    if (text.includes('school') || text.includes('学校') || text.includes('學校')) {
      return { field: 'school_name', confidence: 0.7 };
    }
  }

  return null;
}

/**
 * 计算字符串相似度（简单的 Levenshtein 距离）
 */
function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein 距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

