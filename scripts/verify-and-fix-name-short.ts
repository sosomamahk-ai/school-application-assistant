import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import { getWordPressSchools } from '../src/services/wordpressSchoolService';

const prisma = new PrismaClient();

async function verifyAndFixNameShort() {
  console.log('🔍 开始验证和修复 name_short 数据...\n');

  try {
    // 1. 检查所有模板
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

    // 2. 检查哪些模板缺少 School 记录
    const templatesWithoutSchool = templates.filter(t => !t.school);
    const templatesWithNullNameShort = templates.filter(t => t.school && !t.school.nameShort);

    console.log(`⚠️  缺少 School 记录的模板: ${templatesWithoutSchool.length}`);
    console.log(`⚠️  School 记录中 nameShort 为 null 的模板: ${templatesWithNullNameShort.length}\n`);

    // 3. 获取 WordPress 数据
    console.log('📡 从 WordPress 获取学校数据...');
    const wordPressData = await getWordPressSchools({ forceRefresh: true });
    const wpSchools = wordPressData.profiles || [];
    console.log(`✅ 从 WordPress 获取到 ${wpSchools.length} 个学校\n`);

    // 3.5. 直接从 WordPress REST API 获取 ACF 数据（因为 unified endpoint 返回空 acf）
    console.log('📡 直接从 WordPress REST API 获取 ACF 数据...');
    const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
    const wpBaseUrl = baseUrl?.replace(/\/+$/, '') || '';
    const acfDataMap = new Map<number, { name_short?: string; permalink?: string }>();
    
    if (wpBaseUrl) {
      // Get profile IDs from templates
      const profileIds: number[] = [];
      templates.forEach(template => {
        const match = template.schoolId.match(/^(?:wp-)?(profile|university)[-_]?(\d+)$/i);
        if (match) {
          profileIds.push(parseInt(match[2]));
        }
      });

      // Fetch ACF data in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < profileIds.length; i += BATCH_SIZE) {
        const batchIds = profileIds.slice(i, i + BATCH_SIZE);
        const includeParam = batchIds.join(',');
        const endpoint = `${wpBaseUrl}/wp-json/wp/v2/profile?include=${includeParam}&per_page=${BATCH_SIZE}&_embed&acf_format=standard`;
        
        try {
          const response = await fetch(endpoint, {
            headers: { Accept: 'application/json' }
          });
          
          if (response.ok) {
            const batchData = await response.json();
            if (Array.isArray(batchData)) {
              batchData.forEach((post: any) => {
                const id = Number(post?.id ?? post?.ID ?? 0);
                if (id && post?.acf && typeof post.acf === 'object' && !Array.isArray(post.acf)) {
                  acfDataMap.set(id, {
                    name_short: post.acf.name_short || post.acf.nameShort || undefined,
                    permalink: post.link || post.url || undefined
                  });
                }
              });
            }
          }
        } catch (error) {
          console.warn(`  ⚠️  批量获取 ACF 数据失败 (batch ${Math.floor(i / BATCH_SIZE) + 1}):`, error);
        }
      }
      
      console.log(`✅ 从 REST API 获取到 ${acfDataMap.size} 个学校的 ACF 数据\n`);
    }

    // 4. 创建 WordPress 学校映射
    const wpSchoolMap = new Map<string, typeof wpSchools[0]>();
    wpSchools.forEach(wp => {
      const key = `${wp.type}-${wp.id}`;
      wpSchoolMap.set(key, wp);
    });

    // 5. 解析模板的 schoolId 并匹配 WordPress 数据
    let fixedCount = 0;
    let createdCount = 0;

    for (const template of templates) {
      // 解析 schoolId 格式: wp-profile-123 或 profile-123
      const match = template.schoolId.match(/^(?:wp-)?(profile|university)[-_]?(\d+)$/i);
      
      if (!match) {
        // 尝试新格式: name_short-category-year
        console.log(`  ⚠️  模板 ${template.id} (${template.schoolId}) 使用新格式，跳过 WordPress 匹配`);
        continue;
      }

      const wpType = match[1].toLowerCase() as 'profile' | 'university';
      const wpId = parseInt(match[2]);
      const wpKey = `${wpType}-${wpId}`;
      
      const wpSchool = wpSchoolMap.get(wpKey);
      
      // 优先从 REST API 获取的 ACF 数据（更可靠）
      const acfData = acfDataMap.get(wpId);
      let nameShort: string | null = null;
      let permalink: string | null = null;
      
      if (acfData) {
        nameShort = acfData.name_short || null;
        permalink = acfData.permalink || null;
      }
      
      // 如果没有从 REST API 获取到，尝试从 unified endpoint 数据
      if (!nameShort) {
        if (wpSchool) {
          nameShort = wpSchool.nameShort || wpSchool.acf?.name_short || wpSchool.acf?.nameShort || null;
        }
      }
      if (!permalink) {
        if (wpSchool) {
          permalink = wpSchool.permalink || wpSchool.url || null;
        }
      }
      
      if (!wpSchool && !acfData) {
        console.log(`  ⚠️  模板 ${template.id} (${template.schoolId}) 在 WordPress 中未找到匹配的学校`);
        continue;
      }
      
      // Ensure we have at least name or permalink to update
      if (!nameShort && !permalink) {
        console.log(`  ⚠️  模板 ${template.id} (${template.schoolId}) 没有找到 nameShort 或 permalink`);
        continue;
      }

      if (!nameShort && !permalink) {
        console.log(`  ⚠️  模板 ${template.id} (${template.schoolId}) 在 WordPress 中未找到 nameShort 或 permalink`);
        continue;
      }

      // 更新或创建 School 记录
      if (!template.school) {
        // 创建 School 记录
        let schoolName = '未命名学校';
        if (typeof template.schoolName === 'string') {
          schoolName = template.schoolName;
        } else if (template.schoolName && typeof template.schoolName === 'object') {
          const nameObj = template.schoolName as any;
          schoolName = nameObj.en || nameObj['zh-CN'] || nameObj['zh-TW'] || '未命名学校';
        }
        if (schoolName === '未命名学校' && wpSchool) {
          schoolName = wpSchool.title;
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
        console.log(`  ✅ 为模板 ${template.id} (${template.schoolId}) 创建了 School 记录: nameShort=${nameShort || 'null'}, permalink=${permalink || 'null'}`);
      } else {
        // 更新现有 School 记录
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
          console.log(`  ✅ 更新了模板 ${template.id} (${template.schoolId}) 的 School 记录: nameShort=${nameShort || 'null'}, permalink=${permalink || 'null'}`);
        } else {
          console.log(`  ℹ️  模板 ${template.id} (${template.schoolId}) 的 School 记录已是最新`);
        }
      }
    }

    console.log(`\n📈 统计:`);
    console.log(`  - 创建了 ${createdCount} 个 School 记录`);
    console.log(`  - 更新了 ${fixedCount} 个 School 记录`);
    console.log(`  - 总共处理了 ${createdCount + fixedCount} 个模板\n`);

    // 6. 验证修复结果
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

    // 7. 显示一些示例数据
    console.log('📋 示例数据（前 5 个有 nameShort 的模板）:');
    withNameShort.slice(0, 5).forEach(t => {
      console.log(`  - ${t.schoolId}: nameShort="${t.school?.nameShort}", permalink="${t.school?.permalink || 'null'}"`);
    });

  } catch (error) {
    console.error('❌ 错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
verifyAndFixNameShort()
  .then(() => {
    console.log('\n✅ 验证和修复完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 验证和修复失败:', error);
    process.exit(1);
  });

