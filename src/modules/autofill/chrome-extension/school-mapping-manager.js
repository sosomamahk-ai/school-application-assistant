/**
 * 学校URL映射管理界面逻辑
 */

const STORAGE_KEY = 'autofill_school_mappings';

// 默认映射（从 detectSchool.js 中的模式转换）
const DEFAULT_MAPPINGS = [
  { pattern: 'ox.ac.uk', type: 'contains', schoolId: 'oxford', schoolName: 'Oxford University' },
  { pattern: 'gradapply.mit.edu', type: 'contains', schoolId: 'mit_graduate', schoolName: 'MIT Graduate' },
  { pattern: 'gradadmissions.stanford.edu', type: 'contains', schoolId: 'stanford_graduate', schoolName: 'Stanford Graduate' },
  { pattern: 'gsas.harvard.edu', type: 'contains', schoolId: 'harvard_graduate', schoolName: 'Harvard Graduate' },
  { pattern: 'cam.ac.uk', type: 'contains', schoolId: 'cambridge', schoolName: 'Cambridge University' },
];

let currentMappings = [];
let editingIndex = -1;
let availableTemplates = [];

// DOM 元素
const elements = {
  patternTypeExact: document.getElementById('patternTypeExact'),
  patternTypeRegex: document.getElementById('patternTypeRegex'),
  urlPattern: document.getElementById('urlPattern'),
  schoolId: document.getElementById('schoolId'),
  schoolName: document.getElementById('schoolName'),
  templateSelect: document.getElementById('templateSelect'),
  patternHint: document.getElementById('patternHint'),
  addMappingBtn: document.getElementById('addMappingBtn'),
  testPatternBtn: document.getElementById('testPatternBtn'),
  saveBtn: document.getElementById('saveBtn'),
  backBtn: document.getElementById('backBtn'),
  mappingsList: document.getElementById('mappingsList'),
  schoolIdList: document.getElementById('schoolIdList'),
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadMappings();
  await loadSchoolList();
  renderMappings();
  setupEventListeners();
  updatePatternHint();
});

/**
 * 加载映射列表
 */
async function loadMappings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (result[STORAGE_KEY] && result[STORAGE_KEY].length > 0) {
      currentMappings = result[STORAGE_KEY];
    } else {
      currentMappings = [...DEFAULT_MAPPINGS];
    }
  } catch (error) {
    console.error('Load mappings error:', error);
    currentMappings = [...DEFAULT_MAPPINGS];
  }
}

/**
 * 加载学校列表（用于自动完成）
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
      availableTemplates = templates;
      
      elements.schoolIdList.innerHTML = '';
      templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.schoolId || template.id;
        option.textContent = `${template.schoolName || template.schoolId} - ${template.program || ''}`;
        elements.schoolIdList.appendChild(option);
      });

      if (elements.templateSelect) {
        elements.templateSelect.innerHTML = '<option value="">请选择学校模版...</option>';
        templates.forEach(template => {
          const option = document.createElement('option');
          option.value = template.schoolId || template.id;
          option.textContent = `${template.schoolName || template.schoolId}${template.program ? ` - ${template.program}` : ''}`;
          elements.templateSelect.appendChild(option);
        });
      }
    } else if (elements.templateSelect) {
      elements.templateSelect.innerHTML = '<option value="">无法加载学校模版，请手动输入 schoolId</option>';
    }
  } catch (error) {
    console.error('Load school list error:', error);
    if (elements.templateSelect) {
      elements.templateSelect.innerHTML = '<option value="">无法加载学校模版，请手动输入 schoolId</option>';
    }
  }
}

/**
 * 获取API基础URL
 */
async function getApiBaseUrl() {
  const result = await chrome.storage.local.get('autofill_api_url');
  return result.autofill_api_url || 'https://school-application-assistant.vercel.app';
}

/**
 * 保存映射列表
 */
async function saveMappings() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: currentMappings });
    
    // 通知 background script 重新加载映射
    chrome.runtime.sendMessage({ action: 'reloadSchoolMappings' });
    
    alert('映射列表已保存！');
  } catch (error) {
    console.error('Save mappings error:', error);
    alert('保存失败：' + error.message);
  }
}

/**
 * 渲染映射列表
 */
function renderMappings() {
  if (currentMappings.length === 0) {
    elements.mappingsList.innerHTML = '<div class="empty-state">暂无映射</div>';
    return;
  }

  elements.mappingsList.innerHTML = '';

  currentMappings.forEach((mapping, index) => {
    const item = document.createElement('div');
    item.className = 'mapping-item';
    
    const patternDisplay = mapping.type === 'regex' 
      ? mapping.pattern 
      : mapping.pattern;
    const typeLabel = mapping.type === 'regex' ? '正则' : '包含';
    
    item.innerHTML = `
      <div class="mapping-item-info">
        <div class="mapping-item-url">${patternDisplay} <span style="color: #9ca3af; font-size: 11px;">(${typeLabel})</span></div>
        <div class="mapping-item-school">${mapping.schoolName || mapping.schoolId}</div>
      </div>
      <div class="mapping-item-actions">
        <button class="btn btn-secondary btn-small" data-action="edit" data-index="${index}">编辑</button>
        <button class="btn btn-secondary btn-small" data-action="delete" data-index="${index}">删除</button>
      </div>
    `;

    // 事件监听
    item.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      editMapping(index);
    });
    item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      deleteMapping(index);
    });

    elements.mappingsList.appendChild(item);
  });
}

/**
 * 添加映射
 */
function addMapping() {
  const patternType = document.querySelector('input[name="patternType"]:checked').value;
  const pattern = elements.urlPattern.value.trim();
  const schoolId = elements.schoolId.value.trim();
  const schoolName = elements.schoolName.value.trim();

  if (!pattern || !schoolId) {
    alert('请填写URL模式和学校ID');
    return;
  }

  // 验证正则表达式格式
  if (patternType === 'regex') {
    try {
      // 移除首尾的 / 和标志
      const regexPattern = pattern.replace(/^\/|\/[gimuy]*$/g, '');
      new RegExp(regexPattern);
    } catch (e) {
      alert('正则表达式格式错误：' + e.message);
      return;
    }
  }

  const newMapping = {
    pattern: pattern,
    type: patternType === 'regex' ? 'regex' : 'contains',
    schoolId: schoolId,
    schoolName: schoolName || null,
  };

  if (editingIndex >= 0) {
    // 编辑模式
    currentMappings[editingIndex] = newMapping;
    editingIndex = -1;
    elements.addMappingBtn.textContent = '添加映射';
  } else {
    // 添加模式
    currentMappings.push(newMapping);
  }

  renderMappings();

  // 清空表单
  elements.urlPattern.value = '';
  elements.schoolId.value = '';
  elements.schoolName.value = '';
  if (elements.templateSelect) {
    elements.templateSelect.value = '';
  }
  elements.patternTypeExact.checked = true;
  updatePatternHint();
}

/**
 * 编辑映射
 */
function editMapping(index) {
  const mapping = currentMappings[index];
  
  elements.urlPattern.value = mapping.pattern;
  elements.schoolId.value = mapping.schoolId;
  elements.schoolName.value = mapping.schoolName || '';
  if (elements.templateSelect) {
    elements.templateSelect.value = mapping.schoolId || '';
  }
  
  if (mapping.type === 'regex') {
    elements.patternTypeRegex.checked = true;
  } else {
    elements.patternTypeExact.checked = true;
  }
  
  updatePatternHint();
  editingIndex = index;
  elements.addMappingBtn.textContent = '保存修改';

  // 滚动到表单
  elements.urlPattern.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * 删除映射
 */
function deleteMapping(index) {
  if (!confirm('确定要删除这个映射吗？')) {
    return;
  }

  currentMappings.splice(index, 1);
  renderMappings();
}

/**
 * 测试模式
 */
async function testPattern() {
  const patternType = document.querySelector('input[name="patternType"]:checked').value;
  const pattern = elements.urlPattern.value.trim();

  if (!pattern) {
    alert('请先输入URL模式');
    return;
  }

  // 获取当前标签页URL
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      alert('无法获取当前标签页');
      return;
    }

    const currentUrl = tabs[0].url;
    let matches = false;

    if (patternType === 'regex') {
      try {
        // 移除首尾的 / 和标志
        const regexPattern = pattern.replace(/^\/|\/[gimuy]*$/g, '');
        const regex = new RegExp(regexPattern, 'i');
        matches = regex.test(currentUrl);
      } catch (e) {
        alert('正则表达式格式错误：' + e.message);
        return;
      }
    } else {
      matches = currentUrl.toLowerCase().includes(pattern.toLowerCase());
    }

    if (matches) {
      alert(`✅ 匹配成功！\n\n当前URL: ${currentUrl}\n模式: ${pattern}`);
    } else {
      alert(`❌ 不匹配\n\n当前URL: ${currentUrl}\n模式: ${pattern}`);
    }
  } catch (error) {
    console.error('Test pattern error:', error);
    alert('测试失败：' + error.message);
  }
}

/**
 * 更新模式提示
 */
function updatePatternHint() {
  const patternType = document.querySelector('input[name="patternType"]:checked').value;
  if (patternType === 'regex') {
    elements.patternHint.textContent = '输入正则表达式模式，例如：/ox\\.ac\\.uk.*apply/i（不需要首尾的斜杠和标志）';
  } else {
    elements.patternHint.textContent = '输入URL的一部分，插件会检查当前页面URL是否包含此文本';
  }
}

/**
 * 设置事件监听
 */
function setupEventListeners() {
  elements.addMappingBtn.addEventListener('click', addMapping);
  elements.testPatternBtn.addEventListener('click', testPattern);
  elements.saveBtn.addEventListener('click', saveMappings);
  elements.backBtn.addEventListener('click', () => {
    window.close();
  });
  elements.templateSelect?.addEventListener('change', (event) => {
    const selectedId = event.target.value;
    if (!selectedId) {
      return;
    }
    const template = availableTemplates.find(t => (t.schoolId || t.id) === selectedId);
    elements.schoolId.value = selectedId;
    if (template) {
      elements.schoolName.value = template.schoolName || template.schoolId || '';
    }
  });

  // 模式类型切换
  elements.patternTypeExact.addEventListener('change', updatePatternHint);
  elements.patternTypeRegex.addEventListener('change', updatePatternHint);

  // Enter 键提交
  [elements.urlPattern, elements.schoolId, elements.schoolName].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addMapping();
      }
    });
  });
}

