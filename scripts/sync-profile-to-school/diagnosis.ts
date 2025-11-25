/**
 * 字段诊断模块
 * 分析字段缺失的原因并提供排查建议
 */

import { WordPressPostWithTerms } from './types';
import { FieldDiagnosis } from './types';
import { SyncConfig } from './config';
import { ExtractedField } from './types';

export interface DiagnosisContext {
  post: WordPressPostWithTerms;
  fieldName: string;
  expectedPath: string[];
  config: SyncConfig;
}

/**
 * 诊断字段缺失的原因
 */
export function diagnoseMissingField(context: DiagnosisContext): FieldDiagnosis {
  const { post, fieldName, expectedPath, config } = context;
  const diagnosis: FieldDiagnosis = {
    fieldName,
    present: false,
    value: null,
    rawPath: expectedPath,
    possibleReasons: [],
    suggestions: [],
  };

  // 检查 ACF 对象是否存在
  if (expectedPath[0] === 'acf') {
    if (!post.acf || typeof post.acf !== 'object') {
      diagnosis.possibleReasons.push('ACF 对象不存在于 API 响应中');
      diagnosis.suggestions.push(
        '检查 ACF to REST API 插件是否已安装并启用',
        '检查 ACF 字段是否设置了 show_in_rest = true',
        '确认 REST API 端点是否支持 ACF 字段'
      );
      
      // 生成 curl 验证命令
      const url = `${config.wpBaseUrl}${config.wpApiProfileEndpoint}/${post.id}?_embed`;
      diagnosis.curlExample = buildCurlCommand(config, url);
      return diagnosis;
    }
    
    // 检查字段是否存在（直接访问扁平字段名）
    const fieldKey = expectedPath.slice(1).join('_'); // 将路径合并为扁平键名
    const fieldExistsDirectly = fieldKey in (post.acf || {});
    
    // 也检查字段值是否为 null（字段存在但值为空）
    const fieldValue = post.acf?.[fieldKey];
    const fieldExists = fieldExistsDirectly && fieldValue !== undefined;
    
    if (!fieldExistsDirectly) {
      diagnosis.possibleReasons.push(`ACF 字段 "${fieldKey}" 不存在于 ACF 对象中`);
      diagnosis.suggestions.push(
        `检查 ACF 字段名是否正确（注意大小写、下划线）`,
        `确认该 post 在 WordPress 后台是否已填写该字段`,
        `字段 key 应为: ${fieldKey}`
      );
      
      // 列出实际存在的 ACF 字段
      const actualFields = Object.keys(post.acf || {}).join(', ');
      if (actualFields) {
        // 限制字段列表长度，避免输出过长
        const fieldsList = actualFields.length > 500 
          ? actualFields.substring(0, 500) + '... (还有更多字段)'
          : actualFields;
        diagnosis.suggestions.push(`当前 ACF 字段（前100个）: ${fieldsList}`);
      } else {
        diagnosis.suggestions.push('ACF 对象为空，可能该 post 未设置任何 ACF 字段');
      }
    } else if (fieldValue === null || fieldValue === '' || fieldValue === undefined) {
      diagnosis.possibleReasons.push(`ACF 字段 "${fieldKey}" 存在但值为 null/空`);
      diagnosis.suggestions.push(
        `字段存在于 ACF 对象中，但在 WordPress 后台未填写值`,
        `检查 WordPress 后台该字段是否有值`,
        `如果使用多语言插件，检查当前语言版本的字段值`
      );
    }
  }
  
  // 检查 taxonomy
  if (expectedPath[0] === 'taxonomy') {
    const taxonomyName = expectedPath[1];
    const hasTaxonomy = post._embedded?.['wp:term']?.some(terms => 
      terms.some(term => term.taxonomy === taxonomyName)
    ) || post[taxonomyName]?.length > 0;
    
    if (!hasTaxonomy) {
      diagnosis.possibleReasons.push(`Taxonomy "${taxonomyName}" 未关联到此 post`);
      diagnosis.suggestions.push(
        `检查 WordPress 后台该 post 是否设置了 "${taxonomyName}" 分类`,
        `确认 taxonomy 是否已注册到 post type "profile"`,
        `检查 taxonomy REST API 是否已启用`
      );
    }
  }
  
  // 检查 meta 数据
  if (expectedPath[0] === 'meta') {
    const metaKey = expectedPath[1];
    const hasMeta = post.meta?.[metaKey] !== undefined || 
      post.meta_data?.some(m => m.key === metaKey);
    
    if (!hasMeta) {
      diagnosis.possibleReasons.push(`Post meta "${metaKey}" 不存在`);
      diagnosis.suggestions.push(
        `检查 WordPress 后台该 post 的 custom fields`,
        `确认 meta key 名称是否正确（注意大小写）`
      );
    }
  }
  
  // 通用建议
  if (diagnosis.possibleReasons.length === 0) {
    diagnosis.possibleReasons.push('字段值为 null 或空字符串');
    diagnosis.suggestions.push(
      '检查 WordPress 后台该字段是否为空',
      '如果使用多语言插件，检查当前语言版本是否有值',
      '检查是否有缓存问题（尝试清除缓存）'
    );
  }
  
  // 添加通用的验证命令
  if (!diagnosis.curlExample) {
    const url = `${config.wpBaseUrl}${config.wpApiProfileEndpoint}/${post.id}?_embed`;
    diagnosis.curlExample = buildCurlCommand(config, url);
  }
  
  // 添加多语言相关的建议
  diagnosis.suggestions.push(
    '如果使用 WPML/Polylang，尝试添加 ?lang=zh 参数',
    '检查 REST API 缓存：尝试添加 ?cache-bust=' + Date.now() + ' 参数'
  );
  
  return diagnosis;
}

/**
 * 构建 curl 验证命令
 */
function buildCurlCommand(config: SyncConfig, url: string): string {
  let curl = `curl '${url}'`;
  
  switch (config.auth.type) {
    case 'basic':
      curl += ` -u '${config.auth.username}:${config.auth.password}'`;
      break;
    case 'bearer':
      curl += ` -H 'Authorization: Bearer ${config.auth.token}'`;
      break;
    case 'wp-app-password':
      curl += ` -u '${config.auth.username}:${config.auth.appPassword}'`;
      break;
  }
  
  curl += ` -H 'Accept: application/json'`;
  return curl;
}

/**
 * 分析所有缺失的关键字段
 */
export function analyzeMissingFields(
  post: WordPressPostWithTerms,
  extractedFields: Record<string, ExtractedField>,
  config: SyncConfig
): FieldDiagnosis[] {
  const diagnoses: FieldDiagnosis[] = [];
  
  // 检查所有配置的字段映射
  for (const mapping of config.fieldMappings) {
    const dbField = mapping.dbField;
    const extracted = extractedFields[dbField];
    
    // 如果字段缺失或为 null，进行诊断
    if (!extracted || !extracted.present || extracted.value === null || extracted.value === undefined) {
      const expectedPath = mapping.type === 'acf' 
        ? ['acf', ...(Array.isArray(mapping.wpField) ? mapping.wpField[0] : mapping.wpField).split('_')]
        : mapping.type === 'taxonomy'
        ? ['taxonomy', mapping.taxonomyName || '']
        : ['meta', Array.isArray(mapping.wpField) ? mapping.wpField[0] : mapping.wpField];
      
      const diagnosis = diagnoseMissingField({
        post,
        fieldName: dbField,
        expectedPath,
        config,
      });
      
      // 记录原始值（如果存在）
      if (extracted) {
        diagnosis.value = extracted.value;
        diagnosis.present = extracted.present;
      }
      
      diagnoses.push(diagnosis);
    }
  }
  
  // 特别关注 school_profile_type 字段（如果配置了）
  const profileTypeMapping = config.fieldMappings.find(m => 
    (Array.isArray(m.wpField) ? m.wpField : [m.wpField]).some(f => 
      f === 'school_profile_type' || f === 'schoolProfileType'
    )
  );
  
  if (profileTypeMapping) {
    const extracted = extractedFields[profileTypeMapping.dbField];
    if (!extracted || !extracted.present || extracted.value === null) {
      const diagnosis = diagnoseMissingField({
        post,
        fieldName: 'school_profile_type',
        expectedPath: ['acf', 'school_profile_type'],
        config,
      });
      
      // 添加更详细的建议
      diagnosis.suggestions.unshift(
        '确认 ACF 字段 "school_profile_type" 是否已创建并关联到 post type "profile"',
        '检查 ACF 字段设置中的 "Return Format" 配置',
        '验证 ACF 字段 group 是否已分配给 "profile" post type'
      );
      
      // 检查是否所有 profile 都缺少这个字段
      diagnosis.possibleReasons.push(
        '如果所有 profile 都缺少此字段，可能是 ACF 配置问题而非单个 post 的问题'
      );
      
      diagnoses.push(diagnosis);
    }
  }
  
  return diagnoses;
}

/**
 * 生成详细的诊断报告
 */
export function generateDiagnosisReport(
  diagnoses: FieldDiagnosis[],
  post: WordPressPostWithTerms,
  config: SyncConfig
): string {
  if (diagnoses.length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  lines.push(`\n诊断报告 - WP Post ID: ${post.id} (${post.slug})`);
  lines.push('─'.repeat(60));
  
  for (const diagnosis of diagnoses) {
    lines.push(`\n字段: ${diagnosis.fieldName}`);
    lines.push(`  状态: ${diagnosis.present ? '存在但为空' : '不存在'}`);
    lines.push(`  预期路径: ${diagnosis.rawPath.join('.')}`);
    
    if (diagnosis.possibleReasons.length > 0) {
      lines.push(`  可能原因:`);
      diagnosis.possibleReasons.forEach(reason => {
        lines.push(`    - ${reason}`);
      });
    }
    
    if (diagnosis.suggestions.length > 0) {
      lines.push(`  建议操作:`);
      diagnosis.suggestions.forEach(suggestion => {
        lines.push(`    - ${suggestion}`);
      });
    }
    
    if (diagnosis.curlExample) {
      lines.push(`  验证命令:`);
      lines.push(`    ${diagnosis.curlExample}`);
    }
  }
  
  lines.push('\n' + '─'.repeat(60));
  return lines.join('\n');
}

