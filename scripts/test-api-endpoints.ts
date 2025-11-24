import fetch from 'node-fetch';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('🧪 测试 API 端点返回的 nameShort 数据...\n');

  try {
    // 1. 测试 /api/templates
    console.log('1️⃣  测试 /api/templates...');
    const templatesResponse = await fetch(`${BASE_URL}/api/templates`);
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      const templates = templatesData.templates || [];
      console.log(`   ✅ 返回 ${templates.length} 个模板`);
      
      const withNameShort = templates.filter((t: any) => t.nameShort);
      const withPermalink = templates.filter((t: any) => t.permalink);
      
      console.log(`   - 有 nameShort 的模板: ${withNameShort.length}/${templates.length}`);
      console.log(`   - 有 permalink 的模板: ${withPermalink.length}/${templates.length}`);
      
      if (withNameShort.length > 0) {
        console.log(`   📋 示例（前 3 个）:`);
        withNameShort.slice(0, 3).forEach((t: any) => {
          console.log(`      - ${t.schoolId}: nameShort="${t.nameShort}", permalink="${t.permalink || 'null'}"`);
        });
      } else {
        console.log(`   ⚠️  没有模板包含 nameShort！`);
      }
    } else {
      console.log(`   ❌ 请求失败: ${templatesResponse.status}`);
    }
    console.log('');

    // 2. 测试 /api/wordpress/school-profiles (需要认证，但我们可以检查结构)
    console.log('2️⃣  测试 WordPress 数据提取...');
    console.log('   ℹ️  需要手动检查 WordPress API 是否返回 acf.name_short');
    console.log('');

    // 3. 测试数据库查询
    console.log('3️⃣  检查数据库中的 School 记录...');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const schools = await prisma.school.findMany({
        select: {
          id: true,
          templateId: true,
          name: true,
          nameShort: true,
          permalink: true
        },
        take: 10
      });

      console.log(`   ✅ 找到 ${schools.length} 个 School 记录（显示前 10 个）`);
      const withNameShort = schools.filter(s => s.nameShort);
      const withPermalink = schools.filter(s => s.permalink);
      
      console.log(`   - 有 nameShort 的记录: ${withNameShort.length}/${schools.length}`);
      console.log(`   - 有 permalink 的记录: ${withPermalink.length}/${schools.length}`);
      
      if (withNameShort.length > 0) {
        console.log(`   📋 示例:`);
        withNameShort.slice(0, 5).forEach(s => {
          console.log(`      - ${s.name}: nameShort="${s.nameShort}", permalink="${s.permalink || 'null'}"`);
        });
      } else {
        console.log(`   ⚠️  没有 School 记录包含 nameShort！`);
      }
      
      await prisma.$disconnect();
    } catch (error) {
      console.log(`   ❌ 数据库查询失败: ${error}`);
    }
    console.log('');

    console.log('✅ API 端点测试完成！\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
testAPIEndpoints()
  .then(() => {
    console.log('✅ 所有测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });

