#!/usr/bin/env node

/**
 * 启动开发服务器的辅助脚本
 * 在启动前检查并修复常见问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 检查开发环境...\n');

// 1. 检查 .env 文件
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.warn('⚠️  警告: .env 文件不存在');
} else {
  console.log('✓ .env 文件存在');
}

// 2. 检查 Prisma Client
const prismaClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
if (!fs.existsSync(prismaClientPath)) {
  console.log('⚠️  Prisma Client 未生成，正在生成...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✓ Prisma Client 生成成功\n');
  } catch (error) {
    console.error('✗ Prisma Client 生成失败');
    process.exit(1);
  }
} else {
  console.log('✓ Prisma Client 已生成');
}

// 3. 检查端口占用
console.log('\n🔍 检查端口占用...');
try {
  const port3000 = execSync('netstat -ano | findstr :3000', { encoding: 'utf-8', stdio: 'pipe' });
  if (port3000.trim()) {
    console.warn('⚠️  端口 3000 被占用');
    console.log('   提示: 可以使用 PORT=3001 npm run dev 使用其他端口');
  } else {
    console.log('✓ 端口 3000 可用');
  }
} catch (error) {
  console.log('✓ 端口 3000 可用');
}

// 4. 清理建议
console.log('\n💡 提示:');
console.log('   - 如果启动缓慢，可以清理 .next 目录: Remove-Item -Recurse -Force .next');
console.log('   - 如果遇到问题，检查 dev-server.log 文件\n');

console.log('🚀 启动开发服务器...\n');
console.log('='.repeat(50));

// 启动 dev 服务器
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ 开发服务器启动失败');
  process.exit(1);
}


