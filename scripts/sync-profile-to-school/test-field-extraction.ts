#!/usr/bin/env node

/**
 * 测试字段提取功能（不需要数据库连接）
 */

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { loadConfig } from './config';
import { extractFields } from './field-extractor';

dotenv.config();

async function testFieldExtraction(postId: number) {
  const config = loadConfig();
  const baseUrl = config.wpBaseUrl;
  const endpoint = config.wpApiProfileEndpoint;
  
  const url = `${baseUrl}${endpoint}/${postId}?_embed`;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('测试字段提取功能');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Post ID: ${postId}`);
  console.log(`URL: ${url}`);
  console.log('');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`);
      return;
    }
    
    const post = await response.json();
    
    console.log(`Post: ${typeof post.title === 'string' ? post.title : post.title?.rendered}`);
    console.log(`Slug: ${post.slug}`);
    console.log('');
    
    // 提取字段
    console.log('开始提取字段...');
    const extractedFields = extractFields(post, config);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('提取结果:');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const mapping of config.fieldMappings) {
      const dbField = mapping.dbField;
      const extracted = extractedFields[dbField];
      
      console.log('');
      console.log(`字段: ${dbField} (${mapping.type})`);
      console.log(`  存在: ${extracted?.present ? '✅' : '❌'}`);
      console.log(`  值: ${extracted?.value ?? 'null'}`);
      console.log(`  路径: ${extracted?.path?.join('.') ?? 'N/A'}`);
      console.log(`  原始数据: ${JSON.stringify(extracted?.rawData).substring(0, 100)}`);
      
      // 显示 ACF 字段验证
      if (mapping.type === 'acf' && post.acf) {
        const wpField = Array.isArray(mapping.wpField) ? mapping.wpField[0] : mapping.wpField;
        const acfValue = post.acf[wpField];
        console.log(`  ACF 验证: ${wpField} = ${JSON.stringify(acfValue).substring(0, 50)}`);
      }
    }
    
    // 显示 Taxonomy 验证
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Taxonomy 验证:');
    console.log('═══════════════════════════════════════════════════════════');
    
    for (const mapping of config.taxonomyMappings || []) {
      const dbField = mapping.dbField;
      const extracted = extractedFields[dbField];
      const wpTaxonomy = Array.isArray(mapping.wpTaxonomy) ? mapping.wpTaxonomy[0] : mapping.wpTaxonomy;
      
      console.log('');
      console.log(`Taxonomy: ${dbField} (${wpTaxonomy})`);
      console.log(`  存在: ${extracted?.present ? '✅' : '❌'}`);
      console.log(`  值: ${extracted?.value ?? 'null'}`);
      
      // 检查 _embedded
      if (post._embedded?.['wp:term']) {
        const allTerms = post._embedded['wp:term'].flat();
        const matchingTerms = allTerms.filter((t: any) => t.taxonomy === wpTaxonomy);
        console.log(`  找到 ${matchingTerms.length} 个 terms:`, matchingTerms.map((t: any) => t.name || t.slug).join(', '));
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('测试完成');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error: any) {
    console.error('错误:', error.message);
    console.error(error.stack);
  }
}

// 从命令行参数获取 post ID
const postId = process.argv[2] ? parseInt(process.argv[2], 10) : 13307;

testFieldExtraction(postId).catch(console.error);

