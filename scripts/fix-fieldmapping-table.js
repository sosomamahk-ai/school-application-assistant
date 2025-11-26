const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFieldMappingTable() {
  try {
    console.log('检查 FieldMapping 表是否存在...');
    
    // 检查表是否存在
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'FieldMapping'
    `;
    
    if (result.length > 0) {
      console.log('✓ FieldMapping 表已存在');
      return;
    }
    
    console.log('✗ FieldMapping 表不存在，正在创建...');
    
    // 创建表
    await prisma.$executeRaw`
      CREATE TABLE "FieldMapping" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "domain" TEXT NOT NULL,
        "selector" TEXT NOT NULL,
        "domId" TEXT,
        "domName" TEXT,
        "profileField" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FieldMapping_pkey" PRIMARY KEY ("id")
      )
    `;
    
    // 创建外键
    await prisma.$executeRaw`
      ALTER TABLE "FieldMapping"
      ADD CONSTRAINT "FieldMapping_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `;
    
    // 创建唯一索引
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "FieldMapping_userId_domain_selector_key" 
      ON "FieldMapping"("userId", "domain", "selector")
    `;
    
    console.log('✓ FieldMapping 表创建成功！');
    
  } catch (error) {
    console.error('错误:', error.message);
    if (error.message.includes('already exists')) {
      console.log('表可能已经存在，但名称不同。检查所有表...');
      const allTables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      console.log('现有表:', allTables.map(t => t.table_name).join(', '));
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixFieldMappingTable();


