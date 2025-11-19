/**
 * 浮动面板 - 替代popup，可以一直停留在页面上
 */
(function initFloatingPanel() {
  if (window.__autofillFloatingPanelInitialized) {
    return;
  }
  window.__autofillFloatingPanelInitialized = true;

  function getContentBridge() {
    return window.autofillContent || null;
  }

  function ensureExtensionContext() {
    if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
      throw new Error('扩展已重新加载，请刷新页面后再试');
    }
  }

  const DEFAULT_SCHOOL_OPTIONS = [
    { value: 'oxford', label: 'Oxford University' },
    { value: 'cambridge', label: 'Cambridge University' },
    { value: 'harvard_graduate', label: 'Harvard University - Graduate' },
    { value: 'stanford_graduate', label: 'Stanford University - Graduate' },
    { value: 'mit_graduate', label: 'MIT - Graduate' },
    { value: 'oxford_msc_cs', label: 'Oxford - MSc Computer Science' },
    { value: 'mit_meche', label: 'MIT - Mechanical Engineering' },
  ];

  let availableTemplates = [];

  // 创建浮动面板
  function createFloatingPanel() {
  // 检查是否已存在
  if (document.getElementById('autofill-floating-panel')) {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'autofill-floating-panel';
  panel.innerHTML = `
    <div class="autofill-panel-header">
      <h3>📝 表单自动填充</h3>
      <button class="autofill-panel-close" id="autofillPanelClose">×</button>
    </div>
    <div class="autofill-panel-content">
      <div class="autofill-panel-section">
        <div class="autofill-status" id="autofillPanelStatus">
          <span class="status-dot"></span>
          <span>就绪</span>
        </div>
      </div>
      <div class="autofill-panel-section">
        <div class="autofill-school-info" id="autofillPanelSchool">
          <label>学校：</label>
          <select id="autofillPanelSchoolSelect" class="autofill-select">
            <option value="">请选择学校...</option>
          </select>
        </div>
      </div>
      <div class="autofill-panel-section">
        <div class="autofill-button-group">
          <button class="autofill-btn autofill-btn-primary" id="autofillPanelFillBtn">✨ 自动填充</button>
          <button class="autofill-btn autofill-btn-secondary" id="autofillPanelScanBtn">🔍 扫描表单</button>
        </div>
      </div>
      <div class="autofill-panel-section" id="autofillPanelFieldsSection" style="display: none;">
        <div class="autofill-fields-list" id="autofillPanelFieldsList"></div>
      </div>
      <div class="autofill-panel-section">
        <div class="autofill-toggle-group">
          <label>
            <input type="checkbox" id="autofillPanelSmartMode" checked>
            <span>智能填充模式（点击字段时自动显示建议）</span>
          </label>
        </div>
      </div>
    </div>
  `;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    #autofill-floating-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .autofill-panel-header {
      background: linear-gradient(135deg, #4682B4 0%, #36648B 100%);
      color: white;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }
    .autofill-panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }
    .autofill-panel-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 1;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .autofill-panel-close:hover {
      opacity: 1;
    }
    .autofill-panel-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    .autofill-panel-section {
      margin-bottom: 16px;
    }
    .autofill-panel-section:last-child {
      margin-bottom: 0;
    }
    .autofill-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #6b7280;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }
    .status-dot.warning {
      background: #fbbf24;
    }
    .status-dot.error {
      background: #ef4444;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .autofill-school-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .autofill-school-info label {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
    .autofill-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      background: white;
    }
    .autofill-select:focus {
      outline: none;
      border-color: #4682B4;
      box-shadow: 0 0 0 3px rgba(70, 130, 180, 0.1);
    }
    .autofill-button-group {
      display: flex;
      gap: 8px;
    }
    .autofill-btn {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .autofill-btn-primary {
      background: #4682B4;
      color: white;
    }
    .autofill-btn-primary:hover {
      background: #3a6fa0;
    }
    .autofill-btn-secondary {
      background: #f1f3f4;
      color: #202124;
      border: 1px solid #dadce0;
    }
    .autofill-btn-secondary:hover {
      background: #e8eaed;
    }
    .autofill-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .autofill-fields-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .autofill-field-item {
      padding: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .autofill-toggle-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
    }
    .autofill-toggle-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  // 设置事件监听
  setupFloatingPanelEvents(panel);
  
  // 加载学校列表
  loadSchoolListForPanel();
  
  return panel;
}

/**
 * 设置浮动面板事件
 */
function setupFloatingPanelEvents(panel) {
  // 关闭按钮
  panel.querySelector('#autofillPanelClose').addEventListener('click', () => {
    panel.style.display = 'none';
  });

  // 扫描按钮
  panel.querySelector('#autofillPanelScanBtn').addEventListener('click', async () => {
    await handlePanelScan();
  });

  // 填充按钮
  panel.querySelector('#autofillPanelFillBtn').addEventListener('click', async () => {
    await handlePanelFill();
  });

  // 学校选择
  panel.querySelector('#autofillPanelSchoolSelect').addEventListener('change', (e) => {
    updatePanelStatus('ready', `已选择: ${e.target.options[e.target.selectedIndex].text}`);
  });
}

/**
 * 加载学校列表到浮动面板
 */
  async function loadSchoolListForPanel() {
  try {
      ensureExtensionContext();

      const response = await chrome.runtime.sendMessage({ action: 'listTemplates' });
      if (response?.success && Array.isArray(response.templates) && response.templates.length > 0) {
        availableTemplates = response.templates;
        populateSchoolSelect(
          response.templates.map(template => ({
            value: template.schoolId,
            label: `${template.schoolName || template.schoolId}${template.program ? ` - ${template.program}` : ''}`.trim(),
          })),
          response.templates
        );
        await autoDetectSchoolForPanel();
        return;
      }
    } catch (error) {
      console.error('Load school list error:', error);
    }

    populateSchoolSelect(DEFAULT_SCHOOL_OPTIONS);
    await autoDetectSchoolForPanel();
  }

  function populateSchoolSelect(options, templates = []) {
    const select = document.getElementById('autofillPanelSchoolSelect');
    if (!select) return;
    if (templates.length > 0) {
      availableTemplates = templates;
    }
    select.innerHTML = '<option value="">请选择学校...</option>';
    options.forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      select.appendChild(option);
    });
    select.disabled = false;
  }

  async function autoDetectSchoolForPanel() {
    const select = document.getElementById('autofillPanelSchoolSelect');
    if (!select) return;

    try {
      ensureExtensionContext();
      const response = await chrome.runtime.sendMessage({ action: 'detectSchoolId' });
      const detected = response?.schoolId;
      if (detected) {
        const option = Array.from(select.options).find(opt => opt.value === detected);
        if (option) {
          select.value = detected;
          updatePanelStatus('ready', `识别学校：${option.textContent}`);
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
      }
    } catch (error) {
      console.warn('Auto detect school via background failed', error);
    }

    try {
      if (window.detectSchool?.detectSchoolId) {
        const fallback = await window.detectSchool.detectSchoolId(window.location.href);
        if (fallback) {
          const option = Array.from(select.options).find(opt => opt.value === fallback);
          if (option) {
            select.value = fallback;
            updatePanelStatus('ready', `识别学校：${option.textContent}`);
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    } catch (error) {
      console.warn('Local auto detect school failed', error);
    }
}

/**
 * 获取API基础URL
 */
  async function getApiBaseUrl() {
    ensureExtensionContext();
    return new Promise((resolve) => {
      chrome.storage.local.get('autofill_api_url', (result) => {
        resolve(result.autofill_api_url || 'https://school-application-assistant.vercel.app');
      });
    });
}

/**
 * 处理面板扫描
 */
async function handlePanelScan() {
  const statusEl = document.getElementById('autofillPanelStatus');
  const fieldsSection = document.getElementById('autofillPanelFieldsSection');
  const fieldsList = document.getElementById('autofillPanelFieldsList');
  
  updatePanelStatus('loading', '扫描中...');
  
  try {
    const bridge = getContentBridge();
    let fields = [];

    if (bridge?.scanInputs) {
      fields = bridge.scanInputs();
      bridge.setCurrentFields?.(fields);
      bridge.setCurrentDomain?.(window.location.hostname);
    } else if (typeof scanInputs === 'function') {
      // 兜底逻辑：直接调用全局函数
      fields = scanInputs();
    }

    if (fields && fields.length > 0) {
      fieldsSection.style.display = 'block';
      fieldsList.innerHTML = '';

      fields.forEach(field => {
        const item = document.createElement('div');
        item.className = 'autofill-field-item';
        item.textContent = `${field.label || field.name || field.placeholder || '未命名字段'}`;
        fieldsList.appendChild(item);
      });

      updatePanelStatus('ready', `找到 ${fields.length} 个字段`);
    } else {
      updatePanelStatus('error', '未找到可扫描的字段');
    }
  } catch (error) {
    console.error('Panel scan error:', error);
    updatePanelStatus('error', '扫描失败');
  }
}

/**
 * 处理面板填充
 */
async function handlePanelFill() {
  const schoolSelect = document.getElementById('autofillPanelSchoolSelect');
  const schoolId = schoolSelect.value;
  
  if (!schoolId) {
    updatePanelStatus('error', '请先选择学校');
    return;
  }
  
  updatePanelStatus('loading', '填充中...');
  
  try {
      ensureExtensionContext();
    const response = await chrome.runtime.sendMessage({
      action: 'triggerFill',
      schoolId: schoolId,
    });
    
    if (response && response.success) {
      updatePanelStatus('ready', '填充完成');
    } else {
      throw new Error(response?.error || '填充失败');
    }
  } catch (error) {
    console.error('Panel fill error:', error);
    updatePanelStatus('error', error.message || '填充失败');
  }
}

/**
 * 更新面板状态
 */
function updatePanelStatus(type, text) {
  const statusEl = document.getElementById('autofillPanelStatus');
  if (!statusEl) return;
  
  const dot = statusEl.querySelector('.status-dot');
  const textEl = statusEl.querySelector('span:last-child');
  
  if (dot) {
    dot.className = 'status-dot';
    if (type === 'loading') {
      dot.classList.add('warning');
    } else if (type === 'error') {
      dot.classList.add('error');
    }
  }
  
  if (textEl) {
    textEl.textContent = text;
  }
}

/**
 * 初始化智能填充功能
 */
function initSmartFill() {
  // 监听所有输入框的焦点事件
  document.addEventListener('focusin', async (e) => {
    const target = e.target;
    
    // 检查是否是输入框
    if (!target.matches('input, textarea, select')) {
      return;
    }
    
    // 检查智能填充模式是否开启
    const smartModeCheckbox = document.getElementById('autofillPanelSmartMode');
    if (!smartModeCheckbox || !smartModeCheckbox.checked) {
      return;
    }
    
    // 获取字段信息
    const fieldInfo = getFieldInfo(target);
    
    // 获取用户资料
    const profile = await getUserProfile();
    if (!profile) {
      return;
    }
    
    // 获取最匹配的填充值
    const fillValue = getBestMatchValue(fieldInfo, profile);
    
    if (fillValue) {
      // 显示建议提示
      showFillSuggestion(target, fillValue);
    }
  }, true);
}

/**
 * 获取字段信息
 */
function getFieldInfo(element) {
  return {
    id: element.id,
    name: element.name,
    placeholder: element.placeholder,
    label: getLabelText(element),
    type: element.type || element.tagName.toLowerCase(),
  };
}

/**
 * 获取标签文本
 */
function getLabelText(element) {
  if (element.labels && element.labels.length > 0) {
    return element.labels[0].innerText.trim();
  }
  
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.innerText.trim();
    }
  }
  
  const parent = element.closest('label, .form-group, .field');
  if (parent) {
    const labelEl = parent.querySelector('label');
    if (labelEl) {
      return labelEl.innerText.trim();
    }
  }
  
  return null;
}

/**
 * 获取最匹配的填充值
 */
function getBestMatchValue(fieldInfo, profile) {
  const fieldText = (fieldInfo.label || fieldInfo.placeholder || fieldInfo.name || '').toLowerCase();
  
  // 匹配规则
  const matches = [
    { keywords: ['first name', 'given name', '名'], value: profile.fullName?.split(' ')[0] || null },
    { keywords: ['last name', 'family name', '姓'], value: profile.fullName?.split(' ').slice(1).join(' ') || null },
    { keywords: ['full name', 'name', '姓名'], value: profile.fullName || null },
    { keywords: ['email', '邮箱'], value: profile.email || null },
    { keywords: ['phone', '电话', 'tel'], value: profile.phone || null },
    { keywords: ['birthday', 'birth date', 'dob', '出生日期'], value: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null },
    { keywords: ['nationality', '国籍'], value: profile.nationality || null },
    { keywords: ['address', '地址'], value: profile.additional?.address || null },
    { keywords: ['city', '城市'], value: profile.additional?.city || null },
    { keywords: ['country', '国家'], value: profile.additional?.country || null },
  ];
  
  for (const match of matches) {
    if (match.keywords.some(keyword => fieldText.includes(keyword))) {
      return match.value;
    }
  }
  
  return null;
}

/**
 * 获取用户资料
 */
async function getUserProfile() {
    ensureExtensionContext();
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getProfile' }, (response) => {
      if (response && response.profile) {
        resolve(response.profile);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * 显示填充建议
 */
function showFillSuggestion(element, value) {
  // 移除之前的建议
  const existingSuggestion = document.getElementById('autofill-suggestion');
  if (existingSuggestion) {
    existingSuggestion.remove();
  }
  
  // 创建建议提示
  const suggestion = document.createElement('div');
  suggestion.id = 'autofill-suggestion';
  suggestion.style.cssText = `
    position: absolute;
    background: #4682B4;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    max-width: 300px;
  `;
  suggestion.innerHTML = `
    <div style="margin-bottom: 4px;">建议填充: <strong>${value}</strong></div>
    <div style="display: flex; gap: 8px;">
      <button style="flex: 1; padding: 4px 8px; background: white; color: #4682B4; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">填充</button>
      <button style="flex: 1; padding: 4px 8px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">忽略</button>
    </div>
  `;
  
  // 定位
  const rect = element.getBoundingClientRect();
  suggestion.style.top = `${rect.bottom + 8}px`;
  suggestion.style.left = `${rect.left}px`;
  
  // 填充按钮
  suggestion.querySelector('button:first-child').addEventListener('click', () => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    suggestion.remove();
  });
  
  // 忽略按钮
  suggestion.querySelector('button:last-child').addEventListener('click', () => {
    suggestion.remove();
  });
  
  document.body.appendChild(suggestion);
  
  // 点击其他地方时移除
  setTimeout(() => {
    const removeOnClick = (e) => {
      if (!suggestion.contains(e.target) && e.target !== element) {
        suggestion.remove();
        document.removeEventListener('click', removeOnClick);
      }
    };
    document.addEventListener('click', removeOnClick);
  }, 100);
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSmartFill();
    });
  } else {
    initSmartFill();
  }

  // 导出函数
  if (typeof window !== 'undefined') {
    window.autofillFloatingPanel = {
      create: createFloatingPanel,
      show: () => {
        const panel = document.getElementById('autofill-floating-panel');
        if (panel) {
          panel.style.display = 'flex';
        } else {
          createFloatingPanel();
        }
      },
      hide: () => {
        const panel = document.getElementById('autofill-floating-panel');
        if (panel) {
          panel.style.display = 'none';
        }
      },
    };
  }
})();

