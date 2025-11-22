/**
 * 自动更新 OpenAI 代理配置
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const WORKER_URL = 'https://openai-proxy.sosomamahk.workers.dev';
const ENV_FILE = path.join(__dirname, '..', '.env');

console.log('='.repeat(70));
console.log('🔧 自动更新 OpenAI 代理配置');
console.log('='.repeat(70));
console.log('');

// 读取现有的 .env 文件
let envContent = '';
let envVars = {};

if (fs.existsSync(ENV_FILE)) {
  envContent = fs.readFileSync(ENV_FILE, 'utf8');
  console.log('✅ 找到 .env 文件');
  
  // 解析现有环境变量
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // 移除引号
      if (key.trim()) {
        envVars[key.trim()] = value;
      }
    }
  });
} else {
  console.log('⚠️  .env 文件不存在，将创建新文件');
}

// 检查当前的配置
console.log('');
console.log('当前配置:');
console.log(`  OPENAI_BASE_URL: ${envVars.OPENAI_BASE_URL || '(未设置)'}`);
console.log(`  OPENAI_API_KEY: ${envVars.OPENAI_API_KEY ? envVars.OPENAI_API_KEY.substring(0, 10) + '...' : '(未设置)'}`);
console.log('');

// 更新配置
const updates = {};
let needsUpdate = false;

// 更新 OPENAI_BASE_URL
if (envVars.OPENAI_BASE_URL !== WORKER_URL) {
  updates.OPENAI_BASE_URL = WORKER_URL;
  needsUpdate = true;
  console.log(`📝 将更新 OPENAI_BASE_URL: ${WORKER_URL}`);
}

// 检查 OPENAI_API_KEY
if (!envVars.OPENAI_API_KEY || envVars.OPENAI_API_KEY === 'sk-your-actual-api-key-here' || envVars.OPENAI_API_KEY === 'mock-api-key') {
  console.log('⚠️  警告: OPENAI_API_KEY 未设置或使用默认值');
  console.log('   请在 .env 文件中手动设置您的 OpenAI API Key');
  console.log(`   格式: OPENAI_API_KEY=sk-proj-...`);
  console.log('');
}

// 如果不需要更新
if (!needsUpdate && envVars.OPENAI_BASE_URL) {
  console.log('✅ 配置已是最新，无需更新');
  console.log('');
} else {
  // 更新环境变量
  Object.keys(updates).forEach(key => {
    envVars[key] = updates[key];
  });

  // 重建 .env 文件内容
  let newEnvContent = '';
  const processedKeys = new Set();

  // 先处理已存在的行，更新需要的变量
  const lines = envContent ? envContent.split('\n') : [];
  let inOpenAISection = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // 检查是否是 OpenAI 相关配置
    if (trimmed.includes('OPENAI')) {
      inOpenAISection = true;
    }
    
    // 检查是否是注释或其他部分
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key] = trimmed.split('=');
      const keyTrimmed = key.trim();
      
      if (updates[keyTrimmed]) {
        // 更新这一行
        newEnvContent += `${keyTrimmed}=${updates[keyTrimmed]}\n`;
        processedKeys.add(keyTrimmed);
        delete updates[keyTrimmed];
      } else if (!processedKeys.has(keyTrimmed)) {
        // 保留原有行
        newEnvContent += line + '\n';
        processedKeys.add(keyTrimmed);
      }
    } else {
      // 保留注释和空行
      if (!inOpenAISection || trimmed.startsWith('#') || trimmed === '') {
        newEnvContent += line + '\n';
      } else if (inOpenAISection && Object.keys(updates).length > 0 && trimmed === '') {
        // 在 OpenAI 部分添加新配置
        Object.keys(updates).forEach(key => {
          newEnvContent += `${key}=${updates[key]}\n`;
          processedKeys.add(key);
        });
        delete updates[key];
        newEnvContent += line + '\n';
      } else {
        newEnvContent += line + '\n';
      }
    }
  });

  // 添加新的配置（如果还没有处理）
  Object.keys(updates).forEach(key => {
    if (!processedKeys.has(key)) {
      // 检查是否已经有 OpenAI 部分的注释
      if (!newEnvContent.includes('# OpenAI')) {
        newEnvContent += '\n# OpenAI Configuration\n';
      }
      newEnvContent += `${key}=${updates[key]}\n`;
      processedKeys.add(key);
    }
  });

  // 确保文件以换行符结尾
  if (newEnvContent && !newEnvContent.endsWith('\n')) {
    newEnvContent += '\n';
  }

  // 如果没有现有内容，创建基本结构
  if (!envContent) {
    newEnvContent = `# Environment Variables
# Generated automatically by update-openai-config.js

# OpenAI Configuration
OPENAI_BASE_URL=${WORKER_URL}
OPENAI_API_KEY=sk-your-actual-api-key-here

`;
  }

  // 写入文件
  try {
    fs.writeFileSync(ENV_FILE, newEnvContent, 'utf8');
    console.log('✅ .env 文件已更新');
    console.log('');
  } catch (error) {
    console.error('❌ 更新 .env 文件失败:', error.message);
    process.exit(1);
  }
}

// 显示更新后的配置
console.log('='.repeat(70));
console.log('📋 更新后的配置:');
console.log('='.repeat(70));
console.log(`OPENAI_BASE_URL=${envVars.OPENAI_BASE_URL || WORKER_URL}`);
console.log(`OPENAI_API_KEY=${envVars.OPENAI_API_KEY ? envVars.OPENAI_API_KEY.substring(0, 10) + '...' : '(需要设置)'}`);
console.log('');

// 验证配置
console.log('='.repeat(70));
console.log('✅ 配置更新完成！');
console.log('='.repeat(70));
console.log('');
console.log('下一步：');
console.log('1. 如果 OPENAI_API_KEY 未设置，请编辑 .env 文件设置您的 API Key');
console.log('2. 运行诊断脚本验证配置：npm run diagnose:proxy');
console.log('3. 重启应用以加载新的环境变量');
console.log('');
console.log('📝 Worker 代码位置: cloudflare-worker-code.js');
console.log('   请确保 Worker 代码已部署到 Cloudflare Workers');
console.log('   Worker URL: https://openai-proxy.sosomamahk.workers.dev');
console.log('');

