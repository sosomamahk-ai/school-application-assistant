#!/usr/bin/env node

/**
 * 测试 Supabase Session Pooler 配置（IPv4 兼容）
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 测试 Supabase Session Pooler（IPv4 兼容）\n');
console.log('='.repeat(60));

const password = process.env.SUPABASE_PASSWORD || 'u0G8pwgRgnXUlx9t';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// Session Pooler 配置（IPv4 兼容）
const databaseUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
const directUrl = `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;

console.log('\n📋 Session Pooler 配置：');
console.log(`   DATABASE_URL: ${databaseUrl.substring(0, 70)}...`);
console.log(`   DIRECT_URL: ${directUrl.substring(0, 70)}...`);

// 测试 DATABASE_URL
console.log('\n1️⃣ 测试 DATABASE_URL（连接池，端口 6543）...');
const prisma1 = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: ['error']
});

async function testDatabaseUrl() {
  try {
    await prisma1.$connect();
    console.log('   ✅ DATABASE_URL 连接成功！');
    
    const result = await prisma1.$queryRaw`SELECT current_user, current_database()`;
    console.log(`   ✅ 查询成功！用户: ${result[0]?.current_user}, 数据库: ${result[0]?.current_database}`);
    
    await prisma1.$disconnect();
    return true;
  } catch (error) {
    console.error(`   ❌ 连接失败: ${error.message.substring(0, 100)}...`);
    await prisma1.$disconnect().catch(() => {});
    return false;
  }
}

// 测试 DIRECT_URL
console.log('\n2️⃣ 测试 DIRECT_URL（直接模式，端口 5432）...');
const prisma2 = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  },
  log: ['error']
});

async function testDirectUrl() {
  try {
    await prisma2.$connect();
    console.log('   ✅ DIRECT_URL 连接成功！');
    
    const result = await prisma2.$queryRaw`SELECT current_user, current_database()`;
    console.log(`   ✅ 查询成功！用户: ${result[0]?.current_user}, 数据库: ${result[0]?.current_database}`);
    
    await prisma2.$disconnect();
    return true;
  } catch (error) {
    console.error(`   ❌ 连接失败: ${error.message.substring(0, 100)}...`);
    await prisma2.$disconnect().catch(() => {});
    return false;
  }
}

async function runTests() {
  const dbUrlSuccess = await testDatabaseUrl();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const directUrlSuccess = await testDirectUrl();
  
  if (dbUrlSuccess && directUrlSuccess) {
    console.log('\n🎉 所有连接测试成功！');
    console.log('\n请在 .env 文件中使用以下配置：\n');
    console.log(`DATABASE_URL="${databaseUrl}"`);
    console.log(`DIRECT_URL="${directUrl}"`);
    console.log('\n然后运行: npm run dev');
    process.exit(0);
  } else if (dbUrlSuccess) {
    console.log('\n⚠️  DATABASE_URL 成功，但 DIRECT_URL 失败');
    console.log('\n可以使用以下配置（只使用 DATABASE_URL）：\n');
    console.log(`DATABASE_URL="${databaseUrl}"`);
    console.log(`DIRECT_URL="${databaseUrl}"`);
    process.exit(0);
  } else {
    console.log('\n❌ 连接测试失败。');
    console.log('\n建议：');
    console.log('1. 检查密码是否正确');
    console.log('2. 在 Supabase Dashboard 中重置数据库密码');
    console.log('3. 检查 Supabase 项目状态');
    process.exit(1);
  }
}

runTests().catch(console.error);

