/**
 * Chrome 扩展后台脚本
 * 负责：API调用、数据缓存、消息路由、右键菜单管理
 */

// 配置
// 注意：Chrome 扩展无法直接使用 process.env，需要从存储中读取或使用默认值
// 可以通过 Popup 设置界面配置 API 地址
async function getApiBaseUrl() {
  const result = await chrome.storage.local.get('autofill_api_url');
  // 优先使用用户配置的 URL，否则使用生产环境 URL
  return result.autofill_api_url || 'https://school-application-assistant.vercel.app';
}
const STORAGE_KEYS = {
  USER_TOKEN: 'autofill_user_token',
  MAPPINGS: 'autofill_mappings',
  PROFILE: 'autofill_profile',
  SETTINGS: 'autofill_settings',
};

// 默认字段列表（如果用户未自定义，则使用此列表）
const DEFAULT_PROFILE_FIELDS = [
  { key: 'given_name', label: '名字 (First Name)', category: '基本信息' },
  { key: 'family_name', label: '姓 (Last Name)', category: '基本信息' },
  { key: 'fullName', label: '全名 (Full Name)', category: '基本信息' },
  { key: 'email', label: '邮箱 (Email)', category: '基本信息' },
  { key: 'phone', label: '电话 (Phone)', category: '基本信息' },
  { key: 'dob', label: '出生日期 (Date of Birth)', category: '基本信息' },
  { key: 'birthday', label: '生日 (Birthday)', category: '基本信息' },
  { key: 'nationality', label: '国籍 (Nationality)', category: '基本信息' },
  { key: 'gender', label: '性别 (Gender)', category: '基本信息' },
  { key: 'id_number', label: '身份证号 (ID Number)', category: '基本信息' },
  { key: 'passport', label: '护照号 (Passport)', category: '基本信息' },
  { key: 'address', label: '地址 (Address)', category: '地址信息' },
  { key: 'city', label: '城市 (City)', category: '地址信息' },
  { key: 'state', label: '州/省 (State/Province)', category: '地址信息' },
  { key: 'zip', label: '邮编 (Zip Code)', category: '地址信息' },
  { key: 'country', label: '国家 (Country)', category: '地址信息' },
  { key: 'school_name', label: '学校名称 (School Name)', category: '教育背景' },
  { key: 'degree', label: '学位 (Degree)', category: '教育背景' },
  { key: 'major', label: '专业 (Major)', category: '教育背景' },
  { key: 'gpa', label: 'GPA/成绩 (GPA)', category: '教育背景' },
  { key: 'graduation_date', label: '毕业日期 (Graduation Date)', category: '教育背景' },
  { key: 'education_start', label: '入学日期 (Education Start)', category: '教育背景' },
  { key: 'education_end', label: '毕业日期 (Education End)', category: '教育背景' },
  { key: 'job_title', label: '职位 (Job Title)', category: '工作经历' },
  { key: 'company', label: '公司 (Company)', category: '工作经历' },
  { key: 'work_start', label: '工作开始日期 (Work Start)', category: '工作经历' },
  { key: 'work_end', label: '工作结束日期 (Work End)', category: '工作经历' },
  { key: 'work_description', label: '工作描述 (Work Description)', category: '工作经历' },
  { key: 'personal_statement', label: '个人陈述 (Personal Statement)', category: '文书' },
  { key: 'statement_of_purpose', label: '目的陈述 (Statement of Purpose)', category: '文书' },
  { key: 'essay', label: '短文 (Essay)', category: '文书' },
  { key: 'motivation_letter', label: '动机信 (Motivation Letter)', category: '文书' },
  { key: 'cover_letter', label: '求职信 (Cover Letter)', category: '文书' },
  { key: 'resume', label: '简历 (Resume)', category: '其他' },
  { key: 'cv', label: '履历 (CV)', category: '其他' },
  { key: 'recommendation', label: '推荐信 (Recommendation)', category: '其他' },
  { key: 'reference', label: '推荐人 (Reference)', category: '其他' },
  { key: 'emergency_contact', label: '紧急联系人 (Emergency Contact)', category: '其他' },
  { key: 'emergency_phone', label: '紧急联系电话 (Emergency Phone)', category: '其他' },
  { key: 'parent_name', label: '家长姓名 (Parent Name)', category: '其他' },
  { key: 'parent_phone', label: '家长电话 (Parent Phone)', category: '其他' },
  { key: 'parent_email', label: '家长邮箱 (Parent Email)', category: '其他' },
  { key: 'guardian_name', label: '监护人姓名 (Guardian Name)', category: '其他' },
  { key: 'guardian_phone', label: '监护人电话 (Guardian Phone)', category: '其他' },
];

// 获取字段列表（优先使用用户自定义的）
async function getProfileFields() {
  try {
    const result = await chrome.storage.local.get('autofill_custom_fields');
    if (result.autofill_custom_fields && result.autofill_custom_fields.length > 0) {
      return result.autofill_custom_fields;
    }
  } catch (error) {
    console.error('Get profile fields error:', error);
  }
  return DEFAULT_PROFILE_FIELDS;
}

/**
 * 创建右键菜单
 */
async function createContextMenus() {
  // 清除现有菜单
  chrome.contextMenus.removeAll();

  // 获取字段列表
  const fields = await getProfileFields();

  // 创建右键菜单项
  chrome.contextMenus.create({
    id: 'autofill-bind-field',
    title: '绑定字段到...',
    contexts: ['editable'],
  });

  // 按分类分组创建子菜单
  const grouped = {};
  fields.forEach(field => {
    const category = field.category || '其他';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(field);
  });

  // 为每个分类创建父菜单，然后添加字段
  Object.keys(grouped).sort().forEach(category => {
    const categoryId = `category-${category}`;
    chrome.contextMenus.create({
      id: categoryId,
      parentId: 'autofill-bind-field',
      title: category,
      contexts: ['editable'],
    });

    grouped[category].forEach(field => {
      chrome.contextMenus.create({
        id: `bind-${field.key}`,
        parentId: categoryId,
        title: field.label,
        contexts: ['editable'],
      });
    });
  });

  // 创建分隔符
  chrome.contextMenus.create({
    id: 'autofill-separator',
    type: 'separator',
    contexts: ['editable'],
  });

  // 创建其他操作菜单
  chrome.contextMenus.create({
    id: 'autofill-scan',
    title: '扫描表单字段',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'autofill-fill',
    title: '自动填充表单',
    contexts: ['page'],
  });
}

/**
 * 初始化：创建右键菜单
 */
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

/**
 * 右键菜单点击处理
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('bind-')) {
    // 绑定字段
    const fieldKey = info.menuItemId.replace('bind-', '');
    await handleFieldBinding(tab.id, fieldKey);
  } else if (info.menuItemId === 'autofill-scan') {
    // 扫描表单
    chrome.tabs.sendMessage(tab.id, { action: 'scan' });
  } else if (info.menuItemId === 'autofill-fill') {
    // 自动填充
    await handleAutoFill(tab.id);
  }
});

/**
 * 处理字段绑定
 */
async function handleFieldBinding(tabId, profileField) {
  try {
    // 获取当前选中的字段
    const response = await sendMessageToTab(tabId, { action: 'getContextMenuTarget' });
    if (!response || !response.field) {
      console.error('No field selected');
      return;
    }

    const field = response.field;
    const domain = new URL((await chrome.tabs.get(tabId)).url).hostname;

    // 保存映射到本地存储
    await saveMappingToStorage(domain, field, profileField);

    // 保存映射到后端
    const token = await getStoredToken();
    if (token) {
      await saveMappingToBackend(domain, field, profileField, token);
    }

    // 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '字段绑定成功',
      message: `已将字段 "${field.label || field.placeholder || field.name}" 绑定到 ${profileField}`,
    });
  } catch (error) {
    console.error('Field binding error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '绑定失败',
      message: String(error),
    });
  }
}

/**
 * 处理自动填充
 */
async function handleAutoFill(tabId) {
  try {
    // 1. 扫描字段
    const scanResponse = await sendMessageToTab(tabId, { action: 'scan' });
    if (!scanResponse || !scanResponse.fields) {
      throw new Error('无法扫描表单字段');
    }

    const fields = scanResponse.fields;
    const domain = scanResponse.origin;

    // 2. 获取用户资料
    const profile = await getUserProfile();
    if (!profile) {
      throw new Error('请先登录并设置用户资料');
    }

    // 3. 获取字段映射
    const mappings = await getFieldMappings(domain, fields);

    // 4. 执行填充
    const fillMappings = mappings
      .filter(m => m.mappedField && m.confidence > 0.5)
      .map(m => ({
        selector: m.selector,
        value: getProfileValue(profile, m.mappedField),
        type: m.type,
      }))
      .filter(m => m.value !== null && m.value !== undefined);

    if (fillMappings.length === 0) {
      throw new Error('没有可填充的字段，请先绑定字段');
    }

    // 5. 批量填充
    const fillResponse = await sendMessageToTab(tabId, {
      action: 'fillBatch',
      mappings: fillMappings,
    });

    // 6. 显示结果
    const successCount = fillResponse.results.filter(r => r.success).length;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '填充完成',
      message: `成功填充 ${successCount}/${fillMappings.length} 个字段`,
    });
  } catch (error) {
    console.error('Auto fill error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '填充失败',
      message: String(error),
    });
  }
}

/**
 * 获取字段映射（优先使用本地缓存，然后调用后端）
 */
async function getFieldMappings(domain, fields) {
  // 1. 尝试从本地存储获取
  const localMappings = await getStoredMappings(domain);
  if (localMappings && localMappings.length > 0) {
    return matchFieldsWithMappings(fields, localMappings);
  }

  // 2. 调用后端API进行匹配
  const token = await getStoredToken();
  if (token) {
    try {
      const apiUrl = await getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/autofill/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          domFields: fields,
          domain: domain,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 缓存匹配结果
        if (data.matched) {
          await cacheMappings(domain, data.matched);
          return data.matched;
        }
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  }

  // 3. 返回基础匹配（无映射）
  return fields.map(field => ({
    ...field,
    mappedField: null,
    confidence: 0,
  }));
}

/**
 * 使用本地映射匹配字段
 */
function matchFieldsWithMappings(fields, mappings) {
  return fields.map(field => {
    const mapping = mappings.find(m =>
      m.selector === field.selector ||
      (m.domId && m.domId === field.id) ||
      (m.domName && m.domName === field.name)
    );

    return {
      ...field,
      mappedField: mapping ? mapping.profileField : null,
      confidence: mapping ? 0.99 : 0,
    };
  });
}

/**
 * 从用户资料中获取字段值
 */
function getProfileValue(profile, fieldKey) {
  // 基本信息
  const basicInfo = {
    'given_name': profile.fullName?.split(' ')[0] || null,
    'family_name': profile.fullName?.split(' ').slice(1).join(' ') || null,
    'fullName': profile.fullName || null,
    'email': profile.email || null,
    'phone': profile.phone || null,
    'dob': profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null,
    'birthday': profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null,
    'nationality': profile.nationality || null,
    'gender': profile.additional?.gender || null,
    'id_number': profile.additional?.idNumber || profile.additional?.id_number || null,
    'passport': profile.additional?.passport || null,
  };

  // 地址信息
  const addressInfo = {
    'address': profile.additional?.address || null,
    'city': profile.additional?.city || null,
    'state': profile.additional?.state || profile.additional?.province || null,
    'zip': profile.additional?.zip || profile.additional?.zipCode || profile.additional?.postalCode || null,
    'country': profile.additional?.country || null,
  };

  // 教育背景（从 educationData 数组获取第一条）
  const education = Array.isArray(profile.education) && profile.education.length > 0 
    ? profile.education[0] 
    : (Array.isArray(profile.educationData) && profile.educationData.length > 0 
      ? profile.educationData[0] 
      : null);
  
  const educationInfo = {
    'school_name': education?.schoolName || education?.school_name || null,
    'degree': education?.degree || null,
    'major': education?.major || null,
    'gpa': education?.GPA || education?.gpa || education?.grade || null,
    'graduation_date': education?.endDate ? new Date(education.endDate).toISOString().split('T')[0] : null,
    'education_start': education?.startDate ? new Date(education.startDate).toISOString().split('T')[0] : null,
    'education_end': education?.endDate ? new Date(education.endDate).toISOString().split('T')[0] : null,
  };

  // 工作经历（从 experiencesData 数组获取第一条）
  const experience = Array.isArray(profile.experiences) && profile.experiences.length > 0
    ? profile.experiences[0]
    : (Array.isArray(profile.experiencesData) && profile.experiencesData.length > 0
      ? profile.experiencesData[0]
      : null);
  
  const workInfo = {
    'job_title': experience?.title || experience?.jobTitle || null,
    'company': experience?.organization || experience?.company || null,
    'work_start': experience?.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : null,
    'work_end': experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : null,
    'work_description': experience?.description || null,
  };

  // 文书
  const essays = profile.essays || profile.essaysData || {};
  const essayInfo = {
    'personal_statement': essays.personal_statement || essays.personalStatement || null,
    'statement_of_purpose': essays.statement_of_purpose || essays.statementOfPurpose || null,
    'essay': essays.essay || essays.other || null,
    'motivation_letter': essays.motivation_letter || essays.motivationLetter || null,
    'cover_letter': essays.cover_letter || essays.coverLetter || null,
  };

  // 其他
  const otherInfo = {
    'resume': profile.additional?.resume || null,
    'cv': profile.additional?.cv || null,
    'recommendation': profile.additional?.recommendation || null,
    'reference': profile.additional?.reference || null,
    'emergency_contact': profile.additional?.emergencyContact || profile.additional?.emergency_contact || null,
    'emergency_phone': profile.additional?.emergencyPhone || profile.additional?.emergency_phone || null,
    'parent_name': profile.additional?.parentName || profile.additional?.parent_name || null,
    'parent_phone': profile.additional?.parentPhone || profile.additional?.parent_phone || null,
    'parent_email': profile.additional?.parentEmail || profile.additional?.parent_email || null,
    'guardian_name': profile.additional?.guardianName || profile.additional?.guardian_name || null,
    'guardian_phone': profile.additional?.guardianPhone || profile.additional?.guardian_phone || null,
  };

  // 合并所有字段映射
  const fieldMap = {
    ...basicInfo,
    ...addressInfo,
    ...educationInfo,
    ...workInfo,
    ...essayInfo,
    ...otherInfo,
  };

  return fieldMap[fieldKey] || null;
}

/**
 * 存储管理函数
 */
async function getStoredToken() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.USER_TOKEN);
  return result[STORAGE_KEYS.USER_TOKEN] || null;
}

async function setStoredToken(token) {
  await chrome.storage.local.set({ [STORAGE_KEYS.USER_TOKEN]: token });
}

async function getStoredMappings(domain) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MAPPINGS);
  const allMappings = result[STORAGE_KEYS.MAPPINGS] || {};
  return allMappings[domain] || [];
}

async function saveMappingToStorage(domain, field, profileField) {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MAPPINGS);
  const allMappings = result[STORAGE_KEYS.MAPPINGS] || {};
  if (!allMappings[domain]) {
    allMappings[domain] = [];
  }

  // 检查是否已存在
  const existingIndex = allMappings[domain].findIndex(m =>
    m.selector === field.selector
  );

  const mapping = {
    selector: field.selector,
    domId: field.id,
    domName: field.name,
    profileField: profileField,
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    allMappings[domain][existingIndex] = mapping;
  } else {
    allMappings[domain].push(mapping);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.MAPPINGS]: allMappings });
}

async function cacheMappings(domain, matchedFields) {
  const mappings = matchedFields
    .filter(f => f.mappedField && f.confidence > 0.5)
    .map(f => ({
      selector: f.selector,
      domId: f.id,
      domName: f.name,
      profileField: f.mappedField,
      createdAt: new Date().toISOString(),
    }));

  if (mappings.length > 0) {
    const result = await chrome.storage.local.get(STORAGE_KEYS.MAPPINGS);
    const allMappings = result[STORAGE_KEYS.MAPPINGS] || {};
    allMappings[domain] = mappings;
    await chrome.storage.local.set({ [STORAGE_KEYS.MAPPINGS]: allMappings });
  }
}

async function getUserProfile() {
  // 1. 尝试从缓存获取
  const cached = await chrome.storage.local.get(STORAGE_KEYS.PROFILE);
  if (cached[STORAGE_KEYS.PROFILE]) {
    const profile = cached[STORAGE_KEYS.PROFILE];
    // 检查缓存是否过期（1小时）
    if (profile.cachedAt && (Date.now() - profile.cachedAt < 3600000)) {
      return profile.data;
    }
  }

  // 2. 从API获取
  const token = await getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const apiUrl = await getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.profile) {
        // 缓存结果
        await chrome.storage.local.set({
          [STORAGE_KEYS.PROFILE]: {
            data: data.profile,
            cachedAt: Date.now(),
          },
        });
        return data.profile;
      }
    }
  } catch (error) {
    console.error('Get profile error:', error);
  }

  return null;
}

/**
 * 保存映射到后端
 */
async function saveMappingToBackend(domain, field, profileField, token) {
  try {
    const apiUrl = await getApiBaseUrl();
    await fetch(`${apiUrl}/api/autofill/save-mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        domain: domain,
        selector: field.selector,
        profileField: profileField,
        domId: field.id,
        domName: field.name,
      }),
    });
  } catch (error) {
    console.error('Save mapping to backend error:', error);
  }
}

/**
 * 发送消息到标签页（Promise包装）
 */
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * 推送字段模板到后端
 * @param {string} schoolId - 学校 ID
 * @param {Array} fields - 字段数组
 * @returns {Promise<Object>}
 */
async function pushFieldsToBackend(schoolId, fields) {
  try {
    const apiUrl = await getApiBaseUrl();
    const token = await getStoredToken();
    
    const response = await fetch(`${apiUrl}/api/templates/pushFields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        schoolId,
        fields: fields.map(f => ({
          key: f.key,
          label: f.label || f.name || f.placeholder || f.key,
          type: f.type || 'text',
          description: f.description || null,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to push fields');
    }

    return await response.json();
  } catch (error) {
    console.error('pushFieldsToBackend error:', error);
    throw error;
  }
}

/**
 * 获取学校模板
 * @param {string} schoolId - 学校 ID
 * @returns {Promise<Object>}
 */
async function getSchoolTemplate(schoolId) {
  try {
    const apiUrl = await getApiBaseUrl();
    const token = await getStoredToken();
    
    const response = await fetch(`${apiUrl}/api/templates/${schoolId}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get template');
    }

    const data = await response.json();
    return data.template || data;
  } catch (error) {
    console.error('getSchoolTemplate error:', error);
    throw error;
  }
}

async function listTemplatesFromApi() {
  try {
    const apiUrl = await getApiBaseUrl();
    const token = await getStoredToken();
    const response = await fetch(`${apiUrl}/api/templates`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list templates');
    }

    const data = await response.json();
    if (Array.isArray(data.templates)) {
      return data.templates;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.error('listTemplatesFromApi error:', error);
    return [];
  }
}

/**
 * 获取申请数据
 * @param {string} schoolId - 学校 ID
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>}
 */
async function getApplicationData(schoolId, userId) {
  try {
    const apiUrl = await getApiBaseUrl();
    const token = await getStoredToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${apiUrl}/api/applicationData/${schoolId}/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }

    // 如果找不到学校申请数据，尝试从应用列表中获取
    if (response.status === 404) {
      const fallbackData = await getApplicationDataFromApplicationsApi(schoolId, token);
      return fallbackData;
    }

    let errorMessage = 'Failed to get application data';
    try {
      const error = await response.json();
      if (error?.error) {
        errorMessage = error.error;
      }
    } catch {
      // ignore json parse errors
    }
    throw new Error(errorMessage);
  } catch (error) {
    console.error('getApplicationData error:', error);
    throw error;
  }
}

/**
 * 当 applicationData 表没有记录时，从应用列表中尝试获取对应学校的最新草稿数据
 */
async function getApplicationDataFromApplicationsApi(schoolId, token) {
  try {
    const apiUrl = await getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const applications = data.applications || [];
    const matched = applications.find(app =>
      app.templateSchoolId === schoolId ||
      app.template?.schoolId === schoolId
    );

    if (matched?.formData) {
      return matched.formData;
    }
  } catch (error) {
    console.error('getApplicationDataFromApplicationsApi error:', error);
  }
  return null;
}

/**
 * 保存申请数据
 * @param {string} schoolId - 学校 ID
 * @param {string} userId - 用户 ID
 * @param {Object} data - 申请数据
 * @returns {Promise<Object>}
 */
async function saveApplicationData(schoolId, userId, data) {
  try {
    const apiUrl = await getApiBaseUrl();
    const token = await getStoredToken();
    
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${apiUrl}/api/applicationData/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        schoolId,
        userId,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save application data');
    }

    return await response.json();
  } catch (error) {
    console.error('saveApplicationData error:', error);
    throw error;
  }
}

/**
 * 检测学校 ID（从当前标签页）
 */
async function detectSchoolIdFromTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) {
      return null;
    }

    const url = tab.url;
    
    // 加载用户自定义的映射
    const result = await chrome.storage.local.get('autofill_school_mappings');
    const mappings = result.autofill_school_mappings || [];
    
    // 遍历所有映射，找到第一个匹配的
    for (const mapping of mappings) {
      let matches = false;

      if (mapping.type === 'regex') {
        try {
          const patternStr = mapping.pattern.replace(/^\/|\/[gimuy]*$/g, '');
          const regex = new RegExp(patternStr, 'i');
          matches = regex.test(url);
        } catch (e) {
          console.error('Invalid regex pattern:', mapping.pattern, e);
          continue;
        }
      } else {
        matches = url.toLowerCase().includes(mapping.pattern.toLowerCase());
      }

      if (matches) {
        return mapping.schoolId;
      }
    }

    // 如果没有用户自定义映射，使用默认模式
    const defaultPatterns = [
      { pattern: /ox\.ac\.uk.*msc.*cs/i, schoolId: "oxford_msc_cs" },
      { pattern: /ox\.ac\.uk/i, schoolId: "oxford" },
      { pattern: /gradapply\.mit\.edu\/meche/i, schoolId: "mit_meche" },
      { pattern: /gradapply\.mit\.edu/i, schoolId: "mit_graduate" },
      { pattern: /gradadmissions\.stanford\.edu/i, schoolId: "stanford_graduate" },
      { pattern: /gsas\.harvard\.edu.*apply/i, schoolId: "harvard_graduate" },
      { pattern: /cam\.ac\.uk.*graduate.*apply/i, schoolId: "cambridge_graduate" },
    ];

    for (const { pattern, schoolId } of defaultPatterns) {
      if (pattern.test(url)) {
        return schoolId;
      }
    }

    return null;
  } catch (error) {
    console.error('detectSchoolIdFromTab error:', error);
    return null;
  }
}

/**
 * 消息监听（处理来自popup/content script的消息）
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getProfile') {
    getUserProfile().then(profile => {
      sendResponse({ profile });
    }).catch(err => {
      sendResponse({ error: String(err) });
    });
    return true;
  } else if (msg.action === 'setToken') {
    setStoredToken(msg.token).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (msg.action === 'getMappings') {
    getStoredMappings(msg.domain).then(mappings => {
      sendResponse({ mappings });
    });
    return true;
  } else if (msg.action === 'clearCache') {
    chrome.storage.local.remove([STORAGE_KEYS.PROFILE, STORAGE_KEYS.MAPPINGS]).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (msg.action === 'reloadFields') {
    // 重新加载字段并更新右键菜单
    createContextMenus().then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (msg.action === 'pushFields') {
    // 推送字段模板
    pushFieldsToBackend(msg.schoolId, msg.fields).then(result => {
      sendResponse({ success: true, result });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'getTemplate') {
    // 获取学校模板
    getSchoolTemplate(msg.schoolId).then(template => {
      sendResponse({ success: true, template });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'listTemplates') {
    listTemplatesFromApi().then(templates => {
      sendResponse({ success: true, templates });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'getApplicationData') {
    // 获取申请数据
    getApplicationData(msg.schoolId, msg.userId).then(data => {
      sendResponse({ success: true, data });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'saveApplicationData') {
    // 保存申请数据
    saveApplicationData(msg.schoolId, msg.userId, msg.data).then(result => {
      sendResponse({ success: true, result });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'detectSchoolId') {
    // 检测学校 ID
    detectSchoolIdFromTab(msg.tabId || sender.tab?.id).then(schoolId => {
      sendResponse({ success: true, schoolId });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'triggerFill') {
    // 触发自动填充（新功能：使用学校模板和数据）
    const targetTabId = msg.tabId || sender?.tab?.id;
    if (!targetTabId) {
      sendResponse({ success: false, error: '无法确定需要填充的标签页' });
      return true;
    }
    handleAutoFillWithTemplate(targetTabId, msg.schoolId || null).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  } else if (msg.action === 'reloadSchoolMappings') {
    sendResponse({ success: true });
    return true;
  }
});

/**
 * 使用学校模板和数据自动填充
 */
async function handleAutoFillWithTemplate(tabId, manualSchoolId = null) {
  try {
    // 1. 检测学校 ID（优先使用手动选择的）
    let schoolId = manualSchoolId;
    if (!schoolId) {
      schoolId = await detectSchoolIdFromTab(tabId);
    }
    if (!schoolId) {
      throw new Error('无法自动识别学校，请手动选择');
    }

    // 2. 获取用户 ID
    const token = await getStoredToken();
    if (!token) {
      throw new Error('请先登录');
    }
    
    // 从用户资料中获取 userId
    const profile = await getUserProfile();
    if (!profile || !profile.userId) {
      throw new Error('无法获取用户信息，请先登录并设置用户资料');
    }
    const userId = profile.userId;

    // 3. 获取学校模板
    const template = await getSchoolTemplate(schoolId);
    
    // 4. 获取申请数据
    const applicationData = await getApplicationData(schoolId, userId);
    if (!applicationData) {
      console.warn('No saved application data found, fallback to mapped autofill.');
      await handleAutoFill(tabId);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: '已使用映射填充',
        message: '未找到该学校的申请数据，已使用字段映射直接填充',
      });
      return;
    }

    // 5. 发送填充指令到 content script
    const templateFields = template?.fields || null;
    await sendMessageToTab(tabId, {
      action: 'fillWithData',
      data: applicationData,
      templateFields: templateFields,
    });

    // 6. 显示通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '自动填充完成',
      message: `已为 ${schoolId} 填充 ${Object.keys(applicationData).length} 个字段`,
    });
  } catch (error) {
    console.error('handleAutoFillWithTemplate error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: '自动填充失败',
      message: String(error),
    });
    throw error;
  }
}