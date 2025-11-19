#!/usr/bin/env node

/**
 * 使用新密码测试 Supabase 连接
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 使用新密码测试 Supabase 连接\n');
console.log('='.repeat(60));

const newPassword = '3nhsp1zaqLnMSdmA';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// Session Pooler 配置（IPv4 兼容）
const databaseUrl = `postgresql://postgres.${projectRef}:${newPassword}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
const directUrl = `postgresql://postgres.${projectRef}:${newPassword}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`;

console.log('\n📋 使用新密码配置：');
console.log(`   密码: ${newPassword}`);
console.log(`   项目引用: ${projectRef}`);
console.log(`\n   DATABASE_URL: ${databaseUrl.substring(0, 70)}...`);
console.log(`   DIRECT_URL: ${directUrl.substring(0, 70)}...`);

// 测试 DATABASE_URL
console.log('\n1️⃣ 测试 DATABASE_URL（连接池，端口 6543）...');
const prisma1 = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: ['error', 'warn']
});

async function testDatabaseUrl() {
  try {
    console.log('   正在连接...');
    await prisma1.$connect();
    console.log('   ✅ DATABASE_URL 连接成功！');
    
    const result = await prisma1.$queryRaw`SELECT current_user, current_database(), version()`;
    console.log('   ✅ 查询成功！');
    console.log(`   当前用户: ${result[0]?.current_user}`);
    console.log(`   当前数据库: ${result[0]?.current_database}`);
    console.log(`   数据库版本: ${result[0]?.version?.substring(0, 50)}...`);
    
    // 检查表
    const tables = await prisma1.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 10
    `;
    console.log(`   ✅ 找到 ${tables.length} 个表`);
    
    await prisma1.$disconnect();
    return { success: true, url: databaseUrl };
  } catch (error) {
    console.error(`   ❌ 连接失败: ${error.message.substring(0, 120)}...`);
    await prisma1.$disconnect().catch(() => {});
    return { success: false, error: error.message };
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
  log: ['error', 'warn']
});

async function testDirectUrl() {
  try {
    console.log('   正在连接...');
    await prisma2.$connect();
    console.log('   ✅ DIRECT_URL 连接成功！');
    
    const result = await prisma2.$queryRaw`SELECT current_user, current_database()`;
    console.log(`   ✅ 查询成功！用户: ${result[0]?.current_user}, 数据库: ${result[0]?.current_database}`);
    
    await prisma2.$disconnect();
    return { success: true, url: directUrl };
  } catch (error) {
    console.error(`   ❌ 连接失败: ${error.message.substring(0, 120)}...`);
    await prisma2.$disconnect().catch(() => {});
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const dbUrlResult = await testDatabaseUrl();
  await new Promise(resolve => setTimeout(resolve, 1500));
  const directUrlResult = await testDirectUrl();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结\n');
  
  if (dbUrlResult.success && directUrlResult.success) {
    console.log('🎉 所有连接测试成功！\n');
    console.log('✅ 请在 .env 文件中使用以下配置：\n');
    console.log(`DATABASE_URL="${dbUrlResult.url}"`);
    console.log(`DIRECT_URL="${directUrlResult.url}"`);
    console.log('\n然后运行: npm run dev');
    process.exit(0);
  } else if (dbUrlResult.success) {
    console.log('⚠️  DATABASE_URL 成功，但 DIRECT_URL 失败\n');
    console.log('✅ 可以使用以下配置（两个都使用 DATABASE_URL）：\n');
    console.log(`DATABASE_URL="${dbUrlResult.url}"`);
    console.log(`DIRECT_URL="${dbUrlResult.url}"`);
    console.log('\n然后运行: npm run dev');
    process.exit(0);
  } else if (directUrlResult.success) {
    console.log('⚠️  DIRECT_URL 成功，但 DATABASE_URL 失败\n');
    console.log('✅ 可以使用以下配置：\n');
    console.log(`DATABASE_URL="${directUrlResult.url}"`);
    console.log(`DIRECT_URL="${directUrlResult.url}"`);
    console.log('\n然后运行: npm run dev');
    process.exit(0);
  } else {
    console.log('❌ 所有连接测试都失败了。\n');
    console.log('错误详情：');
    if (dbUrlResult.error) {
      console.log(`   DATABASE_URL: ${dbUrlResult.error.substring(0, 100)}...`);
    }
    if (directUrlResult.error) {
      console.log(`   DIRECT_URL: ${directUrlResult.error.substring(0, 100)}...`);
    }
    console.log('\n建议：');
    console.log('1. 确认密码是否正确（在 Supabase Dashboard 中验证）');
    console.log('2. 检查 Supabase 项目状态');
    console.log('3. 查看 Supabase 数据库日志');
    process.exit(1);
  }
}

runTests().catch(console.error);

