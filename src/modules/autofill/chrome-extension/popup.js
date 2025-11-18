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
  scanBtn: document.getElementById('scanBtn'),
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

    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getFields' });
    if (response && response.fields) {
      currentFields = response.fields;
      renderFields();
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
 * 设置事件监听
 */
function setupEventListeners() {
  elements.scanBtn.addEventListener('click', handleScan);
  elements.fillBtn.addEventListener('click', handleFill);
  elements.clearCacheBtn.addEventListener('click', handleClearCache);
  elements.settingsBtn.addEventListener('click', handleSettings);
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

    const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'scan' });
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
    updateStatus('error', '扫描失败');
  } finally {
    elements.scanBtn.disabled = false;
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

    // 触发后台脚本的自动填充
    chrome.runtime.sendMessage({
      action: 'triggerFill',
      tabId: currentTab.id,
    });

    updateStatus('ready', '填充完成');
  } catch (error) {
    console.error('Fill error:', error);
    updateStatus('error', '填充失败');
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
  // 打开设置页面
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

/**
 * 处理登录
 */
function handleLogin() {
  // 打开登录页面
  chrome.tabs.create({ url: 'http://localhost:3000/auth/login' });
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
  return result.autofill_api_url || 'http://localhost:3000';
}

