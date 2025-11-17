/**
 * 重置管理员密码脚本
 * 
 * 使用方法：
 * 1. 在项目根目录运行：npx ts-node template-examples/reset-admin-password.ts
 * 2. 脚本会重置 sosomamahk@gmail.com 的密码为 admin-sosomama
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const adminEmail = 'sosomamahk@gmail.com';
    const newPassword = 'admin-sosomama';

    // 检查账号是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingUser) {
      console.error(`❌ 账号不存在: ${adminEmail}`);
      console.log('\n请先注册账号，或使用其他邮箱。');
      process.exit(1);
    }

    // 生成新密码的 bcrypt hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码和角色
    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ 管理员账号已更新:');
    console.log(`   邮箱: ${updated.email}`);
    console.log(`   角色: ${updated.role}`);
    console.log(`   ID: ${updated.id}`);
    console.log('\n📝 新的登录信息:');
    console.log(`   邮箱: ${adminEmail}`);
    console.log(`   密码: ${newPassword}`);
    console.log('\n⚠️  请妥善保管密码！');
    console.log('\n现在可以使用新密码登录了。');
  } catch (error: any) {
    console.error('❌ 重置密码失败:', error);
    if (error.code === 'P2025') {
      console.error('账号不存在');
    } else {
      console.error('错误详情:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();

