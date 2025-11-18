/**
 * 字段管理界面逻辑
 */

// 默认字段列表
const DEFAULT_FIELDS = [
  // 基本信息
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
  
  // 地址信息
  { key: 'address', label: '地址 (Address)', category: '地址信息' },
  { key: 'city', label: '城市 (City)', category: '地址信息' },
  { key: 'state', label: '州/省 (State/Province)', category: '地址信息' },
  { key: 'zip', label: '邮编 (Zip Code)', category: '地址信息' },
  { key: 'country', label: '国家 (Country)', category: '地址信息' },
  
  // 教育背景
  { key: 'school_name', label: '学校名称 (School Name)', category: '教育背景' },
  { key: 'degree', label: '学位 (Degree)', category: '教育背景' },
  { key: 'major', label: '专业 (Major)', category: '教育背景' },
  { key: 'gpa', label: 'GPA/成绩 (GPA)', category: '教育背景' },
  { key: 'graduation_date', label: '毕业日期 (Graduation Date)', category: '教育背景' },
  { key: 'education_start', label: '入学日期 (Education Start)', category: '教育背景' },
  { key: 'education_end', label: '毕业日期 (Education End)', category: '教育背景' },
  
  // 工作经历
  { key: 'job_title', label: '职位 (Job Title)', category: '工作经历' },
  { key: 'company', label: '公司 (Company)', category: '工作经历' },
  { key: 'work_start', label: '工作开始日期 (Work Start)', category: '工作经历' },
  { key: 'work_end', label: '工作结束日期 (Work End)', category: '工作经历' },
  { key: 'work_description', label: '工作描述 (Work Description)', category: '工作经历' },
  
  // 文书
  { key: 'personal_statement', label: '个人陈述 (Personal Statement)', category: '文书' },
  { key: 'statement_of_purpose', label: '目的陈述 (Statement of Purpose)', category: '文书' },
  { key: 'essay', label: '短文 (Essay)', category: '文书' },
  { key: 'motivation_letter', label: '动机信 (Motivation Letter)', category: '文书' },
  { key: 'cover_letter', label: '求职信 (Cover Letter)', category: '文书' },
  
  // 其他
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

let currentFields = [];

// DOM 元素
const elements = {
  fieldKey: document.getElementById('fieldKey'),
  fieldLabel: document.getElementById('fieldLabel'),
  fieldCategory: document.getElementById('fieldCategory'),
  addFieldBtn: document.getElementById('addFieldBtn'),
  resetBtn: document.getElementById('resetBtn'),
  saveBtn: document.getElementById('saveBtn'),
  backBtn: document.getElementById('backBtn'),
  fieldsList: document.getElementById('fieldsList'),
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadFields();
  renderFields();
  setupEventListeners();
});

/**
 * 加载字段列表
 */
async function loadFields() {
  try {
    const result = await chrome.storage.local.get('autofill_custom_fields');
    if (result.autofill_custom_fields && result.autofill_custom_fields.length > 0) {
      currentFields = result.autofill_custom_fields;
    } else {
      currentFields = [...DEFAULT_FIELDS];
    }
  } catch (error) {
    console.error('Load fields error:', error);
    currentFields = [...DEFAULT_FIELDS];
  }
}

/**
 * 保存字段列表
 */
async function saveFields() {
  try {
    await chrome.storage.local.set({ autofill_custom_fields: currentFields });
    
    // 通知 background script 重新加载字段
    chrome.runtime.sendMessage({ action: 'reloadFields' });
    
    alert('字段列表已保存！请重新加载扩展以使更改生效。');
  } catch (error) {
    console.error('Save fields error:', error);
    alert('保存失败：' + error.message);
  }
}

/**
 * 渲染字段列表
 */
function renderFields() {
  if (currentFields.length === 0) {
    elements.fieldsList.innerHTML = '<div class="empty-state">暂无字段</div>';
    return;
  }

  // 按分类分组
  const grouped = {};
  currentFields.forEach(field => {
    const category = field.category || '未分类';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(field);
  });

  // 渲染
  elements.fieldsList.innerHTML = '';
  
  Object.keys(grouped).sort().forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-header';
    categoryDiv.textContent = category;
    elements.fieldsList.appendChild(categoryDiv);

    grouped[category].forEach(field => {
      const item = document.createElement('div');
      item.className = 'field-item';
      
      item.innerHTML = `
        <div class="field-item-info">
          <div class="field-item-key">${field.key}</div>
          <div class="field-item-label">${field.label}</div>
        </div>
        <div class="field-item-actions">
          <button class="btn btn-secondary btn-small" data-action="edit" data-key="${field.key}">编辑</button>
          <button class="btn btn-secondary btn-small" data-action="delete" data-key="${field.key}">删除</button>
        </div>
      `;

      // 事件监听
      item.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        editField(field);
      });
      item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        deleteField(field.key);
      });

      elements.fieldsList.appendChild(item);
    });
  });
}

/**
 * 添加字段
 */
function addField() {
  const key = elements.fieldKey.value.trim();
  const label = elements.fieldLabel.value.trim();
  const category = elements.fieldCategory.value.trim() || '自定义';

  if (!key || !label) {
    alert('请填写字段键和显示标签');
    return;
  }

  // 验证 key 格式
  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    alert('字段键只能包含小写字母、数字和下划线，且必须以字母开头');
    return;
  }

  // 检查是否已存在
  if (currentFields.some(f => f.key === key)) {
    alert('字段键已存在');
    return;
  }

  const newField = {
    key,
    label,
    category,
  };

  currentFields.push(newField);
  renderFields();

  // 清空表单
  elements.fieldKey.value = '';
  elements.fieldLabel.value = '';
  elements.fieldCategory.value = '';
}

/**
 * 编辑字段
 */
function editField(field) {
  elements.fieldKey.value = field.key;
  elements.fieldLabel.value = field.label;
  elements.fieldCategory.value = field.category || '';

  // 禁用 key 输入（不允许修改 key）
  elements.fieldKey.disabled = true;

  // 修改添加按钮为保存按钮
  elements.addFieldBtn.textContent = '保存修改';
  elements.addFieldBtn.onclick = () => {
    saveFieldEdit(field.key);
  };

  // 滚动到表单
  elements.fieldKey.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * 保存字段编辑
 */
function saveFieldEdit(key) {
  const label = elements.fieldLabel.value.trim();
  const category = elements.fieldCategory.value.trim() || '自定义';

  if (!label) {
    alert('请填写显示标签');
    return;
  }

  const field = currentFields.find(f => f.key === key);
  if (field) {
    field.label = label;
    field.category = category;
    renderFields();
  }

  // 恢复表单
  elements.fieldKey.value = '';
  elements.fieldLabel.value = '';
  elements.fieldCategory.value = '';
  elements.fieldKey.disabled = false;
  elements.addFieldBtn.textContent = '添加字段';
  elements.addFieldBtn.onclick = addField;
}

/**
 * 删除字段
 */
function deleteField(key) {
  if (!confirm(`确定要删除字段 "${key}" 吗？`)) {
    return;
  }

  currentFields = currentFields.filter(f => f.key !== key);
  renderFields();
}

/**
 * 重置为默认
 */
async function resetFields() {
  if (!confirm('确定要重置为默认字段列表吗？这将清除所有自定义字段。')) {
    return;
  }

  currentFields = [...DEFAULT_FIELDS];
  renderFields();
}

/**
 * 设置事件监听
 */
function setupEventListeners() {
  elements.addFieldBtn.addEventListener('click', addField);
  elements.resetBtn.addEventListener('click', resetFields);
  elements.saveBtn.addEventListener('click', saveFields);
  elements.backBtn.addEventListener('click', () => {
    window.close();
  });

  // Enter 键提交
  [elements.fieldKey, elements.fieldLabel, elements.fieldCategory].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addField();
      }
    });
  });
}

