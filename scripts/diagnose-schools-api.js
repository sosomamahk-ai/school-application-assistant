/**
 * 诊断学校管理 API 问题
 * 自动检测常见的配置和连接问题
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnv() {
  log('\n📋 检查环境变量...', 'cyan');
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
      log(`  ❌ ${key} 未设置`, 'red');
    } else {
      const value = process.env[key];
      const display = key === 'JWT_SECRET' 
        ? `${value.substring(0, 10)}...` 
        : value.length > 50 
          ? `${value.substring(0, 50)}...` 
          : value;
      log(`  ✅ ${key} = ${display}`, 'green');
    }
  });
  
  if (missing.length > 0) {
    log(`\n⚠️  缺少环境变量: ${missing.join(', ')}`, 'yellow');
    return false;
  }
  return true;
}

async function checkDatabase() {
  log('\n🗄️  检查数据库连接...', 'cyan');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
    
    // 尝试连接
    await prisma.$connect();
    log('  ✅ 数据库连接成功', 'green');
    
    // 检查 School 表
    try {
      const count = await prisma.school.count();
      log(`  ✅ School 表可访问，共有 ${count} 条记录`, 'green');
    } catch (err) {
      log(`  ❌ 无法访问 School 表: ${err.message}`, 'red');
      await prisma.$disconnect();
      return false;
    }
    
    // 检查 SchoolFormTemplate 表
    try {
      const templateCount = await prisma.schoolFormTemplate.count();
      log(`  ✅ SchoolFormTemplate 表可访问，共有 ${templateCount} 条记录`, 'green');
    } catch (err) {
      log(`  ⚠️  无法访问 SchoolFormTemplate 表: ${err.message}`, 'yellow');
    }
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    log(`  ❌ 数据库连接失败: ${error.message}`, 'red');
    if (error.message.includes('P1001')) {
      log('  💡 提示: 数据库服务器无法连接，请检查 DATABASE_URL 和网络连接', 'yellow');
    } else if (error.message.includes('P1000')) {
      log('  💡 提示: 数据库认证失败，请检查用户名和密码', 'yellow');
    } else if (error.message.includes('P1003')) {
      log('  💡 提示: 数据库不存在，请检查数据库名称', 'yellow');
    }
    return false;
  }
}

async function checkApiEndpoint(baseUrl = 'http://localhost:3000') {
  log(`\n🌐 检查 API 端点 (${baseUrl})...`, 'cyan');
  
  return new Promise((resolve) => {
    const url = new URL('/api/admin/schools', baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
      timeout: 5000,
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 401) {
          log('  ✅ API 端点可访问（返回 401 是预期的，因为需要有效的 token）', 'green');
          resolve(true);
        } else if (res.statusCode === 500) {
          log(`  ❌ API 返回 500 错误`, 'red');
          try {
            const errorData = JSON.parse(data);
            log(`     错误信息: ${errorData.error || errorData.message || '未知错误'}`, 'red');
          } catch {
            log(`     响应内容: ${data.substring(0, 200)}`, 'red');
          }
          resolve(false);
        } else {
          log(`  ⚠️  API 返回状态码: ${res.statusCode}`, 'yellow');
          resolve(res.statusCode < 500);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`  ❌ 无法连接到 API: ${error.message}`, 'red');
      log('  💡 提示: 请确保开发服务器正在运行 (npm run dev)', 'yellow');
      resolve(false);
    });
    
    req.on('timeout', () => {
      log('  ❌ 连接超时', 'red');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function checkPrismaSchema() {
  log('\n📐 检查 Prisma Schema...', 'cyan');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaPath)) {
      log('  ❌ 找不到 schema.prisma 文件', 'red');
      return false;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // 检查 School 模型
    if (schema.includes('model School')) {
      log('  ✅ 找到 School 模型', 'green');
    } else {
      log('  ❌ 找不到 School 模型', 'red');
      return false;
    }
    
    // 检查 SchoolFormTemplate 模型
    if (schema.includes('model SchoolFormTemplate')) {
      log('  ✅ 找到 SchoolFormTemplate 模型', 'green');
    } else {
      log('  ⚠️  找不到 SchoolFormTemplate 模型', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`  ❌ 检查 Schema 时出错: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🔍 学校管理 API 诊断工具', 'blue');
  log('='.repeat(50), 'blue');
  
  // 加载环境变量
  try {
    require('dotenv').config();
    // 也尝试加载 .env.local
    require('dotenv').config({ path: '.env.local' });
  } catch (error) {
    // dotenv 可能未安装，尝试手动加载
    console.warn('dotenv 未安装，尝试手动加载环境变量...');
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
              const key = match[1].trim();
              let value = match[2].trim();
              // 移除引号
              if ((value.startsWith('"') && value.endsWith('"')) || 
                  (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
              }
              process.env[key] = value;
            }
          }
        });
      }
    } catch (e) {
      // 忽略错误
    }
  }
  
  const results = {
    env: checkEnv(),
    schema: await checkPrismaSchema(),
    database: false,
    api: false,
  };
  
  if (results.env && results.schema) {
    results.database = await checkDatabase();
    
    // 检查本地 API（如果可能）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      results.api = await checkApiEndpoint(baseUrl);
    } else {
      log('\n🌐 跳过 API 端点检查（非本地环境）', 'yellow');
      log(`   生产环境 URL: ${baseUrl}`, 'cyan');
      log('   请在浏览器中手动测试 API 端点', 'cyan');
    }
  }
  
  // 总结
  log('\n' + '='.repeat(50), 'blue');
  log('📊 诊断结果总结', 'blue');
  log('='.repeat(50), 'blue');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('\n✅ 所有检查通过！', 'green');
    log('如果仍然遇到问题，请检查：', 'cyan');
    log('  1. 浏览器控制台的详细错误信息', 'cyan');
    log('  2. Vercel 部署日志', 'cyan');
    log('  3. 数据库连接池是否已满', 'cyan');
  } else {
    log('\n❌ 发现问题，请根据上述提示修复', 'red');
    log('\n💡 常见解决方案：', 'yellow');
    log('  1. 确保所有环境变量已正确设置', 'yellow');
    log('  2. 运行数据库迁移: npx prisma migrate deploy', 'yellow');
    log('  3. 重新生成 Prisma Client: npx prisma generate', 'yellow');
    log('  4. 检查数据库连接字符串格式', 'yellow');
    log('  5. 确保数据库服务器可访问', 'yellow');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ 诊断过程中出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

