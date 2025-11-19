/**
 * URL → schoolId 自动识别机制
 * 
 * 根据当前页面的 URL 自动识别学校 ID
 */

// 默认学校 URL 模式配置（作为后备）
const DEFAULT_SCHOOL_URL_PATTERNS = [
  // Oxford University
  { pattern: /ox\.ac\.uk.*msc.*cs/i, schoolId: "oxford_msc_cs", type: 'regex' },
  { pattern: /ox\.ac\.uk.*graduate/i, schoolId: "oxford_graduate", type: 'regex' },
  { pattern: /ox\.ac\.uk/i, schoolId: "oxford", type: 'regex' },
  
  // MIT
  { pattern: /gradapply\.mit\.edu\/meche/i, schoolId: "mit_meche", type: 'regex' },
  { pattern: /gradapply\.mit\.edu/i, schoolId: "mit_graduate", type: 'regex' },
  { pattern: /mit\.edu.*graduate/i, schoolId: "mit_graduate", type: 'regex' },
  
  // Stanford
  { pattern: /gradadmissions\.stanford\.edu/i, schoolId: "stanford_graduate", type: 'regex' },
  { pattern: /stanford\.edu.*apply/i, schoolId: "stanford_graduate", type: 'regex' },
  
  // Harvard
  { pattern: /gsas\.harvard\.edu.*apply/i, schoolId: "harvard_graduate", type: 'regex' },
  { pattern: /harvard\.edu.*graduate.*apply/i, schoolId: "harvard_graduate", type: 'regex' },
  
  // Cambridge
  { pattern: /cam\.ac\.uk.*graduate.*apply/i, schoolId: "cambridge_graduate", type: 'regex' },
  { pattern: /cam\.ac\.uk/i, schoolId: "cambridge", type: 'regex' },
];

// 缓存的用户自定义映射
let cachedMappings = null;

/**
 * 加载用户自定义的学校映射
 */
async function loadSchoolMappings() {
  if (cachedMappings !== null) {
    return cachedMappings;
  }

  try {
    const result = await chrome.storage.local.get('autofill_school_mappings');
    if (result.autofill_school_mappings && result.autofill_school_mappings.length > 0) {
      const customMappings = result.autofill_school_mappings;
      const defaultMappings = DEFAULT_SCHOOL_URL_PATTERNS
        .filter(defaultPattern => !customMappings.some(m => m.schoolId === defaultPattern.schoolId))
        .map(pattern => ({
          pattern: pattern.pattern.source,
          type: pattern.type,
          schoolId: pattern.schoolId,
        }));

      cachedMappings = [...customMappings, ...defaultMappings];
      return cachedMappings;
    }
  } catch (error) {
    console.error('Load school mappings error:', error);
  }

  // 返回默认映射
  cachedMappings = DEFAULT_SCHOOL_URL_PATTERNS.map(p => ({
    pattern: p.pattern.source,
    type: p.type,
    schoolId: p.schoolId,
  }));
  return cachedMappings;
}

/**
 * 根据 URL 检测学校 ID
 * @param {string} url - 当前页面的 URL
 * @returns {Promise<string|null>} - 检测到的 schoolId，如果未匹配则返回 null
 */
async function detectSchoolId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // 加载映射（优先使用用户自定义的）
  const mappings = await loadSchoolMappings();

  // 遍历所有模式，找到第一个匹配的
  for (const mapping of mappings) {
    let matches = false;

    if (mapping.type === 'regex') {
      try {
        // 如果 pattern 是字符串，转换为正则表达式
        let regex;
        if (typeof mapping.pattern === 'string') {
          // 移除首尾的 / 和标志（如果有）
          const patternStr = mapping.pattern.replace(/^\/|\/[gimuy]*$/g, '');
          regex = new RegExp(patternStr, 'i');
        } else {
          regex = mapping.pattern;
        }
        matches = regex.test(url);
      } catch (e) {
        console.error('Invalid regex pattern:', mapping.pattern, e);
        continue;
      }
    } else {
      // contains 类型
      matches = url.toLowerCase().includes(mapping.pattern.toLowerCase());
    }

    if (matches) {
      return mapping.schoolId;
    }
  }

  return null;
}

/**
 * 清除映射缓存（当用户更新映射时调用）
 */
function clearMappingsCache() {
  cachedMappings = null;
}

// 监听存储变化，确保映射实时生效
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.autofill_school_mappings) {
      clearMappingsCache();
    }
  });
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
    return await detectSchoolId(url);
  } catch (error) {
    console.error('detectSchoolIdFromCurrentTab error:', error);
    return null;
  }
}

/**
 * 添加自定义学校 URL 模式（已废弃，请使用管理界面）
 * @deprecated 请使用 school-mapping-manager.html 界面管理映射
 */
function addSchoolPattern(pattern, schoolId) {
  console.warn('addSchoolPattern is deprecated. Please use the mapping manager interface.');
}

/**
 * 获取所有已配置的学校模式
 * @returns {Promise<Array>} - 学校模式列表
 */
async function getSchoolPatterns() {
  const mappings = await loadSchoolMappings();
  return mappings.map(({ pattern, schoolId, type }) => ({
    pattern: typeof pattern === 'string' ? pattern : pattern.toString(),
    schoolId,
    type,
  }));
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    detectSchoolId,
    detectSchoolIdFromCurrentTab,
    addSchoolPattern,
    getSchoolPatterns,
    loadSchoolMappings,
    clearMappingsCache,
  };
}

// 如果在浏览器环境中，将函数挂载到全局对象
if (typeof window !== 'undefined') {
  window.detectSchool = {
    detectSchoolId,
    detectSchoolIdFromCurrentTab,
    addSchoolPattern,
    getSchoolPatterns,
    loadSchoolMappings,
    clearMappingsCache,
  };
}

