#!/usr/bin/env node

/**
 * 数据库连接测试脚本
 * 用于诊断 "FATAL: Tenant or user not found" 错误
 */

// 尝试加载 dotenv（如果存在）
try {
  require('dotenv').config();
} catch (e) {
  // dotenv 不存在，使用环境变量（Next.js 会自动加载 .env 文件）
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 数据库连接诊断工具\n');
console.log('='.repeat(50));

// 1. 检查环境变量
console.log('\n1️⃣ 检查环境变量...');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL 未设置！');
  console.log('\n请检查以下内容：');
  console.log('  - 是否存在 .env 文件？');
  console.log('  - .env 文件中是否有 DATABASE_URL？');
  console.log('  - 环境变量是否正确加载？');
  process.exit(1);
}

console.log('✅ DATABASE_URL 已设置');
console.log(`   格式: ${databaseUrl.substring(0, 30)}...`);

// 解析连接字符串（不显示密码）
try {
  const url = new URL(databaseUrl);
  console.log('\n📋 连接字符串解析：');
  console.log(`   协议: ${url.protocol}`);
  console.log(`   主机: ${url.hostname}`);
  console.log(`   端口: ${url.port || '5432 (默认)'}`);
  console.log(`   数据库: ${url.pathname.slice(1)}`);
  console.log(`   用户名: ${url.username || '未设置'}`);
  console.log(`   密码: ${url.password ? '***已设置***' : '❌ 未设置'}`);
  
  if (url.searchParams.has('pgbouncer')) {
    console.log(`   ⚠️  检测到 pgbouncer=true (连接池模式)`);
    console.log(`   💡 提示: 如果使用 Supabase，迁移需要使用 DIRECT_URL`);
  }
} catch (error) {
  console.error('❌ 连接字符串格式错误:', error.message);
  process.exit(1);
}

// 2. 测试数据库连接
console.log('\n2️⃣ 测试数据库连接...');
const prisma = new PrismaClient({
  log: ['error'],
});

async function testConnection() {
  try {
    // 尝试执行简单查询
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    const userCount = await prisma.user.count();
    console.log(`✅ 查询测试成功！当前用户数: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败！');
    console.error('\n错误详情:');
    console.error(`   错误类型: ${error.constructor.name}`);
    console.error(`   错误消息: ${error.message}`);
    
    // 提供针对性的解决方案
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n🔧 解决方案:');
      console.error('   这个错误通常表示：');
      console.error('   1. 数据库用户名或密码不正确');
      console.error('   2. 数据库服务器无法找到指定的用户');
      console.error('   3. 如果是 Supabase，可能需要使用 DIRECT_URL');
      console.error('\n   请检查：');
      console.error('   - DATABASE_URL 中的用户名和密码是否正确');
      console.error('   - 如果使用 Supabase，确保使用正确的连接字符串');
      console.error('   - 检查数据库服务是否正常运行');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n🔧 解决方案:');
      console.error('   密码认证失败，请检查：');
      console.error('   - DATABASE_URL 中的密码是否正确');
      console.error('   - 密码中是否包含特殊字符（需要 URL 编码）');
    } else if (error.message.includes('does not exist')) {
      console.error('\n🔧 解决方案:');
      console.error('   数据库不存在，请检查：');
      console.error('   - DATABASE_URL 中的数据库名称是否正确');
      console.error('   - 数据库是否已创建');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 解决方案:');
      console.error('   无法连接到数据库服务器，请检查：');
      console.error('   - 数据库服务器是否正在运行');
      console.error('   - 主机地址和端口是否正确');
      console.error('   - 防火墙是否阻止了连接');
      console.error('   - 网络连接是否正常');
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ 所有测试通过！数据库连接正常。');
      process.exit(0);
    } else {
      console.log('\n❌ 数据库连接测试失败，请根据上述建议进行修复。');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  });

