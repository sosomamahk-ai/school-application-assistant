#!/usr/bin/env node

/**
 * 自动检测 WordPress Profile post type 的 REST API 端点
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

interface EndpointTestResult {
  endpoint: string;
  exists: boolean;
  accessible: boolean;
  postCount?: number;
  error?: string;
  samplePosts?: Array<{ id: number; slug: string; title: string }>;
}

/**
 * 构建认证头
 */
function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const authType = (process.env.WP_AUTH_TYPE || 'none').toLowerCase();

  switch (authType) {
    case 'basic':
      if (process.env.WP_AUTH_USERNAME && process.env.WP_AUTH_PASSWORD) {
        const credentials = Buffer.from(
          `${process.env.WP_AUTH_USERNAME}:${process.env.WP_AUTH_PASSWORD}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;

    case 'bearer':
      if (process.env.WP_AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.WP_AUTH_TOKEN}`;
      }
      break;

    case 'wp-app-password':
      if (process.env.WP_AUTH_USERNAME && process.env.WP_AUTH_APP_PASSWORD) {
        const credentials = Buffer.from(
          `${process.env.WP_AUTH_USERNAME}:${process.env.WP_AUTH_APP_PASSWORD}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
  }

  return headers;
}

/**
 * 测试端点
 */
async function testEndpoint(
  baseUrl: string,
  endpoint: string
): Promise<EndpointTestResult> {
  const url = `${baseUrl}${endpoint}?per_page=1`;
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (response.status === 404) {
      return {
        endpoint,
        exists: false,
        accessible: false,
        error: 'Endpoint not found (404)',
      };
    }

    if (!response.ok) {
      return {
        endpoint,
        exists: true,
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json() as any[];

    // 获取总数
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    // 获取样本
    const samplePosts = Array.isArray(data)
      ? data.slice(0, 3).map((post: any) => ({
          id: post.id,
          slug: post.slug,
          title: typeof post.title === 'string' ? post.title : post.title?.rendered || 'Untitled',
        }))
      : [];

    return {
      endpoint,
      exists: true,
      accessible: true,
      postCount: total,
      samplePosts,
    };
  } catch (error: any) {
    return {
      endpoint,
      exists: false,
      accessible: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * 获取所有注册的 post types
 */
async function getRegisteredPostTypes(baseUrl: string): Promise<string[]> {
  try {
    const url = `${baseUrl}/wp-json/wp/v2/types`;
    const headers = buildAuthHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const types = await response.json() as Record<string, any>;
    return Object.keys(types).filter(
      (key) => types[key].rest_base && key !== 'attachment'
    );
  } catch (error) {
    return [];
  }
}

/**
 * 询问用户输入
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('WordPress Profile REST API 端点检测工具');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 获取 WordPress URL
  const baseUrl = process.env.WP_BASE_URL || 'http://localhost:3000';
  console.log(`WordPress URL: ${baseUrl}`);
  console.log('');

  // 检查连接
  console.log('步骤 1: 检查 WordPress REST API 连接...');
  try {
    const testUrl = `${baseUrl}/wp-json/wp/v2`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: buildAuthHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(`❌ WordPress REST API 不可访问: HTTP ${response.status}`);
      console.log('');
      console.log('请检查:');
      console.log('  1. WordPress 站点是否运行');
      console.log('  2. WP_BASE_URL 配置是否正确');
      console.log('  3. 认证配置是否正确（如果需要）');
      process.exit(1);
    }

    console.log('✅ WordPress REST API 可访问');
  } catch (error: any) {
    console.log(`❌ 连接失败: ${error.message}`);
    console.log('');
    console.log('请检查:');
    console.log('  1. WordPress 站点是否运行');
    console.log('  2. WP_BASE_URL 配置是否正确');
    process.exit(1);
  }

  console.log('');

  // 获取所有注册的 post types
  console.log('步骤 2: 获取所有注册的 post types...');
  const postTypes = await getRegisteredPostTypes(baseUrl);

  if (postTypes.length > 0) {
    console.log(`✅ 找到 ${postTypes.length} 个 post types:`);
    postTypes.forEach((type) => {
      console.log(`   - ${type}`);
    });
  } else {
    console.log('⚠️  无法自动获取 post types，将尝试常见端点');
  }

  console.log('');

  // 要测试的常见端点
  const endpointsToTest = [
    '/wp-json/wp/v2/profile',
    '/wp-json/wp/v2/profiles',
    '/wp-json/wp/v2/school',
    '/wp-json/wp/v2/schools',
    '/wp-json/acf/v3/profile',
  ];

  // 添加从注册类型生成的端点
  if (postTypes.includes('profile')) {
    endpointsToTest.unshift('/wp-json/wp/v2/profile');
  }
  if (postTypes.includes('profiles')) {
    endpointsToTest.unshift('/wp-json/wp/v2/profiles');
  }

  // 去重
  const uniqueEndpoints = Array.from(new Set(endpointsToTest));

  console.log('步骤 3: 测试可能的端点...');
  console.log('');

  const results: EndpointTestResult[] = [];

  for (const endpoint of uniqueEndpoints) {
    process.stdout.write(`测试 ${endpoint}... `);
    const result = await testEndpoint(baseUrl, endpoint);
    results.push(result);

    if (result.exists && result.accessible) {
      console.log(`✅ 可用 (${result.postCount || 0} 条记录)`);
      if (result.samplePosts && result.samplePosts.length > 0) {
        result.samplePosts.forEach((post) => {
          console.log(`     示例: ID ${post.id} - ${post.title}`);
        });
      }
    } else if (result.exists) {
      console.log(`⚠️  存在但不可访问: ${result.error}`);
    } else {
      console.log(`❌ 不存在`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('检测结果');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 找到可用的端点
  const availableEndpoints = results.filter((r) => r.exists && r.accessible);

  if (availableEndpoints.length === 0) {
    console.log('❌ 未找到可用的 Profile 端点');
    console.log('');
    console.log('可能的原因:');
    console.log('  1. Profile post type 未注册到 REST API');
    console.log('  2. REST API 端点路径不同');
    console.log('  3. 需要认证但没有正确配置');
    console.log('');
    console.log('建议:');
    console.log('  1. 检查 WordPress 后台，确认 post type 名称');
    console.log('  2. 确认 post type 已设置 show_in_rest = true');
    console.log('  3. 尝试手动访问: curl ' + baseUrl + '/wp-json/wp/v2');
    console.log('  4. 查看 WordPress 文档或联系管理员');
    process.exit(1);
  }

  // 显示所有可用端点
  console.log('✅ 找到以下可用的端点:');
  console.log('');

  availableEndpoints.forEach((result, index) => {
    console.log(`${index + 1}. ${result.endpoint}`);
    console.log(`   记录数: ${result.postCount || 0}`);
    if (result.samplePosts && result.samplePosts.length > 0) {
      console.log(`   示例记录:`);
      result.samplePosts.forEach((post) => {
        console.log(`     - ID ${post.id}: ${post.title}`);
      });
    }
    console.log('');
  });

  // 推荐最佳端点
  const bestEndpoint = availableEndpoints[0];
  console.log('═══════════════════════════════════════════════════════════');
  console.log('推荐配置');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`推荐的端点: ${bestEndpoint.endpoint}`);
  console.log('');
  console.log('在 .env 文件中添加或更新:');
  console.log('');
  console.log(`WP_API_PROFILE_ENDPOINT=${bestEndpoint.endpoint}`);
  console.log('');

  // 询问是否自动更新 .env 文件
  if (process.argv.includes('--auto-update') || process.argv.includes('-a')) {
    updateEnvFile(bestEndpoint.endpoint);
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await askQuestion(
      rl,
      '是否自动更新 .env 文件？(y/n): '
    );
    rl.close();

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      updateEnvFile(bestEndpoint.endpoint);
    }
  }
}

/**
 * 更新 .env 文件
 */
function updateEnvFile(endpoint: string) {
  const path = require('path');
  const fs = require('fs');
  const envPath = path.join(process.cwd(), '.env');

  let envContent = '';
  let hasWpEndpoint = false;

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    // 更新或添加 WP_API_PROFILE_ENDPOINT
    const updatedLines = lines.map((line: string) => {
      if (line.trim().startsWith('WP_API_PROFILE_ENDPOINT=')) {
        hasWpEndpoint = true;
        return `WP_API_PROFILE_ENDPOINT=${endpoint}`;
      }
      return line;
    });

    envContent = updatedLines.join('\n');

    // 如果没有找到，添加到文件末尾
    if (!hasWpEndpoint) {
      envContent += `\n# WordPress Profile API Endpoint\nWP_API_PROFILE_ENDPOINT=${endpoint}\n`;
    }
  } else {
    envContent = `# WordPress Profile API Endpoint\nWP_API_PROFILE_ENDPOINT=${endpoint}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`✅ 已更新 .env 文件: WP_API_PROFILE_ENDPOINT=${endpoint}`);
  console.log('');
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('发生错误:', error);
    process.exit(1);
  });
}

export { main as detectEndpoint };

