/**
 * 增强的表单字段扫描器
 * 支持多种识别方式：id, name, placeholder, label, aria-label, 上下文分析
 * 
 * 返回格式符合模板字段要求：{ key, label, type, ... }
 */
function scanInputs() {
  const elements = [...document.querySelectorAll("input, textarea, select")];
  return elements.map((el, idx) => {
    // 生成唯一选择器
    const selector = generateSelector(el, idx);
    
    // 获取标签文本（多种方式）
    const label = getLabelText(el);
    
    // 获取上下文信息
    const context = getFieldContext(el);
    
    // 判断是否必填
    const required = el.hasAttribute('required') || 
                     el.getAttribute('aria-required') === 'true' ||
                     (el.closest('.required, [class*="required"]') !== null);
    
    // 生成 key（优先使用 name，然后是 id，最后是自动生成）
    const key = el.name || el.id || `field_${idx + 1}`;
    
    return {
      key: key,
      id: el.id || null,
      name: el.name || null,
      placeholder: el.placeholder || null,
      label: label || el.placeholder || el.name || key,
      ariaLabel: el.getAttribute('aria-label') || null,
      tag: el.tagName.toLowerCase(),
      type: el.type || el.tagName.toLowerCase(),
      selector: selector,
      required: required,
      context: context,
      value: el.value || null,
      description: el.getAttribute('title') || el.getAttribute('data-description') || null,
    };
  });
}

/**
 * 生成唯一的选择器
 */
function generateSelector(el, idx) {
  if (el.id) {
    return `#${el.id}`;
  }
  if (el.name) {
    const tag = el.tagName.toLowerCase();
    return `${tag}[name="${el.name}"]`;
  }
  // 使用更精确的nth-of-type
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.querySelectorAll(tag));
    const index = siblings.indexOf(el);
    return `${tag}:nth-of-type(${index + 1})`;
  }
  return `${tag}:nth-of-type(${idx + 1})`;
}

/**
 * 获取字段的标签文本（多种方式）
 */
function getLabelText(el) {
  // 方式1: 通过 labels 属性
  if (el.labels && el.labels.length > 0) {
    return el.labels[0].innerText.trim();
  }
  
  // 方式2: 通过 id 查找 label[for]
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) {
      return label.innerText.trim();
    }
  }
  
  // 方式3: 查找父容器中的 label
  const parent = el.closest('label, .form-group, .field, [class*="field"], [class*="input"]');
  if (parent) {
    const labelEl = parent.querySelector('label');
    if (labelEl) {
      return labelEl.innerText.trim();
    }
    // 查找第一个文本节点
    const text = parent.textContent.trim();
    if (text && text.length < 100) {
      return text.split('\n')[0].trim();
    }
  }
  
  // 方式4: 查找前一个兄弟元素
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.tagName === 'LABEL') {
      return prev.innerText.trim();
    }
    if (prev.textContent && prev.textContent.trim().length < 50) {
      return prev.textContent.trim();
    }
    prev = prev.previousElementSibling;
  }
  
  return null;
}

/**
 * 获取字段的上下文信息
 */
function getFieldContext(el) {
  const context = {
    section: null,
    position: 0,
    nearbyFields: [],
  };
  
  // 查找表单区块标题
  const sectionHeaders = ['h1', 'h2', 'h3', 'h4', '.section-title', '.form-section', '[class*="section"]'];
  for (const selector of sectionHeaders) {
    const header = el.closest('form, .form, [class*="form"]')?.querySelector(selector);
    if (header && header.textContent) {
      context.section = header.textContent.trim();
      break;
    }
  }
  
  // 查找附近的字段
  const form = el.closest('form') || document;
  const allFields = Array.from(form.querySelectorAll('input, textarea, select'));
  const currentIndex = allFields.indexOf(el);
  context.position = currentIndex + 1;
  
  // 获取前后各2个字段的name/id
  const nearby = allFields.slice(Math.max(0, currentIndex - 2), currentIndex + 3)
    .filter(f => f !== el)
    .map(f => f.name || f.id || f.placeholder)
    .filter(Boolean);
  context.nearbyFields = nearby;
  
  return context;
}

/**
 * 填充单个字段
 */
function fillField(selector, value, fieldType = 'text') {
  try {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`Field not found: ${selector}`);
      return { success: false, error: 'Field not found' };
    }
    
    // 根据字段类型处理
    if (el.tagName === 'SELECT') {
      // 下拉框：尝试匹配选项
      const options = Array.from(el.options);
      const option = options.find(opt => 
        opt.value === value || 
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(opt.text.toLowerCase())
      );
      if (option) {
        el.value = option.value;
      } else {
        el.value = value;
      }
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      // 复选框/单选框
      if (el.value === value || value === 'true' || value === true) {
        el.checked = true;
      }
    } else if (el.type === 'date') {
      // 日期字段：格式化日期
      if (value instanceof Date) {
        el.value = value.toISOString().split('T')[0];
      } else if (typeof value === 'string') {
        // 尝试解析日期字符串
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          el.value = date.toISOString().split('T')[0];
        } else {
          el.value = value;
        }
      } else {
        el.value = value;
      }
    } else {
      // 普通文本字段
      el.focus();
      el.value = value;
    }
    
    // 触发事件
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    
    return { success: true };
  } catch (e) {
    console.error('Fill field error:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * 批量填充字段
 */
function fillFields(mappings) {
  const results = [];
  for (const mapping of mappings) {
    const result = fillField(mapping.selector, mapping.value, mapping.type);
    results.push({
      selector: mapping.selector,
      ...result
    });
  }
  return results;
}

// 存储当前页面的字段信息
let currentFields = [];
let currentDomain = window.location.hostname;

// 消息监听
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scan") {
    currentFields = scanInputs();
    currentDomain = window.location.hostname;
    sendResponse({ 
      fields: currentFields, 
      origin: currentDomain,
      url: window.location.href 
    });
  } else if (msg.action === "fill") {
    // 单个字段填充
    const result = fillField(msg.selector, msg.value, msg.type);
    sendResponse(result);
  } else if (msg.action === "fillBatch") {
    // 批量填充
    const results = fillFields(msg.mappings);
    sendResponse({ results });
  } else if (msg.action === "fillWithData") {
    // 使用数据对象和模板填充表单
    // msg.data: 申请数据对象
    // msg.templateFields: 可选的模板字段数组
    if (typeof window.fillForm !== 'undefined' && window.fillForm.fillFormWithData) {
      const result = window.fillForm.fillFormWithData(msg.data, msg.templateFields);
      sendResponse(result);
    } else {
      // 回退到基本填充逻辑
      const results = [];
      Object.keys(msg.data).forEach(key => {
        const value = msg.data[key];
        const selectors = [
          `[name="${key}"]`,
          `#${key}`,
          `[id="${key}"]`,
        ];
        for (const selector of selectors) {
          const result = fillField(selector, value);
          if (result.success) {
            results.push({ key, selector, ...result });
            break;
          }
        }
      });
      sendResponse({ success: true, results });
    }
  } else if (msg.action === "getFields") {
    // 获取当前字段
    sendResponse({ fields: currentFields, domain: currentDomain });
  } else if (msg.action === "highlightField") {
    // 高亮显示字段（用于调试）
    const el = document.querySelector(msg.selector);
    if (el) {
      el.style.outline = '2px solid #3b82f6';
      el.style.outlineOffset = '2px';
      setTimeout(() => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }, 2000);
    }
    sendResponse({ ok: true });
  }
  
  return true; // 保持消息通道开放
});

// 右键菜单：绑定字段
let contextMenuTarget = null;

document.addEventListener('contextmenu', (e) => {
  const target = e.target;
  if (target.matches('input, textarea, select')) {
    contextMenuTarget = target;
  }
}, true);

// 监听右键菜单点击
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getContextMenuTarget") {
    if (contextMenuTarget) {
      const field = scanInputs().find(f => {
        try {
          return document.querySelector(f.selector) === contextMenuTarget;
        } catch {
          return false;
        }
      });
      sendResponse({ field });
      contextMenuTarget = null;
    } else {
      sendResponse({ field: null });
    }
  }
  return true;
});

// 页面加载完成后自动扫描（可选）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // 延迟扫描，等待动态内容加载
    setTimeout(() => {
      currentFields = scanInputs();
      currentDomain = window.location.hostname;
    }, 1000);
  });
} else {
  setTimeout(() => {
    currentFields = scanInputs();
    currentDomain = window.location.hostname;
  }, 1000);
}