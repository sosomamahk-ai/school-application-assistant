#!/usr/bin/env node

/**
 * 测试单个 WordPress post 的 API 响应结构
 * 用于调试字段提取问题
 */

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testSinglePost(postId: number) {
  const baseUrl = process.env.WP_BASE_URL || 'https://sosomama.com';
  const endpoint = process.env.WP_API_PROFILE_ENDPOINT || '/wp-json/wp/v2/profile';
  
  const url = `${baseUrl}${endpoint}/${postId}?_embed`;
  
  console.log('测试 URL:', url);
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
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Post ID: ${post.id}`);
    console.log(`Slug: ${post.slug}`);
    console.log(`Title: ${typeof post.title === 'string' ? post.title : post.title?.rendered}`);
    console.log('');
    
    console.log('ACF 对象:');
    if (post.acf) {
      console.log(JSON.stringify(post.acf, null, 2).substring(0, 2000));
      console.log('');
      console.log('ACF 字段列表:', Object.keys(post.acf).slice(0, 20).join(', '));
      console.log('');
      console.log('关键字段:');
      console.log('  name_english:', post.acf.name_english);
      console.log('  name_short:', post.acf.name_short);
      console.log('  school_profile_type:', post.acf.school_profile_type);
    } else {
      console.log('  ACF 对象不存在或为空');
    }
    
    console.log('');
    console.log('Taxonomy Terms (_embedded):');
    if (post._embedded?.['wp:term']) {
      const allTerms = post._embedded['wp:term'].flat();
      console.log('所有 terms:', JSON.stringify(allTerms, null, 2).substring(0, 1000));
      
      // 按 taxonomy 分组
      const termsByTaxonomy: Record<string, any[]> = {};
      allTerms.forEach((term: any) => {
        if (!termsByTaxonomy[term.taxonomy]) {
          termsByTaxonomy[term.taxonomy] = [];
        }
        termsByTaxonomy[term.taxonomy].push(term);
      });
      
      console.log('');
      console.log('按 taxonomy 分组:');
      for (const [taxonomy, terms] of Object.entries(termsByTaxonomy)) {
        console.log(`  ${taxonomy}:`, terms.map((t: any) => t.name || t.slug).join(', '));
      }
    } else {
      console.log('  未找到 _embedded["wp:term"]');
    }
    
    console.log('');
    console.log('直接访问 taxonomy 字段:');
    console.log('  profile_type:', post.profile_type);
    console.log('  band-type:', post['band-type']);
    console.log('  country:', post.country);
    console.log('  location:', post.location);
    
  } catch (error: any) {
    console.error('错误:', error.message);
  }
}

// 从命令行参数获取 post ID，或使用默认值
const postId = process.argv[2] ? parseInt(process.argv[2], 10) : 13307;

console.log('═══════════════════════════════════════════════════════════');
console.log('测试 WordPress Post API 响应结构');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

testSinglePost(postId).catch(console.error);

