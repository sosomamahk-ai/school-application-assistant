#!/usr/bin/env ts-node

/**
 * 环境变量配置检查工具
 * 
 * 使用方法:
 *   npm run check:env
 *   或
 *   ts-node scripts/check-env.ts
 * 
 * 功能:
 * - 检查所有必需的环境变量是否存在
 * - 验证环境变量格式是否正确
 * - 测试数据库连接
 * - 生成详细的检查报告
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// 获取项目根目录
// npm 脚本通常在项目根目录运行，所以使用 process.cwd()
function getProjectRoot(): string {
  const cwd = process.cwd();
  
  // 检查是否是项目根目录（有 package.json）
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  }
  
  // 如果不是，尝试从脚本位置推断
  // 脚本在 scripts/ 目录下，项目根目录是上一级
  try {
    // 尝试从 process.argv[1] 获取脚本路径
    if (process.argv[1]) {
      const scriptPath = process.argv[1];
      const scriptDir = path.dirname(scriptPath);
      const root = path.dirname(scriptDir);
      if (fs.existsSync(path.join(root, 'package.json'))) {
        return root;
      }
    }
  } catch {
    // 忽略错误
  }
  
  // 默认返回当前工作目录
  return cwd;
}

const projectRoot = getProjectRoot();

// 尝试加载 dotenv，如果不存在则手动读取 .env 文件
let dotenv: any;
try {
  dotenv = require('dotenv');
  dotenv.config({ path: path.join(projectRoot, '.env') });
  dotenv.config({ path: path.join(projectRoot, '.env.local') });
} catch (e) {
  // dotenv 不存在，手动加载环境变量
  const envPath = path.join(projectRoot, '.env');
  const envLocalPath = path.join(projectRoot, '.env.local');
  
  const loadEnvFile = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=');
          if (key && values.length > 0) {
            const value = values.join('=').replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      });
    }
  };
  
  loadEnvFile(envPath);
  loadEnvFile(envLocalPath);
}

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text: string) {
  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');
}

function printSection(text: string) {
  console.log(colorize(`\n▶ ${text}`, 'blue'));
  console.log(colorize('─'.repeat(50), 'cyan'));
}

function printSuccess(message: string) {
  console.log(colorize('  ✅', 'green') + ' ' + message);
}

function printError(message: string) {
  console.log(colorize('  ❌', 'red') + ' ' + message);
}

function printWarning(message: string) {
  console.log(colorize('  ⚠️', 'yellow') + ' ' + message);
}

function printInfo(message: string) {
  console.log(colorize('  ℹ️', 'cyan') + ' ' + message);
}

interface CheckResult {
  name: string;
  exists: boolean;
  valid: boolean;
  message: string;
  value?: string;
}

class EnvChecker {
  private results: CheckResult[] = [];
  private prisma: PrismaClient | null = null;

  constructor() {
    // 只在有 DATABASE_URL 时初始化 Prisma
    if (process.env.DATABASE_URL) {
      this.prisma = new PrismaClient({
        log: ['error'],
      });
    }
  }

  async checkAll(): Promise<void> {
    printHeader('环境变量配置检查工具');

    // 检查各个环境变量
    this.checkDatabaseUrl();
    this.checkJwtSecret();
    this.checkAppUrl();
    this.checkOpenAIApiKey();

    // 测试数据库连接
    await this.testDatabaseConnection();

    // 生成报告
    this.generateReport();

    // 清理
    await this.cleanup();
  }

  private checkDatabaseUrl(): void {
    printSection('检查 DATABASE_URL');

    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      this.results.push({
        name: 'DATABASE_URL',
        exists: false,
        valid: false,
        message: '未设置 DATABASE_URL',
      });
      printError('DATABASE_URL 未设置');
      printInfo('需要设置 PostgreSQL 数据库连接字符串');
      printInfo('格式: postgresql://user:password@host:port/database');
      return;
    }

    const isValid = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
    const hasCredentials = dbUrl.includes('@');
    const hasDatabase = dbUrl.split('/').length > 1;

    if (!isValid) {
      this.results.push({
        name: 'DATABASE_URL',
        exists: true,
        valid: false,
        message: '格式不正确，应以 postgresql:// 或 postgres:// 开头',
        value: this.maskSensitive(dbUrl),
      });
      printError('格式不正确');
      printInfo(`当前值: ${this.maskSensitive(dbUrl)}`);
      return;
    }

    if (!hasCredentials || !hasDatabase) {
      this.results.push({
        name: 'DATABASE_URL',
        exists: true,
        valid: false,
        message: '格式不完整，缺少用户名、密码或数据库名',
        value: this.maskSensitive(dbUrl),
      });
      printWarning('格式可能不完整');
      printInfo(`当前值: ${this.maskSensitive(dbUrl)}`);
      return;
    }

    this.results.push({
      name: 'DATABASE_URL',
      exists: true,
      valid: true,
      message: '格式正确',
      value: this.maskSensitive(dbUrl),
    });
    printSuccess('DATABASE_URL 已设置且格式正确');
    printInfo(`连接字符串: ${this.maskSensitive(dbUrl)}`);
  }

  private checkJwtSecret(): void {
    printSection('检查 JWT_SECRET');

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      this.results.push({
        name: 'JWT_SECRET',
        exists: false,
        valid: false,
        message: '未设置 JWT_SECRET',
      });
      printError('JWT_SECRET 未设置');
      printInfo('需要生成一个至少 32 字符的随机字符串');
      printInfo('生成方法: openssl rand -base64 32');
      return;
    }

    const length = jwtSecret.length;
    const isLongEnough = length >= 32;

    if (!isLongEnough) {
      this.results.push({
        name: 'JWT_SECRET',
        exists: true,
        valid: false,
        message: `长度不足，当前 ${length} 字符，建议至少 32 字符`,
        value: this.maskSensitive(jwtSecret),
      });
      printWarning(`长度不足 (${length} 字符，建议 ≥32)`);
      printInfo('建议重新生成一个更长的密钥');
      return;
    }

    this.results.push({
      name: 'JWT_SECRET',
      exists: true,
      valid: true,
      message: `已设置，长度 ${length} 字符`,
      value: this.maskSensitive(jwtSecret),
    });
    printSuccess(`JWT_SECRET 已设置 (${length} 字符)`);
  }

  private checkAppUrl(): void {
    printSection('检查 NEXT_PUBLIC_APP_URL');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      this.results.push({
        name: 'NEXT_PUBLIC_APP_URL',
        exists: false,
        valid: false,
        message: '未设置 NEXT_PUBLIC_APP_URL',
      });
      printError('NEXT_PUBLIC_APP_URL 未设置');
      printInfo('本地开发: http://localhost:3000');
      printInfo('生产环境: https://your-domain.vercel.app');
      return;
    }

    const isHttps = appUrl.startsWith('https://');
    const isHttp = appUrl.startsWith('http://');
    const isValid = isHttps || isHttp;

    if (!isValid) {
      this.results.push({
        name: 'NEXT_PUBLIC_APP_URL',
        exists: true,
        valid: false,
        message: '格式不正确，应以 http:// 或 https:// 开头',
        value: appUrl,
      });
      printError('格式不正确');
      printInfo(`当前值: ${appUrl}`);
      return;
    }

    if (!isHttps && process.env.NODE_ENV === 'production') {
      this.results.push({
        name: 'NEXT_PUBLIC_APP_URL',
        exists: true,
        valid: false,
        message: '生产环境应使用 HTTPS',
        value: appUrl,
      });
      printWarning('生产环境建议使用 HTTPS');
      printInfo(`当前值: ${appUrl}`);
      return;
    }

    this.results.push({
      name: 'NEXT_PUBLIC_APP_URL',
      exists: true,
      valid: true,
      message: isHttps ? '已设置，使用 HTTPS' : '已设置，使用 HTTP',
      value: appUrl,
    });
    printSuccess(`NEXT_PUBLIC_APP_URL 已设置: ${appUrl}`);
  }

  private checkOpenAIApiKey(): void {
    printSection('检查 OPENAI_API_KEY (可选)');

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.results.push({
        name: 'OPENAI_API_KEY',
        exists: false,
        valid: false,
        message: '未设置 OPENAI_API_KEY (可选，但 AI 功能需要)',
      });
      printWarning('OPENAI_API_KEY 未设置');
      printInfo('AI 功能将不可用，但应用仍可运行');
      return;
    }

    const startsWithSk = apiKey.startsWith('sk-');
    const isLongEnough = apiKey.length >= 20;

    if (!startsWithSk) {
      this.results.push({
        name: 'OPENAI_API_KEY',
        exists: true,
        valid: false,
        message: '格式可能不正确，通常以 sk- 开头',
        value: this.maskSensitive(apiKey),
      });
      printWarning('格式可能不正确');
      printInfo('OpenAI API Key 通常以 sk- 开头');
      return;
    }

    if (!isLongEnough) {
      this.results.push({
        name: 'OPENAI_API_KEY',
        exists: true,
        valid: false,
        message: '长度可能不足',
        value: this.maskSensitive(apiKey),
      });
      printWarning('长度可能不足');
      return;
    }

    this.results.push({
      name: 'OPENAI_API_KEY',
      exists: true,
      valid: true,
      message: '已设置且格式正确',
      value: this.maskSensitive(apiKey),
    });
    printSuccess('OPENAI_API_KEY 已设置');
  }

  private async testDatabaseConnection(): Promise<void> {
    printSection('测试数据库连接');

    if (!process.env.DATABASE_URL) {
      printError('无法测试：DATABASE_URL 未设置');
      this.results.push({
        name: 'DATABASE_CONNECTION',
        exists: false,
        valid: false,
        message: '无法测试：DATABASE_URL 未设置',
      });
      return;
    }

    if (!this.prisma) {
      printError('无法初始化 Prisma 客户端');
      this.results.push({
        name: 'DATABASE_CONNECTION',
        exists: false,
        valid: false,
        message: '无法初始化 Prisma 客户端',
      });
      return;
    }

    try {
      printInfo('正在连接数据库...');
      await this.prisma.$connect();
      
      printInfo('执行测试查询...');
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      printSuccess('数据库连接成功！');
      this.results.push({
        name: 'DATABASE_CONNECTION',
        exists: true,
        valid: true,
        message: '数据库连接成功',
      });

      // 尝试检查表是否存在
      try {
        const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public'
        `;
        
        if (tables.length > 0) {
          printInfo(`发现 ${tables.length} 个数据表`);
        } else {
          printWarning('数据库中没有表，可能需要运行迁移');
          printInfo('运行: npx prisma migrate deploy');
        }
      } catch (e) {
        // 忽略表检查错误
      }

    } catch (error: any) {
      printError('数据库连接失败');
      printInfo(`错误信息: ${error?.message || 'Unknown error'}`);
      
      if (error?.code === 'P1001') {
        printInfo('可能原因: 无法连接到数据库服务器');
        printInfo('请检查:');
        printInfo('  - 数据库服务器是否运行');
        printInfo('  - DATABASE_URL 是否正确');
        printInfo('  - 网络连接是否正常');
        printInfo('  - 防火墙设置');
      } else if (error?.code?.startsWith('P')) {
        printInfo(`Prisma 错误代码: ${error.code}`);
        printInfo('请查看 Prisma 文档了解错误详情');
      }

      this.results.push({
        name: 'DATABASE_CONNECTION',
        exists: true,
        valid: false,
        message: `连接失败: ${error?.message || 'Unknown error'}`,
      });
    }
  }

  private generateReport(): void {
    printHeader('检查报告');

    const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL'];
    const requiredResults = this.results.filter(r => required.includes(r.name));
    const optionalResults = this.results.filter(r => !required.includes(r.name));

    // 必需变量
    console.log(colorize('\n必需环境变量:', 'bright'));
    requiredResults.forEach(result => {
      const status = result.exists && result.valid 
        ? colorize('✅', 'green') 
        : result.exists 
          ? colorize('⚠️', 'yellow') 
          : colorize('❌', 'red');
      console.log(`  ${status} ${result.name}: ${result.message}`);
    });

    // 可选变量
    if (optionalResults.length > 0) {
      console.log(colorize('\n可选环境变量:', 'bright'));
      optionalResults.forEach(result => {
        const status = result.exists && result.valid 
          ? colorize('✅', 'green') 
          : result.exists 
            ? colorize('⚠️', 'yellow') 
            : colorize('ℹ️', 'cyan');
        console.log(`  ${status} ${result.name}: ${result.message}`);
      });
    }

    // 总结
    const allRequiredValid = requiredResults.every(r => r.exists && r.valid);
    const dbConnected = this.results.find(r => r.name === 'DATABASE_CONNECTION')?.valid || false;

    console.log(colorize('\n总结:', 'bright'));
    if (allRequiredValid && dbConnected) {
      console.log(colorize('  ✅ 所有检查通过！应用已准备就绪。', 'green'));
    } else if (allRequiredValid) {
      console.log(colorize('  ⚠️  环境变量配置正确，但数据库连接失败', 'yellow'));
      console.log(colorize('     请检查数据库配置和网络连接', 'yellow'));
    } else {
      console.log(colorize('  ❌ 部分环境变量未正确配置', 'red'));
      console.log(colorize('     请根据上述提示修复配置', 'red'));
    }

    // 下一步建议
    console.log(colorize('\n下一步建议:', 'bright'));
    if (!allRequiredValid) {
      console.log('  1. 修复缺失或格式错误的环境变量');
      console.log('  2. 重新运行此检查工具验证');
    }
    if (!dbConnected && allRequiredValid) {
      console.log('  1. 检查数据库服务器是否运行');
      console.log('  2. 验证 DATABASE_URL 连接字符串');
      console.log('  3. 运行数据库迁移: npx prisma migrate deploy');
    }
    if (allRequiredValid && dbConnected) {
      console.log('  1. 运行开发服务器: npm run dev');
      console.log('  2. 访问应用并测试功能');
    }
  }

  private maskSensitive(value: string): string {
    if (value.length <= 20) {
      return '***';
    }
    return value.substring(0, 10) + '...' + value.substring(value.length - 5);
  }

  private async cleanup(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
      } catch (e) {
        // 忽略断开连接错误
      }
    }
  }
}

// 运行检查
async function main() {
  const checker = new EnvChecker();
  try {
    await checker.checkAll();
    process.exit(0);
  } catch (error) {
    console.error(colorize('\n检查过程中发生错误:', 'red'));
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
// 检查是否是直接执行（不是被导入）
const isDirectExecution = 
  (typeof require !== 'undefined' && require.main === module) ||
  process.argv[1]?.includes('check-env.ts') ||
  process.argv[1]?.endsWith('check-env');

if (isDirectExecution) {
  main();
}

export { EnvChecker };

