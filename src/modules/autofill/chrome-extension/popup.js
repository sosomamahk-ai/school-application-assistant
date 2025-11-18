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
  clearCacheBtn: document.getElementById('clearCacheBtn'),
};

// 状态
let currentTab = null;
let currentDomain = null;
let currentSchoolId = null;
let currentFields = [];
let currentMappings = [];
let userProfile = null;

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
      // 可以在这里加载学校列表
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
    } catch (error) {
      if (error.message.includes('Could not establish connection') || 
          error.message.includes('Receiving end does not exist')) {
        // Content script 未注入，尝试先注入
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
          });
          // 等待一下让脚本加载
          await new Promise(resolve => setTimeout(resolve, 500));
          response = await chrome.tabs.sendMessage(currentTab.id, { action: 'scan' });
        } catch (injectError) {
          throw new Error('无法注入内容脚本，请刷新页面后重试');
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

    if (currentFields.length === 0) {
      throw new Error('请先扫描表单字段');
    }

    updateStatus('loading', '上传模板中...');
    elements.pushFieldsBtn.disabled = true;

    const response = await chrome.runtime.sendMessage({
      action: 'pushFields',
      schoolId: currentSchoolId,
      fields: currentFields,
    });

    if (response && response.success) {
      updateStatus('ready', '模板上传成功');
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
      // 触发后台脚本的自动填充（使用模板）
      const response = await chrome.runtime.sendMessage({
        action: 'triggerFill',
        tabId: currentTab.id,
      });

      if (response && response.success) {
        updateStatus('ready', '填充完成');
      } else {
        throw new Error(response?.error || '填充失败');
      }
    } else {
      // 使用旧的填充方式
      chrome.runtime.sendMessage({
        action: 'triggerFill',
        tabId: currentTab.id,
      });
      updateStatus('ready', '填充完成');
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

