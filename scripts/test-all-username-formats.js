#!/usr/bin/env node

/**
 * 测试所有可能的用户名格式
 * 因为 SQL Editor 显示用户是 postgres，但 pooler 可能需要不同的格式
 */

// 尝试加载 dotenv
try {
  require('dotenv').config();
} catch (e) {
  console.log('ℹ️  dotenv 未安装，使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');

console.log('🔍 测试所有可能的用户名格式\n');
console.log('='.repeat(60));

const password = '3nhsp1zaqLnMSdmA';
const projectRef = 'zlydqxbbrmqhpzjheatx';

// 测试不同的用户名格式
const testConfigs = [
  {
    name: '格式 1: postgres.[PROJECT-REF] + pooler 6543',
    url: `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
  },
  {
    name: '格式 2: postgres.[PROJECT-REF] + pooler 5432',
    url: `postgresql://postgres.${projectRef}:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 3: 标准 postgres + pooler 6543',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
  },
  {
    name: '格式 4: 标准 postgres + pooler 5432',
    url: `postgresql://postgres:${password}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: '格式 5: postgres.[PROJECT-REF] + db 主机',
    url: `postgresql://postgres.${projectRef}:${password}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: '格式 6: 标准 postgres + db 主机',
    url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`
  }
];

async function testConnection(name, url) {
  console.log(`\n📋 测试: ${name}`);
  console.log(`   连接字符串: ${url.substring(0, 75)}...`);
  
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
    
    const result = await prisma.$queryRaw`SELECT current_user, current_database()`;
    console.log(`   ✅ 查询成功！用户: ${result[0]?.current_user}, 数据库: ${result[0]?.current_database}`);
    
    await prisma.$disconnect();
    return { success: true, url, name };
  } catch (error) {
    const errorMsg = error.message.substring(0, 100);
    console.log(`   ❌ 连接失败: ${errorMsg}...`);
    await prisma.$disconnect().catch(() => {});
    return { success: false, error: errorMsg };
  }
}

async function runTests() {
  console.log(`\n使用密码: ${password}`);
  console.log(`项目引用: ${projectRef}`);
  console.log(`\n注意：SQL Editor 显示用户是 postgres，测试不同的用户名格式...\n`);
  
  let successConfig = null;
  
  for (const config of testConfigs) {
    const result = await testConnection(config.name, config.url);
    if (result.success) {
      successConfig = result;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (successConfig) {
    console.log('\n🎉 找到可用的连接格式！\n');
    console.log(`✅ 成功的配置: ${successConfig.name}\n`);
    console.log('请在 .env 文件中使用以下配置：\n');
    console.log(`DATABASE_URL="${successConfig.url}"`);
    console.log(`DIRECT_URL="${successConfig.url}"`);
    console.log('\n然后运行: npm run dev');
    process.exit(0);
  } else {
    console.log('\n❌ 所有格式都失败了。\n');
    console.log('这可能意味着：');
    console.log('1. Supabase pooler 的认证方式与直接连接不同');
    console.log('2. 可能需要特殊的配置或权限');
    console.log('3. Supabase 项目可能有 IP 限制或其他安全设置\n');
    console.log('建议：');
    console.log('1. 在 Supabase Dashboard 中检查 Connection pooling 设置');
    console.log('2. 查看是否有 IP 限制或防火墙规则');
    console.log('3. 检查 Supabase 项目状态和日志');
    console.log('4. 考虑使用其他数据库服务（如 Railway PostgreSQL）');
    process.exit(1);
  }
}

runTests().catch(console.error);

