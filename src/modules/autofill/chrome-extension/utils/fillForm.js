/**
 * 插件自动填充功能
 * 
 * 根据提供的数据自动填充网页表单
 * 支持：input[type=text], textarea, select, radio, checkbox
 */

/**
 * 填充单个字段
 * @param {string} selector - CSS 选择器
 * @param {any} value - 要填充的值
 * @param {string} fieldType - 字段类型（可选，用于优化填充逻辑）
 * @returns {Object} - { success: boolean, error?: string }
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
      return fillSelectField(el, value);
    } else if (el.type === 'checkbox') {
      return fillCheckboxField(el, value);
    } else if (el.type === 'radio') {
      return fillRadioField(el, value);
    } else if (el.type === 'date' || el.type === 'datetime-local') {
      return fillDateField(el, value);
    } else if (el.type === 'file') {
      return fillFileField(el, value);
    } else {
      // 普通文本字段（input[type=text], textarea, etc.）
      return fillTextField(el, value);
    }
  } catch (e) {
    console.error('Fill field error:', e);
    return { success: false, error: String(e) };
  }
}

/**
 * 填充文本字段
 */
function fillTextField(el, value) {
  if (value === null || value === undefined) {
    return { success: false, error: 'Value is null or undefined' };
  }

  const stringValue = String(value);
  
  // 聚焦字段
  el.focus();
  
  // 设置值
  el.value = stringValue;
  
  // 触发事件（确保表单验证和监听器被触发）
  el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
  
  // 失去焦点
  el.blur();
  
  return { success: true };
}

/**
 * 填充下拉框（SELECT）
 */
function fillSelectField(el, value) {
  if (value === null || value === undefined) {
    return { success: false, error: 'Value is null or undefined' };
  }

  const stringValue = String(value).toLowerCase();
  const options = Array.from(el.options);
  
  // 尝试精确匹配 value
  let option = options.find(opt => opt.value === value || opt.value.toLowerCase() === stringValue);
  
  // 如果未找到，尝试匹配文本内容
  if (!option) {
    option = options.find(opt => 
      opt.text.toLowerCase().includes(stringValue) ||
      stringValue.includes(opt.text.toLowerCase())
    );
  }
  
  if (option) {
    el.value = option.value;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    return { success: true };
  } else {
    // 如果找不到匹配项，直接设置值（可能无效，但尝试一下）
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    return { success: false, error: 'No matching option found' };
  }
}

/**
 * 填充复选框（checkbox）
 */
function fillCheckboxField(el, value) {
  // 如果值是布尔值，直接设置
  if (typeof value === 'boolean') {
    el.checked = value;
  } else if (value === 'true' || value === true || value === 1 || value === '1') {
    el.checked = true;
  } else if (value === 'false' || value === false || value === 0 || value === '0') {
    el.checked = false;
  } else {
    // 如果值匹配复选框的 value，则选中
    if (String(el.value) === String(value)) {
      el.checked = true;
    } else {
      el.checked = false;
    }
  }
  
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  return { success: true };
}

/**
 * 填充单选框（radio）
 */
function fillRadioField(el, value) {
  // 查找同名的所有单选框
  const name = el.name;
  if (!name) {
    return { success: false, error: 'Radio button has no name attribute' };
  }

  const radioButtons = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
  
  // 尝试找到匹配的单选框
  let matched = false;
  radioButtons.forEach(radio => {
    if (String(radio.value) === String(value) || 
        radio.value.toLowerCase() === String(value).toLowerCase()) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      matched = true;
    }
  });

  // 如果值匹配当前单选框，直接选中
  if (String(el.value) === String(value) || 
      el.value.toLowerCase() === String(value).toLowerCase()) {
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    matched = true;
  }

  return { success: matched };
}

/**
 * 填充日期字段
 */
function fillDateField(el, value) {
  if (value === null || value === undefined) {
    return { success: false, error: 'Value is null or undefined' };
  }

  let dateString = '';
  
  if (value instanceof Date) {
    dateString = value.toISOString().split('T')[0];
  } else if (typeof value === 'string') {
    // 尝试解析日期字符串
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      dateString = date.toISOString().split('T')[0];
    } else {
      // 如果已经是 YYYY-MM-DD 格式，直接使用
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        dateString = value;
      } else {
        return { success: false, error: 'Invalid date format' };
      }
    }
  } else {
    return { success: false, error: 'Invalid date value' };
  }

  el.value = dateString;
  el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  return { success: true };
}

/**
 * 填充文件字段（file input）
 * 注意：由于浏览器安全限制，无法直接设置文件输入的值
 * 这里只能提供提示
 */
function fillFileField(el, value) {
  // 文件字段无法通过 JavaScript 直接设置（浏览器安全限制）
  // 只能显示提示信息
  console.warn('File field cannot be filled programmatically. Value:', value);
  
  // 可以尝试在字段旁边显示提示
  const hint = document.createElement('div');
  hint.style.cssText = 'color: #3b82f6; font-size: 12px; margin-top: 4px;';
  hint.textContent = `请手动上传文件: ${value}`;
  
  const parent = el.parentElement;
  if (parent) {
    // 移除之前的提示
    const existingHint = parent.querySelector('.file-hint');
    if (existingHint) {
      existingHint.remove();
    }
    hint.className = 'file-hint';
    parent.appendChild(hint);
  }
  
  return { success: false, error: 'File fields cannot be filled programmatically' };
}

/**
 * 根据字段 key 和模板数据填充表单
 * @param {Object} data - 申请数据对象，key-value 格式
 * @param {Array} templateFields - 模板字段数组，包含 { key, selector, type } 等信息
 * @returns {Object} - { success: boolean, filled: number, failed: number, results: Array }
 */
function fillFormWithData(data, templateFields = null) {
  const results = [];
  let filled = 0;
  let failed = 0;

  if (templateFields && Array.isArray(templateFields)) {
    // 使用模板字段进行精确填充
    templateFields.forEach(field => {
      const value = data[field.key];
      if (value !== null && value !== undefined) {
        const result = fillField(field.selector || `[name="${field.key}"]`, value, field.type);
        results.push({
          key: field.key,
          selector: field.selector,
          ...result,
        });
        
        if (result.success) {
          filled++;
        } else {
          failed++;
        }
      }
    });
  } else {
    // 没有模板，尝试通过 name 或 id 属性匹配
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        return;
      }

      // 尝试多种选择器
      const selectors = [
        `[name="${key}"]`,
        `#${key}`,
        `[id="${key}"]`,
        `[data-field="${key}"]`,
      ];

      let filledOne = false;
      for (const selector of selectors) {
        const result = fillField(selector, value);
        if (result.success) {
          results.push({
            key,
            selector,
            ...result,
          });
          filled++;
          filledOne = true;
          break;
        }
      }

      if (!filledOne) {
        results.push({
          key,
          selector: null,
          success: false,
          error: 'No matching field found',
        });
        failed++;
      }
    });
  }

  return {
    success: failed === 0,
    filled,
    failed,
    results,
  };
}

/**
 * 批量填充字段
 * @param {Array} mappings - 映射数组，每个元素包含 { selector, value, type }
 * @returns {Array} - 填充结果数组
 */
function fillFields(mappings) {
  const results = [];
  for (const mapping of mappings) {
    const result = fillField(mapping.selector, mapping.value, mapping.type);
    results.push({
      selector: mapping.selector,
      ...result,
    });
  }
  return results;
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fillField,
    fillFormWithData,
    fillFields,
  };
}

// 如果在浏览器环境中，将函数挂载到全局对象
if (typeof window !== 'undefined') {
  window.fillForm = {
    fillField,
    fillFormWithData,
    fillFields,
  };
}

