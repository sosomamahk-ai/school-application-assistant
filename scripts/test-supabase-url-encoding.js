#!/usr/bin/env node

/**
 * 测试不同的 Supabase 连接字符串格式
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 测试不同的 Supabase 连接字符串格式\n');
console.log('='.repeat(60));

const password = process.env.SUPABASE_PASSWORD || 'u0G8pwgRgnXUlx9t';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// 测试不同的连接字符串格式
const testConfigs = [
  {
    name: '格式 1: postgres.[PROJECT-REF] (Supabase 提供的格式)',
    url: `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 2: 标准 postgres (不带项目引用)',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 3: URL 编码用户名',
    url: `postgresql://postgres%2E${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 4: 使用 db 主机地址',
    url: `postgresql://postgres.${projectRef}:${password}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: '格式 5: 标准 postgres + db 主机',
    url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`
  }
];

async function testConnection(name, url) {
  console.log(`\n📋 测试: ${name}`);
  console.log(`   连接字符串: ${url.substring(0, 60)}...`);
  
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
    console.log(`   ✅ 查询成功！当前用户: ${result[0]?.current_user}`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`   ❌ 连接失败: ${error.message.substring(0, 80)}...`);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

async function runTests() {
  console.log(`\n使用密码: ${password.substring(0, 10)}...`);
  console.log(`项目引用: ${projectRef}\n`);
  
  let successCount = 0;
  
  for (const config of testConfigs) {
    const success = await testConnection(config.name, config.url);
    if (success) {
      successCount++;
      console.log(`\n🎉 找到可用的连接格式！`);
      console.log(`\n请在 .env 文件中使用以下配置：\n`);
      console.log(`DATABASE_URL="${config.url}"`);
      console.log(`DIRECT_URL="${config.url}"`);
      console.log(`\n然后运行: npm run test:supabase`);
      break;
    }
    
    // 等待一下再测试下一个
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (successCount === 0) {
    console.log(`\n❌ 所有格式都失败了。`);
    console.log(`\n建议：`);
    console.log(`1. 确认密码是否正确`);
    console.log(`2. 在 Supabase Dashboard 中重置数据库密码`);
    console.log(`3. 检查 Supabase 项目状态`);
    console.log(`4. 尝试使用 Supabase SQL Editor 验证连接`);
  }
}

runTests().catch(console.error);

