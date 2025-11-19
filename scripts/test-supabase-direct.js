#!/usr/bin/env node

/**
 * Supabase Direct Connection 测试脚本
 * 用于诊断直接连接问题
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Supabase Direct Connection 诊断工具\n');
console.log('='.repeat(60));

// 检查环境变量
console.log('\n1️⃣ 检查环境变量...');
const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (!databaseUrl && !directUrl) {
  console.error('❌ DATABASE_URL 和 DIRECT_URL 都未设置！');
  process.exit(1);
}

const testUrl = directUrl || databaseUrl;
console.log(`✅ 使用连接字符串: ${testUrl.substring(0, 50)}...`);

// 解析连接字符串
try {
  const url = new URL(testUrl);
  console.log('\n📋 连接字符串解析：');
  console.log(`   协议: ${url.protocol}`);
  console.log(`   主机: ${url.hostname}`);
  console.log(`   端口: ${url.port || '5432 (默认)'}`);
  console.log(`   数据库: ${url.pathname.slice(1)}`);
  console.log(`   用户名: ${url.username || '未设置'}`);
  console.log(`   密码: ${url.password ? '***已设置***' : '❌ 未设置'}`);
  
  // 检查是否是 Supabase
  if (url.hostname.includes('supabase')) {
    console.log('\n🔍 Supabase 连接检测：');
    console.log(`   项目引用: ${url.username.includes('.') ? url.username.split('.')[1] : '未检测到'}`);
    console.log(`   连接类型: ${url.port === '5432' ? 'Direct Connection (直接连接)' : url.port === '6543' ? 'Connection Pool (连接池)' : '未知'}`);
    
    if (url.port === '6543') {
      console.log('   ⚠️  警告: 端口 6543 是连接池端口，direct connection 应该使用 5432');
    }
  }
} catch (error) {
  console.error('❌ 连接字符串格式错误:', error.message);
  process.exit(1);
}

// 测试连接
console.log('\n2️⃣ 测试数据库连接...');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('   正在连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    console.log('   测试查询...');
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ 查询测试成功！');
    console.log(`   数据库版本: ${result[0]?.version?.substring(0, 50)}...`);
    
    // 检查表是否存在
    console.log('   检查数据库表...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`✅ 找到 ${tables.length} 个表`);
    if (tables.length > 0) {
      console.log('   表列表:');
      tables.slice(0, 10).forEach((table, i) => {
        console.log(`     ${i + 1}. ${table.table_name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败！');
    console.error('\n错误详情:');
    console.error(`   错误类型: ${error.constructor.name}`);
    console.error(`   错误代码: ${error.code || 'N/A'}`);
    console.error(`   错误消息: ${error.message}`);
    
    // 详细错误分析
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n🔧 错误分析: "Tenant or user not found"');
      console.error('   可能的原因:');
      console.error('   1. Supabase 项目引用格式不正确');
      console.error('   2. 用户名格式错误（应该使用 postgres 或 postgres.[PROJECT-REF]）');
      console.error('   3. Supabase 项目可能已暂停或删除');
      console.error('   4. 区域或主机地址不正确');
      console.error('\n   建议:');
      console.error('   - 检查 Supabase Dashboard 中的项目状态');
      console.error('   - 确认项目引用（project reference）是否正确');
      console.error('   - 尝试使用不同的连接字符串格式');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n🔧 错误分析: "password authentication failed"');
      console.error('   密码认证失败，请检查:');
      console.error('   - 密码是否正确');
      console.error('   - 密码中是否包含需要 URL 编码的特殊字符');
    } else if (error.message.includes('does not exist')) {
      console.error('\n🔧 错误分析: "does not exist"');
      console.error('   数据库或表不存在');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 错误分析: 连接超时或拒绝');
      console.error('   无法连接到数据库服务器');
      console.error('   - 检查网络连接');
      console.error('   - 检查防火墙设置');
      console.error('   - 确认 Supabase 项目未暂停');
    }
    
    // 提供 Supabase 特定的建议
    if (testUrl.includes('supabase')) {
      console.error('\n📋 Supabase 特定建议:');
      console.error('   1. 登录 Supabase Dashboard: https://app.supabase.com');
      console.error('   2. 检查项目状态（确保未暂停）');
      console.error('   3. Settings → Database → Connection string');
      console.error('   4. 选择 "Session mode"（不是 Transaction mode）');
      console.error('   5. 复制完整的连接字符串');
      console.error('   6. 确保使用正确的格式:');
      console.error('      - Direct: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres');
      console.error('      - 或: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres');
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
      console.log('\n💡 提示: 如果应用仍然无法连接，请确保:');
      console.log('   - 重启开发服务器 (npm run dev)');
      console.log('   - 检查 .env 文件中的 DATABASE_URL 配置');
      process.exit(0);
    } else {
      console.log('\n❌ 数据库连接测试失败。');
      console.log('\n📚 更多帮助:');
      console.log('   - 查看 TROUBLESHOOT_SUPABASE.md');
      console.log('   - 查看 DATABASE_CONNECTION_FIX.md');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 测试过程中发生错误:', error);
    process.exit(1);
  });

