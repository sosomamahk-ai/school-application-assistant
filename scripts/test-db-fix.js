const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseFix() {
  try {
    console.log('测试数据库连接和表访问...\n');
    
    // 1. 测试连接
    console.log('1. 测试数据库连接...');
    await prisma.$connect();
    console.log('   ✓ 数据库连接成功\n');
    
    // 2. 测试 FieldMapping 表
    console.log('2. 测试 FieldMapping 表...');
    try {
      const count = await prisma.fieldMapping.count();
      console.log(`   ✓ FieldMapping 表可访问 (当前记录数: ${count})\n`);
    } catch (error) {
      console.error('   ✗ FieldMapping 表访问失败:', error.message);
      throw error;
    }
    
    // 3. 测试其他关键表
    console.log('3. 测试其他关键表...');
    const userCount = await prisma.user.count();
    const templateCount = await prisma.schoolFormTemplate.count();
    console.log(`   ✓ User 表: ${userCount} 条记录`);
    console.log(`   ✓ SchoolFormTemplate 表: ${templateCount} 条记录\n`);
    
    // 4. 测试 Prisma Client 方法
    console.log('4. 测试 Prisma Client 方法...');
    const testQuery = await prisma.fieldMapping.findMany({ take: 1 });
    console.log('   ✓ fieldMapping.findMany() 方法正常\n');
    
    console.log('✅ 所有测试通过！数据库修复成功。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseFix();

