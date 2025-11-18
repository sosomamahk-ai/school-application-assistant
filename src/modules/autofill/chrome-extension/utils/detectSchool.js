/**
 * URL → schoolId 自动识别机制
 * 
 * 根据当前页面的 URL 自动识别学校 ID
 */

// 学校 URL 模式配置
const SCHOOL_URL_PATTERNS = [
  // Oxford University
  { pattern: /ox\.ac\.uk.*msc.*cs/i, schoolId: "oxford_msc_cs" },
  { pattern: /ox\.ac\.uk.*graduate/i, schoolId: "oxford_graduate" },
  { pattern: /ox\.ac\.uk/i, schoolId: "oxford" },
  
  // MIT
  { pattern: /gradapply\.mit\.edu\/meche/i, schoolId: "mit_meche" },
  { pattern: /gradapply\.mit\.edu/i, schoolId: "mit_graduate" },
  { pattern: /mit\.edu.*graduate/i, schoolId: "mit_graduate" },
  
  // Stanford
  { pattern: /gradadmissions\.stanford\.edu/i, schoolId: "stanford_graduate" },
  { pattern: /stanford\.edu.*apply/i, schoolId: "stanford_graduate" },
  
  // Harvard
  { pattern: /gsas\.harvard\.edu.*apply/i, schoolId: "harvard_graduate" },
  { pattern: /harvard\.edu.*graduate.*apply/i, schoolId: "harvard_graduate" },
  
  // Cambridge
  { pattern: /cam\.ac\.uk.*graduate.*apply/i, schoolId: "cambridge_graduate" },
  { pattern: /cam\.ac\.uk/i, schoolId: "cambridge" },
  
  // 可以添加更多学校模式...
];

/**
 * 根据 URL 检测学校 ID
 * @param {string} url - 当前页面的 URL
 * @returns {string|null} - 检测到的 schoolId，如果未匹配则返回 null
 */
function detectSchoolId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // 遍历所有模式，找到第一个匹配的
  for (const { pattern, schoolId } of SCHOOL_URL_PATTERNS) {
    if (pattern.test(url)) {
      return schoolId;
    }
  }

  return null;
}

/**
 * 从当前标签页获取学校 ID
 * @returns {Promise<string|null>} - 检测到的 schoolId
 */
async function detectSchoolIdFromCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      return null;
    }

    const url = tabs[0].url;
    return detectSchoolId(url);
  } catch (error) {
    console.error('detectSchoolIdFromCurrentTab error:', error);
    return null;
  }
}

/**
 * 添加自定义学校 URL 模式
 * @param {RegExp|string} pattern - URL 匹配模式（正则表达式或字符串）
 * @param {string} schoolId - 对应的学校 ID
 */
function addSchoolPattern(pattern, schoolId) {
  const regexPattern = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  SCHOOL_URL_PATTERNS.push({ pattern: regexPattern, schoolId });
}

/**
 * 获取所有已配置的学校模式
 * @returns {Array} - 学校模式列表
 */
function getSchoolPatterns() {
  return SCHOOL_URL_PATTERNS.map(({ pattern, schoolId }) => ({
    pattern: pattern.toString(),
    schoolId,
  }));
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectSchoolId,
    detectSchoolIdFromCurrentTab,
    addSchoolPattern,
    getSchoolPatterns,
    SCHOOL_URL_PATTERNS,
  };
}

// 如果在浏览器环境中，将函数挂载到全局对象
if (typeof window !== 'undefined') {
  window.detectSchool = {
    detectSchoolId,
    detectSchoolIdFromCurrentTab,
    addSchoolPattern,
    getSchoolPatterns,
    SCHOOL_URL_PATTERNS,
  };
}

