/**
 * Popup 界面逻辑
 */

// DOM 元素
const elements = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  authSection: document.getElementById('authSection'),
  authStatus: document.getElementById('authStatus'),
  loginBtn: document.getElementById('loginBtn'),
  pageInfo: document.getElementById('pageInfo'),
  currentDomain: document.getElementById('currentDomain'),
  schoolSection: document.getElementById('schoolSection'),
  currentSchoolId: document.getElementById('currentSchoolId'),
  schoolSelect: document.getElementById('schoolSelect'),
  scanBtn: document.getElementById('scanBtn'),
  pushFieldsBtn: document.getElementById('pushFieldsBtn'),
  fillBtn: document.getElementById('fillBtn'),
  fieldsSection: document.getElementById('fieldsSection'),
  fieldsList: document.getElementById('fieldsList'),
  mappingsSection: document.getElementById('mappingsSection'),
  mappingsList: document.getElementById('mappingsList'),
  debugSection: document.getElementById('debugSection'),
  debugInfo: document.getElementById('debugInfo'),
  settingsBtn: document.getElementById('settingsBtn'),
  schoolMappingBtn: document.getElementById('schoolMappingBtn'),
  clearCacheBtn: document.getElementById('clearCacheBtn'),
  showFloatingPanelBtn: document.getElementById('showFloatingPanelBtn'),
  exportFieldsBtn: document.getElementById('exportFieldsBtn'),
};

// 状态
let currentTab = null;
let currentDomain = null;
let currentSchoolId = null;
let currentFields = [];
let currentMappings = [];
let userProfile = null;

const CONTENT_SCRIPT_FILES = [
  'utils/detectSchool.js',
  'utils/fillForm.js',
  'content.js',
  'floating-panel.js',
];

function isContentScriptMissingError(error) {
  if (!error || !error.message) {
    return false;
  }
  return (
    error.message.includes('Could not establish connection') ||
    error.message.includes('Receiving end does not exist')
  );
}

async function injectContentScripts(tabId) {
  if (!chrome.scripting?.executeScript) {
    throw new Error('当前浏览器不支持脚本注入，请刷新页面后重试');
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: CONTENT_SCRIPT_FILES,
  });
  await new Promise(resolve => setTimeout(resolve, 300));
}

async function showFloatingPanelInTab(tabId) {
  const response = await chrome.tabs.sendMessage(tabId, { action: 'showFloatingPanel' });
  if (!response || response.success === false) {
    throw new Error(response?.error || '浮动面板脚本尚未准备好');
  }
  return response;
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await init();
  setupEventListeners();
});

/**
 * 初始化
 */
async function init() {
  try {
    // 获取当前标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    currentDomain = new URL(currentTab.url).hostname;
    elements.currentDomain.textContent = currentDomain;

    // 检查登录状态
    await checkAuthStatus();

    // 检测学校 ID
    await detectSchool();

    // 加载字段和映射
    await loadFields();
    await loadMappings();

    updateStatus('ready', '就绪');
  } catch (error) {
    console.error('Init error:', error);
    updateStatus('error', '初始化失败');
  }
}

/**
 * 检查认证状态
 */
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getProfile' });
    if (response && response.profile) {
      userProfile = response.profile;
      elements.authStatus.innerHTML = `
        <p>✅ 已登录</p>
        <button id="logoutBtn" class="btn btn-link">退出</button>
      `;
      document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    } else {
      elements.authStatus.innerHTML = `
        <p>未登录</p>
        <button id="loginBtn" class="btn btn-primary">登录</button>
      `;
      document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    }
  } catch (error) {
    console.error('Check auth error:', error);
  }
}

/**
 * 加载字段
 */
async function loadFields() {
  try {
    if (!currentTab) return;

    // 检查当前标签页是否支持 content script
    const url = currentTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) {
      // 扩展页面或 Chrome 内部页面不支持 content script
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getFields' });
      if (response && response.fields) {
        currentFields = response.fields;
        renderFields();
      }
    } catch (error) {
      // Content script 可能还没有注入，这是正常的，不显示错误
      // 静默处理连接错误
    }
  } catch (error) {
    console.error('Load fields error:', error);
  }
}

/**
 * 加载映射
 */
async function loadMappings() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getMappings',
      domain: currentDomain,
    });
    if (response && response.mappings) {
      currentMappings = response.mappings;
      renderMappings();
    }
  } catch (error) {
    console.error('Load mappings error:', error);
  }
}

/**
 * 渲染字段列表
 */
function renderFields() {
  if (currentFields.length === 0) {
    elements.fieldsSection.style.display = 'none';
    return;
  }

  elements.fieldsSection.style.display = 'block';
  elements.fieldsList.innerHTML = '';

  currentFields.forEach(field => {
    const item = document.createElement('div');
    item.className = 'field-item';

    const confidence = field.confidence || 0;
    const confidenceClass = confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low';
    const confidenceText = confidence >= 0.7 ? '高' : confidence >= 0.4 ? '中' : '低';

    item.innerHTML = `
      <div class="field-item-header">
        <span class="field-label">${field.label || field.placeholder || field.name || '未命名字段'}</span>
        ${field.mappedField ? `<span class="field-confidence ${confidenceClass}">${confidenceText} (${Math.round(confidence * 100)}%)</span>` : ''}
      </div>
      <div class="field-info">
        ${field.mappedField ? `映射到: <strong>${field.mappedField}</strong>` : '未映射'}
      </div>
      <div class="field-selector">${field.selector}</div>
    `;

    elements.fieldsList.appendChild(item);
  });
}

/**
 * 渲染映射列表
 */
function renderMappings() {
  if (currentMappings.length === 0) {
    elements.mappingsSection.style.display = 'none';
    return;
  }

  elements.mappingsSection.style.display = 'block';
  elements.mappingsList.innerHTML = '';

  currentMappings.forEach(mapping => {
    const item = document.createElement('div');
    item.className = 'mapping-item';

    item.innerHTML = `
      <div class="mapping-info">
        <div class="mapping-field">${mapping.selector}</div>
        <div class="mapping-target">→ ${mapping.profileField}</div>
      </div>
      <div class="mapping-actions">
        <button class="btn-icon" data-action="delete" data-selector="${mapping.selector}">🗑️</button>
      </div>
    `;

    // 删除按钮事件
    item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      deleteMapping(mapping.selector);
    });

    elements.mappingsList.appendChild(item);
  });
}

/**
 * 加载学校列表到下拉菜单
 */
async function loadSchoolList() {
  try {
    const apiUrl = await getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/templates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const templates = data.templates || data || [];
      
      // 清空现有选项（保留第一个默认选项）
      elements.schoolSelect.innerHTML = '<option value="">请选择学校...</option>';
      
      // 添加学校选项
      templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.schoolId;
        option.textContent = `${template.schoolName || template.schoolId} - ${template.program || ''}`;
        elements.schoolSelect.appendChild(option);
      });
      
      // 如果没有学校，显示提示
      if (templates.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '暂无学校模板';
        option.disabled = true;
        elements.schoolSelect.appendChild(option);
      }
    } else {
      // API 请求失败，使用预定义的学校列表
      loadDefaultSchoolList();
    }
  } catch (error) {
    console.error('Load school list error:', error);
    // 出错时使用预定义的学校列表
    loadDefaultSchoolList();
  }
}

/**
 * 加载默认学校列表（当 API 不可用时）
 */
function loadDefaultSchoolList() {
  const defaultSchools = [
    { schoolId: 'oxford', name: 'Oxford University' },
    { schoolId: 'cambridge', name: 'Cambridge University' },
    { schoolId: 'harvard_graduate', name: 'Harvard University - Graduate' },
    { schoolId: 'stanford_graduate', name: 'Stanford University - Graduate' },
    { schoolId: 'mit_graduate', name: 'MIT - Graduate' },
    { schoolId: 'oxford_msc_cs', name: 'Oxford - MSc Computer Science' },
    { schoolId: 'mit_meche', name: 'MIT - Mechanical Engineering' },
  ];
  
  elements.schoolSelect.innerHTML = '<option value="">请选择学校...</option>';
  
  defaultSchools.forEach(school => {
    const option = document.createElement('option');
    option.value = school.schoolId;
    option.textContent = school.name;
    elements.schoolSelect.appendChild(option);
  });
}

/**
 * 检测学校 ID
 */
async function detectSchool() {
  try {
    if (!currentTab) return;

    const response = await chrome.runtime.sendMessage({
      action: 'detectSchoolId',
      tabId: currentTab.id,
    });

    if (response && response.success && response.schoolId) {
      currentSchoolId = response.schoolId;
      elements.schoolSection.style.display = 'block';
      elements.currentSchoolId.textContent = currentSchoolId;
      elements.pushFieldsBtn.style.display = 'inline-block';
    } else {
      // 显示学校选择器（可以手动选择）
      elements.schoolSection.style.display = 'block';
      elements.currentSchoolId.textContent = '未识别';
      elements.schoolSelect.style.display = 'block';
      // 加载学校列表
      await loadSchoolList();
    }
  } catch (error) {
    console.error('Detect school error:', error);
  }
}

/**
 * 设置事件监听
 */
function setupEventListeners() {
  elements.scanBtn.addEventListener('click', handleScan);
  elements.pushFieldsBtn.addEventListener('click', handlePushFields);
  elements.fillBtn.addEventListener('click', handleFill);
  elements.clearCacheBtn.addEventListener('click', handleClearCache);
  elements.settingsBtn.addEventListener('click', handleSettings);
  elements.schoolMappingBtn.addEventListener('click', handleSchoolMapping);
  elements.showFloatingPanelBtn?.addEventListener('click', handleShowFloatingPanel);
  elements.exportFieldsBtn?.addEventListener('click', handleExportFields);
  elements.schoolSelect.addEventListener('change', (e) => {
    currentSchoolId = e.target.value;
    elements.currentSchoolId.textContent = currentSchoolId || '未识别';
    elements.pushFieldsBtn.style.display = currentSchoolId ? 'inline-block' : 'none';
  });
}

/**
 * 处理扫描
 */
async function handleScan() {
  try {
    updateStatus('loading', '扫描中...');
    elements.scanBtn.disabled = true;

    if (!currentTab) {
      throw new Error('无法获取当前标签页');
    }

    // 检查当前标签页是否支持 content script
    const url = currentTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) {
      throw new Error('当前页面不支持表单扫描（Chrome 内部页面）');
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(currentTab.id, { action: 'scan' });
      if (!response) {
        throw new Error('扫描脚本无响应');
      }
    } catch (error) {
      if (isContentScriptMissingError(error)) {
        try {
          await injectContentScripts(currentTab.id);
          response = await chrome.tabs.sendMessage(currentTab.id, { action: 'scan' });
          if (!response) {
            throw new Error('扫描脚本无响应');
          }
        } catch (injectError) {
          throw new Error(injectError.message || '无法注入内容脚本，请刷新页面后重试');
        }
      } else {
        throw error;
      }
    }
    
    if (response && response.fields) {
      currentFields = response.fields;

      // 发送到后端进行匹配
      const token = await getStoredToken();
      if (token) {
        try {
          const apiUrl = await getApiBaseUrl();
          const matchResponse = await fetch(`${apiUrl}/api/autofill/detect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              domFields: response.fields,
              domain: response.origin,
            }),
          });

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            if (matchData.matched) {
              currentFields = matchData.matched;
            }
          }
        } catch (error) {
          console.error('Match error:', error);
        }
      }

      renderFields();
      updateStatus('ready', `找到 ${currentFields.length} 个字段`);
      
      // 如果已识别学校，自动显示上传按钮
      if (currentSchoolId) {
        elements.pushFieldsBtn.style.display = 'inline-block';
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
    const errorMsg = error.message || '扫描失败';
    updateStatus('error', errorMsg.length > 30 ? '扫描失败' : errorMsg);
  } finally {
    elements.scanBtn.disabled = false;
  }
}

/**
 * 处理上传模板
 */
async function handlePushFields() {
  try {
    if (!currentSchoolId) {
      throw new Error('请先选择或识别学校');
    }

    // 如果字段为空，自动触发扫描
    if (currentFields.length === 0) {
      updateStatus('loading', '正在扫描表单字段...');
      elements.pushFieldsBtn.disabled = true;
      
      // 自动触发扫描
      await handleScan();
      
      // 扫描后再次检查
      if (currentFields.length === 0) {
        throw new Error('未找到表单字段，请确保当前页面包含表单元素');
      }
    }

    updateStatus('loading', '上传模板中...');
    elements.pushFieldsBtn.disabled = true;

    const response = await chrome.runtime.sendMessage({
      action: 'pushFields',
      schoolId: currentSchoolId,
      fields: currentFields,
    });

    if (response && response.success) {
      updateStatus('ready', `模板上传成功！已上传 ${currentFields.length} 个字段`);
    } else {
      throw new Error(response?.error || '上传失败');
    }
  } catch (error) {
    console.error('Push fields error:', error);
    updateStatus('error', error.message || '上传失败');
  } finally {
    elements.pushFieldsBtn.disabled = false;
  }
}

/**
 * 处理填充
 */
async function handleFill() {
  try {
    updateStatus('loading', '填充中...');
    elements.fillBtn.disabled = true;

    if (!currentTab) {
      throw new Error('无法获取当前标签页');
    }

    // 检查当前标签页是否支持 content script
    const url = currentTab.url || '';
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) {
      throw new Error('当前页面不支持自动填充（Chrome 内部页面）');
    }

    // 如果有学校 ID，使用新的模板填充方式
    if (currentSchoolId) {
      // 触发后台脚本的自动填充（使用模板，传递手动选择的schoolId）
      const response = await chrome.runtime.sendMessage({
        action: 'triggerFill',
        tabId: currentTab.id,
        schoolId: currentSchoolId, // 传递手动选择的schoolId
      });

      if (response && response.success) {
        updateStatus('ready', '填充完成');
      } else {
        throw new Error(response?.error || '填充失败');
      }
    } else {
      // 使用旧的填充方式
      const response = await chrome.runtime.sendMessage({
        action: 'triggerFill',
        tabId: currentTab.id,
      });
      
      if (response && response.success) {
        updateStatus('ready', '填充完成');
      } else {
        throw new Error(response?.error || '填充失败');
      }
    }
  } catch (error) {
    console.error('Fill error:', error);
    updateStatus('error', error.message || '填充失败');
  } finally {
    elements.fillBtn.disabled = false;
  }
}

/**
 * 处理清除缓存
 */
async function handleClearCache() {
  if (confirm('确定要清除所有缓存吗？')) {
    try {
      await chrome.runtime.sendMessage({ action: 'clearCache' });
      await loadMappings();
      updateStatus('ready', '缓存已清除');
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }
}

/**
 * 处理设置
 */
function handleSettings() {
  // 打开字段管理页面
  chrome.tabs.create({ url: chrome.runtime.getURL('fields-manager.html') });
}

/**
 * 处理学校映射管理
 */
function handleSchoolMapping() {
  // 打开学校URL映射管理页面
  chrome.tabs.create({ url: chrome.runtime.getURL('school-mapping-manager.html') });
}

/**
 * 导出未映射字段
 */
function handleExportFields() {
  try {
    if (!currentFields || currentFields.length === 0) {
      alert('请先扫描表单字段');
      return;
    }

    const unmapped = currentFields.filter(field => !field.mappedField);
    const fieldsToExport = unmapped.length > 0 ? unmapped : currentFields;

    const payload = {
      generatedAt: new Date().toISOString(),
      domain: currentDomain,
      schoolId: currentSchoolId || null,
      totalDetected: currentFields.length,
      totalUnmapped: unmapped.length,
      fields: fieldsToExport.map(field => ({
        key: field.key,
        label: field.label,
        name: field.name,
        placeholder: field.placeholder,
        selector: field.selector,
        type: field.type,
        required: Boolean(field.required),
        mappedField: field.mappedField || null,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const sanitizedDomain = (currentDomain || 'page').replace(/[^a-z0-9.-]+/gi, '_');
    const filenameParts = ['autofill-fields', currentSchoolId || 'unspecified', sanitizedDomain].filter(Boolean);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameParts.join('-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    updateStatus('ready', '字段已导出');
  } catch (error) {
    console.error('Export fields error:', error);
    updateStatus('error', '导出失败');
  }
}

/**
 * 显示浮动面板
 */
async function handleShowFloatingPanel() {
  try {
    if (!currentTab) {
      throw new Error('无法获取当前标签页');
    }
    await showFloatingPanelInTab(currentTab.id);
    updateStatus('ready', '浮动面板已显示');
  } catch (error) {
    if (isContentScriptMissingError(error) && currentTab) {
      try {
        await injectContentScripts(currentTab.id);
        await showFloatingPanelInTab(currentTab.id);
        updateStatus('ready', '浮动面板已显示');
        return;
      } catch (injectError) {
        console.error('Show floating panel error:', injectError);
        updateStatus('error', injectError.message || '无法显示浮动面板，请刷新页面后重试');
        return;
      }
    }
    console.error('Show floating panel error:', error);
    updateStatus('error', error.message || '无法显示浮动面板，请刷新页面后重试');
  }
}

/**
 * 处理登录
 */
async function handleLogin() {
  // 获取 API 基础 URL（优先使用配置的，否则使用生产环境）
  const apiUrl = await getApiBaseUrl();
  const loginUrl = `${apiUrl}/auth/login`;
  chrome.tabs.create({ url: loginUrl });
}

/**
 * 处理退出
 */
async function handleLogout() {
  await chrome.storage.local.remove('autofill_user_token');
  await checkAuthStatus();
}

/**
 * 删除映射
 */
async function deleteMapping(selector) {
  if (!confirm('确定要删除这个映射吗？')) {
    return;
  }

  try {
    const mappings = currentMappings.filter(m => m.selector !== selector);
    await chrome.storage.local.set({
      autofill_mappings: {
        [currentDomain]: mappings,
      },
    });
    await loadMappings();
  } catch (error) {
    console.error('Delete mapping error:', error);
  }
}

/**
 * 更新状态
 */
function updateStatus(type, text) {
  elements.statusText.textContent = text;
  elements.statusDot.className = 'status-dot';
  if (type === 'loading') {
    elements.statusDot.classList.add('warning');
  } else if (type === 'error') {
    elements.statusDot.classList.add('error');
  }
}

/**
 * 获取存储的 Token
 */
async function getStoredToken() {
  const result = await chrome.storage.local.get('autofill_user_token');
  return result.autofill_user_token || null;
}

/**
 * 获取 API 基础 URL
 */
async function getApiBaseUrl() {
  const result = await chrome.storage.local.get('autofill_api_url');
  // 优先使用用户配置的 URL，否则使用生产环境 URL
  return result.autofill_api_url || 'https://school-application-assistant.vercel.app';
}

