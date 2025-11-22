#!/usr/bin/env node

/**
 * 自动修复 WordPress Base URL 环境变量配置
 * 
 * 使用方法：
 *   node scripts/fix-wordpress-url.js
 *   node scripts/fix-wordpress-url.js --url https://your-wordpress-url.com
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '..', '.env');
const DEFAULT_WORDPRESS_URL = 'https://sosomama.com';

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问用户输入
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 读取现有 .env 文件
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    return { exists: false, content: '', lines: [] };
  }
  
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const lines = content.split('\n');
  
  return { exists: true, content, lines };
}

// 检查是否已有 WordPress URL 配置
function hasWordPressUrl(lines) {
  return lines.some(line => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('WORDPRESS_BASE_URL=') ||
      trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL=') ||
      (trimmed.startsWith('#') && trimmed.includes('WORDPRESS'))
    );
  });
}

// 查找已有的 WordPress URL 配置值
function getExistingWordPressUrl(lines) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('WORDPRESS_BASE_URL=') && !trimmed.startsWith('#')) {
      const match = trimmed.match(/WORDPRESS_BASE_URL=(.+)/);
      if (match) {
        return match[1].replace(/^["']|["']$/g, ''); // 移除引号
      }
    }
    if (trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL=') && !trimmed.startsWith('#')) {
      const match = trimmed.match(/NEXT_PUBLIC_WORDPRESS_BASE_URL=(.+)/);
      if (match) {
        return match[1].replace(/^["']|["']$/g, ''); // 移除引号
      }
    }
  }
  return null;
}

// 添加或更新 WordPress URL 配置
function addOrUpdateWordPressUrl(lines, url, usePublicPrefix = false) {
  const varName = usePublicPrefix ? 'NEXT_PUBLIC_WORDPRESS_BASE_URL' : 'WORDPRESS_BASE_URL';
  const newLine = `${varName}="${url}"`;
  
  // 查找是否需要更新现有配置
  let found = false;
  const updatedLines = lines.map(line => {
    const trimmed = line.trim();
    
    // 如果是注释掉的配置，保持不变
    if (trimmed.startsWith('#') && trimmed.includes('WORDPRESS')) {
      return line;
    }
    
    // 如果找到现有配置，更新它
    if (trimmed.startsWith('WORDPRESS_BASE_URL=') || trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL=')) {
      found = true;
      // 如果类型不匹配，移除旧配置并添加新的
      if ((usePublicPrefix && trimmed.startsWith('WORDPRESS_BASE_URL=')) ||
          (!usePublicPrefix && trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL='))) {
        return null; // 标记为删除
      }
      return newLine;
    }
    
    return line;
  }).filter(line => line !== null); // 移除标记为删除的行
  
  // 如果没有找到，在文件末尾添加
  if (!found) {
    // 查找最后一个非空行，在后面添加
    let insertIndex = updatedLines.length;
    for (let i = updatedLines.length - 1; i >= 0; i--) {
      if (updatedLines[i].trim()) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // 如果文件不为空且最后一行不是空行，添加一个空行
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1].trim()) {
      updatedLines.splice(insertIndex, 0, '');
    }
    
    updatedLines.splice(insertIndex, 0, `# WordPress Base URL (从 WordPress 加载学校数据)`);
    updatedLines.splice(insertIndex + 1, 0, newLine);
  }
  
  return updatedLines;
}

// 验证 URL 格式
function validateUrl(url) {
  if (!url) return false;
  
  // 基本的 URL 格式验证
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    return false;
  }
  
  // 移除尾部斜杠
  return url.replace(/\/+$/, '');
}

// 主函数
async function main() {
  console.log('🔧 WordPress Base URL 自动修复工具\n');
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  let providedUrl = null;
  let usePublicPrefix = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      providedUrl = args[i + 1];
      i++;
    } else if (args[i] === '--public') {
      usePublicPrefix = true;
    }
  }
  
  // 读取 .env 文件
  const { exists, lines } = readEnvFile();
  
  if (!exists) {
    console.log('⚠️  .env 文件不存在，正在创建...\n');
  } else {
    console.log('✅ 找到 .env 文件\n');
  }
  
  // 检查是否已有配置
  const existingUrl = getExistingWordPressUrl(lines);
  
  if (existingUrl) {
    console.log(`📋 当前 WordPress URL: ${existingUrl}`);
    
    if (providedUrl) {
      // 命令行提供了 URL，询问是否更新
      const answer = await askQuestion(`\n是否更新为: ${providedUrl}? (y/n): `);
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('\n✅ 保持现有配置不变');
        rl.close();
        return;
      }
    } else {
      // 没有提供 URL，询问是否保持现有配置
      const answer = await askQuestion('\n是否保持现有配置? (y/n，输入 n 可修改): ');
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\n✅ 配置已存在，无需修改');
        rl.close();
        return;
      }
    }
  }
  
  // 获取 WordPress URL
  let wordpressUrl = providedUrl || existingUrl || null;
  
  if (!wordpressUrl) {
    console.log('\n请输入您的 WordPress 网站 URL');
    console.log(`示例: ${DEFAULT_WORDPRESS_URL}\n`);
    
    wordpressUrl = await askQuestion('WordPress URL: ');
    
    if (!wordpressUrl) {
      console.log('\n⚠️  未输入 URL，使用默认值:', DEFAULT_WORDPRESS_URL);
      wordpressUrl = DEFAULT_WORDPRESS_URL;
    }
  }
  
  // 验证和清理 URL
  const validatedUrl = validateUrl(wordpressUrl);
  
  if (!validatedUrl) {
    console.error('\n❌ URL 格式不正确！');
    console.error('URL 应该以 http:// 或 https:// 开头');
    console.error('示例: https://example.com\n');
    rl.close();
    process.exit(1);
  }
  
  // 询问是否使用 NEXT_PUBLIC_ 前缀
  if (!existingUrl && !providedUrl) {
    console.log('\n选择环境变量类型:');
    console.log('1. WORDPRESS_BASE_URL (仅服务器端)');
    console.log('2. NEXT_PUBLIC_WORDPRESS_BASE_URL (服务器端和客户端，推荐)');
    
    const choice = await askQuestion('\n请选择 (1/2，默认 2): ');
    usePublicPrefix = (choice !== '1');
  } else if (providedUrl) {
    // 如果通过命令行提供 URL，默认使用 NEXT_PUBLIC_ 前缀（推荐）
    usePublicPrefix = true;
  }
  
  // 更新或添加配置
  const updatedLines = addOrUpdateWordPressUrl(lines, validatedUrl, usePublicPrefix);
  const newContent = updatedLines.join('\n');
  
  // 备份原文件（如果存在）
  if (exists) {
    const backupFile = `${ENV_FILE}.backup.${Date.now()}`;
    fs.writeFileSync(backupFile, readEnvFile().content);
    console.log(`\n📦 已备份原文件: ${path.basename(backupFile)}`);
  }
  
  // 写入新内容
  fs.writeFileSync(ENV_FILE, newContent);
  
  const varName = usePublicPrefix ? 'NEXT_PUBLIC_WORDPRESS_BASE_URL' : 'WORDPRESS_BASE_URL';
  console.log(`\n✅ 已配置 ${varName}=${validatedUrl}`);
  
  if (existingUrl) {
    console.log('🔄 配置已更新');
  } else {
    console.log('➕ 配置已添加');
  }
  
  console.log('\n⚠️  重要提示:');
  console.log('1. 如果开发服务器正在运行，请重启服务器使配置生效');
  console.log('2. 如果部署在 Vercel，需要在 Vercel 环境变量中设置相同的值');
  console.log('3. 验证配置: 访问 http://localhost:3000/api/wordpress/schools 应该返回学校数据\n');
  
  rl.close();
}

// 运行主函数
main().catch((error) => {
  console.error('\n❌ 错误:', error.message);
  rl.close();
  process.exit(1);
});

