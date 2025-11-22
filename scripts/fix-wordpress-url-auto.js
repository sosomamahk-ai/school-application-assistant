#!/usr/bin/env node

/**
 * 自动修复 WordPress Base URL 环境变量配置（非交互式版本）
 * 
 * 使用方法：
 *   node scripts/fix-wordpress-url-auto.js
 *   node scripts/fix-wordpress-url-auto.js https://your-wordpress-url.com
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const DEFAULT_WORDPRESS_URL = 'https://sosomama.com';

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
      trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL=')
    ) && !trimmed.startsWith('#');
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
function addOrUpdateWordPressUrl(lines, url, usePublicPrefix = true) {
  const varName = usePublicPrefix ? 'NEXT_PUBLIC_WORDPRESS_BASE_URL' : 'WORDPRESS_BASE_URL';
  const newLine = `${varName}="${url}"`;
  
  // 查找是否需要更新现有配置
  let found = false;
  let foundOtherType = false;
  const updatedLines = lines.map(line => {
    const trimmed = line.trim();
    
    // 如果是注释掉的配置，保持不变
    if (trimmed.startsWith('#') && trimmed.includes('WORDPRESS')) {
      return line;
    }
    
    // 如果找到现有配置，更新它
    if (trimmed.startsWith('WORDPRESS_BASE_URL=') || trimmed.startsWith('NEXT_PUBLIC_WORDPRESS_BASE_URL=')) {
      if (trimmed.startsWith(`${varName}=`)) {
        found = true;
        return newLine;
      } else {
        // 找到其他类型的配置，标记为需要替换
        foundOtherType = true;
        return null; // 标记为删除
      }
    }
    
    return line;
  }).filter(line => line !== null); // 移除标记为删除的行
  
  // 如果没有找到相同类型的配置，添加新的
  if (!found) {
    // 如果找到了其他类型的配置，已经在上面删除了，现在添加新的
    // 查找最后一个非空行，在后面添加
    let insertIndex = updatedLines.length;
    for (let i = updatedLines.length - 1; i >= 0; i--) {
      if (updatedLines[i].trim()) {
        insertIndex = i + 1;
        break;
      }
    }
    
    // 检查是否已有 WordPress 相关注释
    let hasComment = false;
    for (let i = 0; i < updatedLines.length; i++) {
      if (updatedLines[i].includes('WordPress') || updatedLines[i].includes('WORDPRESS')) {
        hasComment = true;
        // 如果有注释，在注释后添加
        if (updatedLines[i].trim().startsWith('#')) {
          insertIndex = i + 1;
          break;
        }
      }
    }
    
    // 如果文件不为空且最后一行不是空行，添加一个空行
    if (updatedLines.length > 0 && insertIndex > 0 && updatedLines[insertIndex - 1].trim() && !updatedLines[insertIndex - 1].includes('WordPress')) {
      updatedLines.splice(insertIndex, 0, '');
    }
    
    // 如果没有注释，添加注释
    if (!hasComment) {
      updatedLines.splice(insertIndex, 0, `# WordPress Base URL (从 WordPress 加载学校数据)`);
      insertIndex++;
    }
    
    updatedLines.splice(insertIndex, 0, newLine);
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
function main() {
  console.log('🔧 WordPress Base URL 自动修复工具（非交互式）\n');
  
  // 从命令行参数获取 URL
  const args = process.argv.slice(2);
  let providedUrl = args[0] || DEFAULT_WORDPRESS_URL;
  
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
    
    if (providedUrl === existingUrl) {
      console.log('\n✅ 配置已存在且正确，无需修改');
      return;
    }
    
    console.log(`🔄 将更新为: ${providedUrl}\n`);
  } else {
    console.log(`➕ 将添加 WordPress URL: ${providedUrl}\n`);
  }
  
  // 验证和清理 URL
  const validatedUrl = validateUrl(providedUrl);
  
  if (!validatedUrl) {
    console.error('\n❌ URL 格式不正确！');
    console.error('URL 应该以 http:// 或 https:// 开头');
    console.error('示例: https://example.com\n');
    process.exit(1);
  }
  
  // 默认使用 NEXT_PUBLIC_ 前缀（推荐）
  const usePublicPrefix = true;
  
  // 更新或添加配置
  const updatedLines = addOrUpdateWordPressUrl(lines, validatedUrl, usePublicPrefix);
  const newContent = updatedLines.join('\n');
  
  // 备份原文件（如果存在）
  if (exists) {
    const backupFile = `${ENV_FILE}.backup.${Date.now()}`;
    fs.writeFileSync(backupFile, readEnvFile().content);
    console.log(`📦 已备份原文件: ${path.basename(backupFile)}`);
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
}

// 运行主函数
try {
  main();
} catch (error) {
  console.error('\n❌ 错误:', error.message);
  process.exit(1);
}

