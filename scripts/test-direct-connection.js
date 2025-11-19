#!/usr/bin/env node

/**
 * 测试 Supabase Direct Connection 的正确格式
 * 根据 Dashboard 显示：host 是 db.zlydqxbbrmqhpzjheatx.supabase.co，user 是 postgres
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 测试 Supabase Direct Connection（正确格式）\n');
console.log('='.repeat(60));

const password = process.env.SUPABASE_PASSWORD || 'u0G8pwgRgnXUlx9t';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// 根据 Supabase Dashboard 显示的 Direct connection 格式
const directConnectionUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('\n📋 Direct Connection 配置：');
console.log(`   主机: db.${projectRef}.supabase.co`);
console.log(`   端口: 5432`);
console.log(`   数据库: postgres`);
console.log(`   用户: postgres`);
console.log(`   密码: ${password.substring(0, 10)}...`);
console.log(`\n   连接字符串: ${directConnectionUrl.substring(0, 60)}...`);

// 测试连接
console.log('\n2️⃣ 测试数据库连接...');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directConnectionUrl
    }
  },
  log: ['error', 'warn']
});

async function testConnection() {
  try {
    console.log('   正在连接...');
    await prisma.$connect();
    console.log('   ✅ 数据库连接成功！');
    
    // 测试查询
    console.log('   测试查询...');
    const result = await prisma.$queryRaw`SELECT current_user, current_database(), version()`;
    console.log('   ✅ 查询成功！');
    console.log(`   当前用户: ${result[0]?.current_user}`);
    console.log(`   当前数据库: ${result[0]?.current_database}`);
    console.log(`   数据库版本: ${result[0]?.version?.substring(0, 50)}...`);
    
    // 检查表
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      LIMIT 10
    `;
    console.log(`   ✅ 找到 ${tables.length} 个表`);
    
    await prisma.$disconnect();
    
    console.log('\n🎉 Direct Connection 测试成功！');
    console.log('\n请在 .env 文件中使用以下配置：\n');
    console.log(`DATABASE_URL="${directConnectionUrl}"`);
    console.log(`DIRECT_URL="${directConnectionUrl}"`);
    console.log('\n⚠️  注意：如果连接失败并显示 IPv4 错误，请使用 Session Pooler（见下方）');
    
    return true;
  } catch (error) {
    console.error('   ❌ 数据库连接失败！');
    console.error(`\n   错误类型: ${error.constructor.name}`);
    console.error(`   错误消息: ${error.message}`);
    
    // 检查是否是 IPv4 错误
    if (error.message.includes('IPv4') || error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n⚠️  检测到可能的 IPv4 兼容性问题！');
      console.error('\n   解决方案：使用 Session Pooler（连接池）\n');
      console.error('   请在 .env 文件中使用以下配置：\n');
      console.error(`   # 应用连接（使用连接池，IPv4 兼容）`);
      console.error(`   DATABASE_URL="postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"`);
      console.error(`   `);
      console.error(`   # 迁移连接（直接连接，如果 IPv6 可用）`);
      console.error(`   DIRECT_URL="postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres"`);
      console.error(`\n   或者如果 DIRECT_URL 也失败，两个都使用连接池：`);
      console.error(`   DIRECT_URL="postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"`);
    }
    
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ 所有测试通过！');
      process.exit(0);
    } else {
      console.log('\n❌ 连接测试失败。');
      console.log('\n💡 建议：');
      console.log('   1. 如果显示 IPv4 错误，使用 Session Pooler');
      console.log('   2. 检查网络连接');
      console.log('   3. 确认 Supabase 项目未暂停');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  });

