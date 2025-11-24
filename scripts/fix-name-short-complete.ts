import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNameShortComplete() {
  console.log('🔍 完整修复 name_short 数据...\n');

  try {
    // 1. 获取所有模板
    const templates = await prisma.schoolFormTemplate.findMany({
      include: {
        school: {
          select: {
            nameShort: true,
            permalink: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 找到 ${templates.length} 个模板\n`);

    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    const wpBaseUrl = baseUrl?.replace(/\/+$/, '') || '';

    if (!wpBaseUrl) {
      console.error('❌ WordPress base URL 未配置');
      process.exit(1);
    }

    let fixedCount = 0;
    let createdCount = 0;

    for (const template of templates) {
      // 解析 schoolId 格式: wp-profile-123 或 profile-123
      const match = template.schoolId.match(/^(?:wp-)?(profile|university)[-_]?(\d+)$/i);
      
      if (!match) {
        console.log(`  ⚠️  模板 ${template.id} (${template.schoolId}) 使用新格式，跳过`);
        continue;
      }

      const wpType = match[1].toLowerCase();
      const wpId = parseInt(match[2]);
      
      console.log(`\n🔍 处理模板 ${template.id} (${template.schoolId}):`);
      console.log(`   WordPress ID: ${wpId}, Type: ${wpType}`);

      // 直接从 WordPress REST API 获取单个 profile
      try {
        const endpoint = `${wpBaseUrl}/wp-json/wp/v2/${wpType}/${wpId}?_embed&acf_format=standard`;
        console.log(`   📡 获取: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          console.log(`   ⚠️  请求失败: ${response.status}`);
          continue;
        }

        const post = await response.json();
        
        // 提取 ACF 数据
        let nameShort: string | null = null;
        let permalink: string | null = null;

        if (post?.acf && typeof post.acf === 'object' && !Array.isArray(post.acf)) {
          nameShort = post.acf.name_short || post.acf.nameShort || null;
        }
        permalink = post?.link || post?.url || null;

        console.log(`   ✅ 获取到数据:`);
        console.log(`      nameShort: ${nameShort || 'null'}`);
        console.log(`      permalink: ${permalink || 'null'}`);
        console.log(`      ACF 键: ${post?.acf ? Object.keys(post.acf).slice(0, 10).join(', ') : '无'}`);

        if (!nameShort && !permalink) {
          console.log(`   ⚠️  没有找到 nameShort 或 permalink，跳过`);
          continue;
        }

        // 更新或创建 School 记录
        if (!template.school) {
          let schoolName = '未命名学校';
          if (typeof template.schoolName === 'string') {
            schoolName = template.schoolName;
          } else if (template.schoolName && typeof template.schoolName === 'object') {
            const nameObj = template.schoolName as any;
            schoolName = nameObj.en || nameObj['zh-CN'] || nameObj['zh-TW'] || post?.title?.rendered || post?.title || '未命名学校';
          }
          
          await prisma.school.create({
            data: {
              name: schoolName,
              nameShort: nameShort,
              permalink: permalink,
              templateId: template.id,
              metadataSource: 'wordpress',
              metadataLastFetchedAt: new Date()
            }
          });
          createdCount++;
          console.log(`   ✅ 创建了 School 记录`);
        } else {
          const needsUpdate = 
            (nameShort && template.school.nameShort !== nameShort) ||
            (permalink && template.school.permalink !== permalink);

          if (needsUpdate) {
            await prisma.school.update({
              where: { templateId: template.id },
              data: {
                nameShort: nameShort || undefined,
                permalink: permalink || undefined,
                metadataSource: 'wordpress',
                metadataLastFetchedAt: new Date()
              }
            });
            fixedCount++;
            console.log(`   ✅ 更新了 School 记录`);
          } else {
            console.log(`   ℹ️  School 记录已是最新`);
          }
        }

      } catch (error) {
        console.log(`   ❌ 获取数据失败:`, error);
        continue;
      }
    }

    console.log(`\n📈 统计:`);
    console.log(`  - 创建了 ${createdCount} 个 School 记录`);
    console.log(`  - 更新了 ${fixedCount} 个 School 记录`);
    console.log(`  - 总共处理了 ${createdCount + fixedCount} 个模板\n`);

    // 验证修复结果
    console.log('🔍 验证修复结果...\n');
    const afterTemplates = await prisma.schoolFormTemplate.findMany({
      include: {
        school: {
          select: {
            nameShort: true,
            permalink: true
          }
        }
      }
    });

    const withNameShort = afterTemplates.filter(t => t.school?.nameShort);
    const withPermalink = afterTemplates.filter(t => t.school?.permalink);

    console.log(`✅ 修复后统计:`);
    console.log(`  - 有 School 记录的模板: ${afterTemplates.filter(t => t.school).length}/${afterTemplates.length}`);
    console.log(`  - 有 nameShort 的模板: ${withNameShort.length}/${afterTemplates.length}`);
    console.log(`  - 有 permalink 的模板: ${withPermalink.length}/${afterTemplates.length}\n`);

    // 显示一些示例数据
    if (withNameShort.length > 0) {
      console.log('📋 示例数据（有 nameShort 的模板）:');
      withNameShort.forEach(t => {
        console.log(`  - ${t.schoolId}: nameShort="${t.school?.nameShort}", permalink="${t.school?.permalink || 'null'}"`);
      });
    } else {
      console.log('⚠️  没有找到任何 nameShort 数据！');
      console.log('   可能的原因:');
      console.log('   1. WordPress ACF 字段名不是 name_short');
      console.log('   2. WordPress REST API 没有返回 ACF 数据');
      console.log('   3. 需要配置 WordPress ACF to REST API 插件');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixNameShortComplete()
  .then(() => {
    console.log('\n✅ 修复完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 修复失败:', error);
    process.exit(1);
  });

