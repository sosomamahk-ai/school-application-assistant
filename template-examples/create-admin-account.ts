/**
 * 创建管理员账号脚本
 * 
 * 使用方法：
 * 1. 在项目根目录运行：npx ts-node template-examples/create-admin-account.ts
 * 2. 或者在 Node.js 环境中运行此脚本
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ensureUserRoleColumn } from '../src/lib/prisma-role-column';

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    const adminEmail = 'sosomamahk@gmail.com';
    const adminPassword = 'admin-sosomama';

    await ensureUserRoleColumn(prisma);

    // 检查管理员账号是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      // 如果存在，更新为管理员
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
    } else {
      // 如果不存在，创建新管理员账号
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('✅ 管理员账号已创建:');
      console.log(`   邮箱: ${admin.email}`);
      console.log(`   角色: ${admin.role}`);
      console.log(`   ID: ${admin.id}`);
    }

    console.log('\n📝 登录信息:');
    console.log(`   邮箱: ${adminEmail}`);
    console.log(`   密码: ${adminPassword}`);
    console.log('\n⚠️  请妥善保管密码！');
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();

