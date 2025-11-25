#!/usr/bin/env node

/**
 * 自动配置同步脚本的环境变量
 * 检查并配置 WordPress 同步所需的 .env 变量
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ENV_FILE = path.join(PROJECT_ROOT, '.env');
const ENV_EXAMPLE = path.join(__dirname, '.env.example');

interface EnvConfig {
  key: string;
  defaultValue?: string;
  description: string;
  required: boolean;
  validator?: (value: string) => boolean | string;
}

// 定义需要配置的环境变量
const SYNC_ENV_VARS: EnvConfig[] = [
  {
    key: 'WP_BASE_URL',
    defaultValue: 'http://localhost:3000',
    description: 'WordPress 站点基础 URL',
    required: true,
    validator: (value) => {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return 'URL 必须以 http:// 或 https:// 开头';
      }
      return true;
    },
  },
  {
    key: 'WP_API_PROFILE_ENDPOINT',
    defaultValue: '/wp-json/wp/v2/profile',
    description: 'Profile post type 的 REST API 端点',
    required: false,
  },
  {
    key: 'WP_AUTH_TYPE',
    defaultValue: 'none',
    description: '认证类型 (none, basic, bearer, wp-app-password)',
    required: true,
    validator: (value) => {
      const validTypes = ['none', 'basic', 'bearer', 'wp-app-password'];
      if (!validTypes.includes(value.toLowerCase())) {
        return `必须是以下之一: ${validTypes.join(', ')}`;
      }
      return true;
    },
  },
  {
    key: 'BATCH_SIZE',
    defaultValue: '50',
    description: '批次大小',
    required: false,
    validator: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 1) {
        return '必须是大于 0 的数字';
      }
      return true;
    },
  },
  {
    key: 'LOG_LEVEL',
    defaultValue: 'info',
    description: '日志级别 (debug, info, warn, error)',
    required: false,
    validator: (value) => {
      const validLevels = ['debug', 'info', 'warn', 'error'];
      if (!validLevels.includes(value.toLowerCase())) {
        return `必须是以下之一: ${validLevels.join(', ')}`;
      }
      return true;
    },
  },
  {
    key: 'SAMPLE_FAILURE_THRESHOLD',
    defaultValue: '0.1',
    description: '抽样失败率阈值 (0.1 = 10%)',
    required: false,
    validator: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) {
        return '必须是 0 到 1 之间的小数';
      }
      return true;
    },
  },
];

// 认证相关的环境变量（根据 WP_AUTH_TYPE 动态添加）
const AUTH_ENV_VARS: Record<string, EnvConfig[]> = {
  basic: [
    {
      key: 'WP_AUTH_USERNAME',
      description: 'Basic Auth 用户名',
      required: true,
    },
    {
      key: 'WP_AUTH_PASSWORD',
      description: 'Basic Auth 密码',
      required: true,
    },
  ],
  bearer: [
    {
      key: 'WP_AUTH_TOKEN',
      description: 'Bearer Token',
      required: true,
    },
  ],
  'wp-app-password': [
    {
      key: 'WP_AUTH_USERNAME',
      description: 'WordPress 用户名',
      required: true,
    },
    {
      key: 'WP_AUTH_APP_PASSWORD',
      description: 'WordPress Application Password',
      required: true,
    },
  ],
};

// 创建 readline 接口
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// 询问用户输入
function askQuestion(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

// 验证值
function validateValue(value: string, config: EnvConfig): { valid: boolean; error?: string } {
  if (config.required && !value) {
    return { valid: false, error: '此字段为必填项' };
  }

  if (config.validator && value) {
    const result = config.validator(value);
    if (result !== true) {
      return { valid: false, error: typeof result === 'string' ? result : '验证失败' };
    }
  }

  return { valid: true };
}

// 读取现有的 .env 文件
function readEnvFile(): Record<string, string> {
  const env: Record<string, string> = {};

  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          env[key] = value;
        }
      }
    }
  }

  return env;
}

// 写入 .env 文件
function writeEnvFile(env: Record<string, string>, existingEnv: Record<string, string>) {
  // 合并现有环境变量
  const mergedEnv = { ...existingEnv, ...env };

  // 准备要写入的内容
  let content = '# WordPress Profile to School 同步脚本配置\n';
  content += '# 此部分由 setup-env.ts 自动生成\n';
  content += '# Generated at: ' + new Date().toISOString() + '\n\n';

  // 添加同步脚本相关变量
  const syncVarKeys = SYNC_ENV_VARS.map(v => v.key);
  const authVarKeys = Object.values(AUTH_ENV_VARS).flat().map(v => v.key);
  const allSyncKeys = [...syncVarKeys, ...authVarKeys, 'DATABASE_URL'];

  // 按组组织变量
  content += '# ========================================\n';
  content += '# WordPress 配置\n';
  content += '# ========================================\n';
  if (mergedEnv.WP_BASE_URL) {
    content += `WP_BASE_URL=${mergedEnv.WP_BASE_URL}\n`;
  }
  if (mergedEnv.WP_API_PROFILE_ENDPOINT) {
    content += `WP_API_PROFILE_ENDPOINT=${mergedEnv.WP_API_PROFILE_ENDPOINT}\n`;
  }

  content += '\n# ========================================\n';
  content += '# 认证配置\n';
  content += '# ========================================\n';
  if (mergedEnv.WP_AUTH_TYPE) {
    content += `WP_AUTH_TYPE=${mergedEnv.WP_AUTH_TYPE}\n`;
  }
  
  const authType = mergedEnv.WP_AUTH_TYPE?.toLowerCase() || 'none';
  if (AUTH_ENV_VARS[authType]) {
    for (const authVar of AUTH_ENV_VARS[authType]) {
      if (mergedEnv[authVar.key]) {
        content += `${authVar.key}=${mergedEnv[authVar.key]}\n`;
      }
    }
  }

  content += '\n# ========================================\n';
  content += '# 数据库配置\n';
  content += '# ========================================\n';
  if (mergedEnv.DATABASE_URL) {
    content += `DATABASE_URL=${mergedEnv.DATABASE_URL}\n`;
  } else {
    content += '# DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n';
  }

  content += '\n# ========================================\n';
  content += '# 同步脚本配置（可选）\n';
  content += '# ========================================\n';
  const optionalVars = ['BATCH_SIZE', 'LOG_LEVEL', 'SAMPLE_FAILURE_THRESHOLD'];
  for (const key of optionalVars) {
    if (mergedEnv[key]) {
      content += `${key}=${mergedEnv[key]}\n`;
    }
  }

  // 添加其他现有变量（如果不在同步脚本变量列表中）
  const otherVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(existingEnv)) {
    if (!allSyncKeys.includes(key) && !key.startsWith('WP_')) {
      otherVars[key] = value;
    }
  }

  if (Object.keys(otherVars).length > 0) {
    content += '\n# ========================================\n';
    content += '# 其他配置\n';
    content += '# ========================================\n';
    for (const [key, value] of Object.entries(otherVars)) {
      content += `${key}=${value}\n`;
    }
  }

  // 写入文件
  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('WordPress Profile 同步脚本 - 环境变量配置工具');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 读取现有环境变量
  const existingEnv = readEnvFile();
  const newEnv: Record<string, string> = {};

  // 检查 .env 文件是否存在
  if (fs.existsSync(ENV_FILE)) {
    console.log('✅ 找到现有的 .env 文件');
    
    // 检查是否已有同步脚本配置
    const hasSyncConfig = SYNC_ENV_VARS.some(v => existingEnv[v.key]);
    if (hasSyncConfig) {
      console.log('⚠️  检测到已有同步脚本配置');
      const rl = createInterface();
      const answer = await askQuestion(
        rl,
        '是否要更新现有配置？(y/n)',
        'n'
      );
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ 取消配置');
        process.exit(0);
      }
    }
  } else {
    console.log('ℹ️  未找到 .env 文件，将创建新文件');
  }

  console.log('');
  console.log('开始配置环境变量...');
  console.log('');

  const rl = createInterface();

  try {
    // 配置基础 WordPress 变量
    for (const config of SYNC_ENV_VARS) {
      const existingValue = existingEnv[config.key];
      const defaultValue = existingValue || config.defaultValue || '';

      let value: string;
      let isValid = false;

      while (!isValid) {
        value = await askQuestion(
          rl,
          `${config.description}${config.required ? ' *' : ''}`,
          defaultValue
        );

        const validation = validateValue(value, config);
        if (validation.valid) {
          isValid = true;
          if (value) {
            newEnv[config.key] = value;
          }
        } else {
          console.log(`❌ ${validation.error}`);
          console.log('');
        }
      }
    }

    // 根据认证类型配置认证变量
    const authType = newEnv.WP_AUTH_TYPE?.toLowerCase() || existingEnv.WP_AUTH_TYPE?.toLowerCase() || 'none';
    
    if (authType !== 'none' && AUTH_ENV_VARS[authType]) {
      console.log('');
      console.log(`配置 ${authType} 认证信息:`);
      console.log('');

      for (const authConfig of AUTH_ENV_VARS[authType]) {
        const existingValue = existingEnv[authConfig.key];
        let value: string;
        let isValid = false;

        while (!isValid) {
          value = await askQuestion(
            rl,
            `${authConfig.description}${authConfig.required ? ' *' : ''}`,
            existingValue || ''
          );

          const validation = validateValue(value, authConfig);
          if (validation.valid) {
            isValid = true;
            if (value) {
              newEnv[authConfig.key] = value;
            }
          } else {
            console.log(`❌ ${validation.error}`);
            console.log('');
          }
        }
      }
    }

    // 检查 DATABASE_URL
    if (!existingEnv.DATABASE_URL) {
      console.log('');
      console.log('⚠️  未找到 DATABASE_URL，这是数据库连接字符串');
      const answer = await askQuestion(
        rl,
        '是否现在配置？(y/n)',
        'y'
      );

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        let dbUrl: string;
        let isValid = false;

        while (!isValid) {
          dbUrl = await askQuestion(
            rl,
            'DATABASE_URL (例如: postgresql://user:password@localhost:5432/dbname)',
            ''
          );

          if (dbUrl && dbUrl.includes('postgresql://')) {
            isValid = true;
            newEnv.DATABASE_URL = dbUrl;
          } else if (!dbUrl) {
            console.log('⚠️  跳过 DATABASE_URL 配置，稍后请手动添加');
            isValid = true;
          } else {
            console.log('❌ DATABASE_URL 格式不正确，应以 postgresql:// 开头');
          }
        }
      }
    }

    rl.close();

    // 写入文件
    console.log('');
    console.log('正在保存配置...');
    writeEnvFile(newEnv, existingEnv);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 配置完成！');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('配置文件已保存到: ' + ENV_FILE);
    console.log('');
    console.log('下一步:');
    console.log('  1. 检查 .env 文件确认配置正确');
    console.log('  2. 运行: npx prisma generate');
    console.log('  3. 运行抽样测试: npm run sync:profile-to-school -- --sample 20 --dry-run');
    console.log('');

  } catch (error: any) {
    rl.close();
    console.error('❌ 配置过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as setupEnv };

