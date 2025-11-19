#!/usr/bin/env node

/**
 * 测试使用标准 postgres 用户名的连接
 * 因为 SQL Editor 显示当前用户是 postgres
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 测试标准 postgres 用户名连接\n');
console.log('='.repeat(60));

const password = process.env.SUPABASE_PASSWORD || 'u0G8pwgRgnXUlx9t';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// 根据 SQL Editor 显示用户是 postgres，尝试不同的连接方式
const testConfigs = [
  {
    name: '格式 1: 标准 postgres + pooler 主机（端口 5432）',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 2: 标准 postgres + pooler 主机（端口 6543，连接池）',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
  },
  {
    name: '格式 3: 标准 postgres + pooler 主机（端口 6543，无参数）',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`
  },
  {
    name: '格式 4: 使用项目引用格式但确保密码正确',
    url: `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  }
];

async function testConnection(name, url) {
  console.log(`\n📋 测试: ${name}`);
  console.log(`   连接字符串: ${url.substring(0, 70)}...`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    },
    log: ['error']
  });

  try {
    await prisma.$connect();
    console.log('   ✅ 连接成功！');
    
    // 测试查询
    const result = await prisma.$queryRaw`SELECT current_user, current_database()`;
    console.log(`   ✅ 查询成功！`);
    console.log(`   当前用户: ${result[0]?.current_user}`);
    console.log(`   当前数据库: ${result[0]?.current_database}`);
    
    // 测试表查询
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `;
    console.log(`   ✅ 表查询成功！找到 ${tables.length} 个表`);
    
    await prisma.$disconnect();
    return { success: true, url };
  } catch (error) {
    const errorMsg = error.message.substring(0, 100);
    console.log(`   ❌ 连接失败: ${errorMsg}...`);
    await prisma.$disconnect().catch(() => {});
    return { success: false, error: errorMsg };
  }
}

async function runTests() {
  console.log(`\n根据 SQL Editor 测试结果：`);
  console.log(`- 当前用户: postgres`);
  console.log(`- 当前数据库: postgres`);
  console.log(`- 密码: ${password.substring(0, 10)}...`);
  console.log(`\n尝试使用标准 postgres 用户名连接...\n`);
  
  let successConfig = null;
  
  for (const config of testConfigs) {
    const result = await testConnection(config.name, config.url);
    if (result.success) {
      successConfig = config;
      console.log(`\n🎉 找到可用的连接格式！`);
      break;
    }
    
    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  if (successConfig) {
    console.log(`\n✅ 成功的配置：`);
    console.log(`\n请在 .env 文件中使用以下配置：\n`);
    console.log(`DATABASE_URL="${successConfig.url}"`);
    console.log(`DIRECT_URL="${successConfig.url}"`);
    console.log(`\n然后运行: npm run test:supabase`);
    console.log(`\n然后启动开发服务器: npm run dev`);
  } else {
    console.log(`\n❌ 所有格式都失败了。`);
    console.log(`\n建议：`);
    console.log(`1. 在 Supabase Dashboard 中检查是否有其他连接选项`);
    console.log(`2. 查看 Settings → Database → Connection string 中的所有选项`);
    console.log(`3. 尝试每个选项的连接字符串`);
    console.log(`4. 检查 Supabase 项目是否有 IP 限制或防火墙规则`);
  }
}

runTests().catch(console.error);

