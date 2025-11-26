/**
 * 字段提取模块
 * 从 WordPress post 中提取字段，不支持 fallback
 */

import { WordPressPostWithTerms } from './types';
import { ExtractedField } from './types';
import { SyncConfig, FieldMapping, TaxonomyMapping } from './config';

/**
 * 从 ACF 对象中提取字段
 */
function extractAcfField(
  post: WordPressPostWithTerms,
  fieldKey: string | string[]
): ExtractedField {
  const keys = Array.isArray(fieldKey) ? fieldKey : [fieldKey];
  
  // 检查 ACF 对象是否存在
  if (!post.acf || typeof post.acf !== 'object') {
    return {
      value: null,
      source: 'acf',
      rawData: null,
      present: false,
      path: ['acf'],
    };
  }
  
  // 尝试每个候选键
  for (const key of keys) {
    // 首先尝试直接访问扁平字段名（ACF 字段通常是扁平结构）
    // 注意：即使值为 null，也认为字段存在（用于诊断）
    if (key in post.acf) {
      const value = post.acf[key];
      const normalized = normalizeValue(value);
      return {
        value: normalized,
        source: 'acf',
        rawData: value,
        present: true, // 字段存在（即使值为 null）
        path: ['acf', key],
      };
    }
    
    // 如果直接访问失败，尝试嵌套路径（某些 ACF 字段可能是嵌套结构）
    // 例如：name_english 可能存在于 name.english 嵌套结构中
    const parts = key.split('_');
    if (parts.length > 1) {
      let value: any = post.acf;
      let found = true;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          found = false;
          break;
        }
      }
      
      if (found) {
        const normalized = normalizeValue(value);
        return {
          value: normalized,
          source: 'acf',
          rawData: value,
          present: true, // 字段存在（即使值为 null）
          path: ['acf', ...parts],
        };
      }
    }
    
    // 尝试变体（大小写、驼峰等）- 跳过重复的 key
    const variants = [
      key.replace(/_/g, ''),                 // 移除所有下划线
      key.toLowerCase(),                     // 全小写
      key.toUpperCase(),                     // 全大写
      key.charAt(0).toUpperCase() + key.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase()), // 驼峰
    ];
    
    for (const variant of variants) {
      if (variant !== key && variant in post.acf) {
        const value = post.acf[variant];
        const normalized = normalizeValue(value);
        return {
          value: normalized,
          source: 'acf',
          rawData: value,
          present: true, // 字段存在（即使值为 null）
          path: ['acf', variant],
        };
      }
    }
  }
  
  // 字段不存在
  return {
    value: null,
    source: 'acf',
    rawData: null,
    present: false, // 字段不存在于 ACF 对象中
    path: ['acf', ...keys[0].split('_')],
  };
}

/**
 * 从 taxonomy 中提取字段
 */
function extractTaxonomyField(
  post: WordPressPostWithTerms,
  taxonomyNames: string | string[],
  termResolver: 'id' | 'slug' | 'name'
): ExtractedField {
  const names = Array.isArray(taxonomyNames) ? taxonomyNames : [taxonomyNames];
  
  // 首先尝试从 _embedded 中获取（包含完整的 term 对象）
  const embeddedTerms = post._embedded?.['wp:term'];
  let terms: any[] = [];
  
  if (embeddedTerms && Array.isArray(embeddedTerms)) {
    // _embedded['wp:term'] 是一个二维数组，每个子数组包含某个 taxonomy 的所有 terms
    // 将所有 terms 展平，然后按 taxonomy 名称过滤
    const allTerms = embeddedTerms.flat();
    for (const name of names) {
      const matchingTerms = allTerms.filter((t: any) => t.taxonomy === name);
      if (matchingTerms.length > 0) {
        terms = matchingTerms;
        break;
      }
    }
  }
  
  // 如果 _embedded 中没有找到，但 post 中有 ID 数组，尝试从 _embedded 中查找对应的 term
  if (terms.length === 0) {
    for (const name of names) {
      const termIds = post[name as keyof WordPressPostWithTerms];
      if (Array.isArray(termIds) && termIds.length > 0 && embeddedTerms) {
        // 从 _embedded 中查找对应的 term 对象
        const allTerms = embeddedTerms.flat();
        const matchingTerms = allTerms.filter((t: any) => 
          t.taxonomy === name && termIds.includes(t.id)
        );
        if (matchingTerms.length > 0) {
          terms = matchingTerms;
          break;
        }
        
        // 如果仍然找不到，且只需要 ID，直接返回第一个 ID
        if (termResolver === 'id') {
          return {
            value: termIds[0].toString(),
            source: 'taxonomy',
            rawData: termIds,
            present: true,
            path: ['taxonomy', name],
          };
        }
      }
    }
  }
  
  // 如果仍然没有找到任何 terms
  if (terms.length === 0) {
    return {
      value: null,
      source: 'taxonomy',
      rawData: null,
      present: false,
      path: ['taxonomy', names[0]],
    };
  }
  
  // 提取第一个 term 的值
  const term = terms[0];
  let value: any = null;
  
  switch (termResolver) {
    case 'id':
      value = term.id?.toString() || null;
      break;
    case 'slug':
      value = term.slug || null;
      break;
    case 'name':
      value = term.name || null;
      break;
  }
  
  return {
    value: normalizeValue(value),
    source: 'taxonomy',
    rawData: term,
    present: value !== null && value !== '',
    path: ['taxonomy', term.taxonomy],
  };
}

/**
 * 从 post 字段中提取（如 title, slug 等）
 */
function extractPostField(
  post: WordPressPostWithTerms,
  fieldKey: string
): ExtractedField {
  let value: any = null;
  let present = false;
  
  switch (fieldKey) {
    case 'id':
    case 'wp_id':
      value = post.id?.toString() || null;
      present = post.id !== undefined;
      break;
    case 'slug':
    case 'post_name':
      value = post.slug || null;
      present = post.slug !== undefined;
      break;
    case 'title':
      if (typeof post.title === 'string') {
        value = post.title;
        present = true;
      } else if (post.title && typeof post.title === 'object' && 'rendered' in post.title) {
        value = post.title.rendered;
        present = true;
      }
      break;
    case 'link':
      value = post.link || null;
      present = post.link !== undefined;
      break;
  }
  
  return {
    value: normalizeValue(value),
    source: 'post_field',
    rawData: value,
    present,
    path: [fieldKey],
  };
}

/**
 * 从 meta 数据中提取字段
 */
function extractMetaField(
  post: WordPressPostWithTerms,
  metaKey: string | string[]
): ExtractedField {
  const keys = Array.isArray(metaKey) ? metaKey : [metaKey];
  
  // 尝试从 meta 对象中获取
  if (post.meta && typeof post.meta === 'object') {
    for (const key of keys) {
      if (key in post.meta) {
        const value = post.meta[key];
        return {
          value: normalizeValue(value),
          source: 'meta',
          rawData: value,
          present: true,
          path: ['meta', key],
        };
      }
    }
  }
  
  // 尝试从 meta_data 数组中获取
  if (Array.isArray(post.meta_data)) {
    for (const key of keys) {
      const metaItem = post.meta_data.find(m => m.key === key);
      if (metaItem) {
        return {
          value: normalizeValue(metaItem.value),
          source: 'meta',
          rawData: metaItem.value,
          present: true,
          path: ['meta', key],
        };
      }
    }
  }
  
  return {
    value: null,
    source: 'meta',
    rawData: null,
    present: false,
    path: ['meta', keys[0]],
  };
}

/**
 * 标准化值（将各种类型转换为字符串或保持原样）
 */
function normalizeValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    // 对于数组，返回第一个非空元素
    for (const item of value) {
      const normalized = normalizeValue(item);
      if (normalized !== null) {
        return normalized;
      }
    }
    return null;
  }
  
  if (typeof value === 'object') {
    // 如果对象有 value 属性，提取它
    if ('value' in value) {
      return normalizeValue(value.value);
    }
    // 如果对象有 label 属性，提取它
    if ('label' in value) {
      return normalizeValue(value.label);
    }
    // 如果对象有 name 属性，提取它
    if ('name' in value) {
      return normalizeValue(value.name);
    }
    // 否则返回字符串表示
    return JSON.stringify(value);
  }
  
  return String(value).trim() || null;
}

/**
 * 从 WordPress post 中提取所有配置的字段
 */
export function extractFields(
  post: WordPressPostWithTerms,
  config: SyncConfig
): Record<string, ExtractedField> {
  const extracted: Record<string, ExtractedField> = {};
  
  // 提取字段映射
  for (const mapping of config.fieldMappings) {
    let field: ExtractedField;
    
    switch (mapping.type) {
      case 'acf':
        field = extractAcfField(post, mapping.wpField);
        break;
      
      case 'taxonomy':
        const taxonomyMapping = config.taxonomyMappings.find(tm => 
          tm.dbField === mapping.dbField
        );
        const termResolver = taxonomyMapping?.termResolver || 'slug';
        const taxonomyNames = taxonomyMapping?.wpTaxonomy || [];
        field = extractTaxonomyField(post, taxonomyNames, termResolver);
        break;
      
      case 'post_field':
        field = extractPostField(post, Array.isArray(mapping.wpField) ? mapping.wpField[0] : mapping.wpField);
        break;
      
      default:
        // 尝试从 meta 中提取
        field = extractMetaField(post, mapping.wpField);
    }
    
    extracted[mapping.dbField] = field;
  }
  
  // 提取 taxonomy 映射
  for (const mapping of config.taxonomyMappings) {
    // 注意：不再跳过已存在的字段，因为现在 ACF 和 Taxonomy 映射到不同的字段
    const field = extractTaxonomyField(post, mapping.wpTaxonomy, mapping.termResolver);
    extracted[mapping.dbField] = field;
  }
  
  // 添加 wpId 和 slug（如果不存在）
  if (!extracted.wpId) {
    extracted.wpId = extractPostField(post, 'id');
  }
  if (!extracted.slug) {
    extracted.slug = extractPostField(post, 'slug');
  }

  extracted.postType = {
    value: config.wpPostType || null,
    source: 'config',
    rawData: config.wpPostType || null,
    present: Boolean(config.wpPostType),
    path: ['config', 'wpPostType'],
  };
  
  return extracted;
}

