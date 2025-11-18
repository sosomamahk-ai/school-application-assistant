/**
 * Chrome 扩展后台脚本
 * 负责：API调用、数据缓存、消息路由、右键菜单管理
 */

// 配置
// 注意：Chrome 扩展无法直接使用 process.env，需要从存储中读取或使用默认值
// 可以通过 Popup 设置界面配置 API 地址
async function getApiBaseUrl() {
  const result = await chrome.storage.local.get('autofill_api_url');
  return result.autofill_api_url || 'http://localhost:3000';
}
const STORAGE_KEYS = {
  USER_TOKEN: 'autofill_user_token',
  MAPPINGS: 'autofill_mappings',
  PROFILE: 'autofill_profile',
  SETTINGS: 'autofill_settings',
};

// 可用的字段类型（用于右键菜单）
const PROFILE_FIELDS = [
  { key: 'given_name', label: '名字 (First Name)' },
  { key: 'family_name', label: '姓 (Last Name)' },
  { key: 'fullName', label: '全名 (Full Name)' },
  { key: 'email', label: '邮箱 (Email)' },
  { key: 'phone', label: '电话 (Phone)' },
  { key: 'dob', label: '出生日期 (Date of Birth)' },
  { key: 'birthday', label: '生日 (Birthday)' },
  { key: 'nationality', label: '国籍 (Nationality)' },
  { key: 'personal_statement', label: '个人陈述 (Personal Statement)' },
  { key: 'statement_of_purpose', label: '目的陈述 (Statement of Purpose)' },
  { key: 'school_name', label: '学校名称 (School Name)' },
  { key: 'address', label: '地址 (Address)' },
  { key: 'city', label: '城市 (City)' },
  { key: 'country', label: '国家 (Country)' },
];

/**
 * 初始化：创建右键菜单
 */
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单项
  chrome.contextMenus.create({
    id: 'autofill-bind-field',
    title: '绑定字段到...',
    contexts: ['editable'],
  });

  // 为每个字段类型创建子菜单
  PROFILE_FIELDS.forEach(field => {
    chrome.contextMenus.create({
      id: `bind-${field.key}`,
      parentId: 'autofill-bind-field',
      title: field.label,
      contexts: ['editable'],
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
      iconUrl: 'icons/icon48.png',
      title: '字段绑定成功',
      message: `已将字段 "${field.label || field.placeholder || field.name}" 绑定到 ${profileField}`,
    });
  } catch (error) {
    console.error('Field binding error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
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
      iconUrl: 'icons/icon48.png',
      title: '填充完成',
      message: `成功填充 ${successCount}/${fillMappings.length} 个字段`,
    });
  } catch (error) {
    console.error('Auto fill error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
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
  const fieldMap = {
    'given_name': profile.fullName?.split(' ')[0] || null,
    'family_name': profile.fullName?.split(' ').slice(1).join(' ') || null,
    'fullName': profile.fullName || null,
    'email': profile.email || null,
    'phone': profile.phone || null,
    'dob': profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null,
    'birthday': profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null,
    'nationality': profile.nationality || null,
    'personal_statement': profile.essays?.personal_statement || profile.essays?.personalStatement || null,
    'statement_of_purpose': profile.essays?.statement_of_purpose || profile.essays?.statementOfPurpose || null,
    'school_name': profile.education?.[0]?.schoolName || null,
    'address': profile.additional?.address || null,
    'city': profile.additional?.city || null,
    'country': profile.additional?.country || null,
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
  }
});