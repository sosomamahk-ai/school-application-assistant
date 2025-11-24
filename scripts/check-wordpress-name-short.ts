import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

import { getWordPressSchools } from '../src/services/wordpressSchoolService';

async function checkWordPressNameShort() {
  console.log('🔍 检查 WordPress API 返回的 name_short 数据...\n');

  try {
    const wordPressData = await getWordPressSchools({ forceRefresh: true });
    const wpSchools = wordPressData.profiles || [];
    
    console.log(`📊 从 WordPress 获取到 ${wpSchools.length} 个学校\n`);

    // 检查有多少学校有 nameShort
    const withNameShort = wpSchools.filter(wp => wp.nameShort);
    const withAcfNameShort = wpSchools.filter(wp => wp.acf?.name_short || wp.acf?.nameShort);
    const withPermalink = wpSchools.filter(wp => wp.permalink || wp.url);

    console.log(`📈 统计:`);
    console.log(`  - 有 nameShort 字段的: ${withNameShort.length}/${wpSchools.length}`);
    console.log(`  - 有 acf.name_short 的: ${withAcfNameShort.length}/${wpSchools.length}`);
    console.log(`  - 有 permalink 的: ${withPermalink.length}/${wpSchools.length}\n`);

    // 显示一些示例
    if (withNameShort.length > 0) {
      console.log(`✅ 有 nameShort 的学校示例（前 5 个）:`);
      withNameShort.slice(0, 5).forEach(wp => {
        console.log(`  - ${wp.title} (ID: ${wp.id}): nameShort="${wp.nameShort}"`);
      });
      console.log('');
    }

    if (withAcfNameShort.length > 0 && withNameShort.length === 0) {
      console.log(`⚠️  发现 ${withAcfNameShort.length} 个学校有 acf.name_short，但 nameShort 字段为空`);
      console.log(`   这表明 WordPress fetcher 可能没有正确提取 name_short\n`);
      
      console.log(`📋 有 acf.name_short 的学校示例（前 5 个）:`);
      withAcfNameShort.slice(0, 5).forEach(wp => {
        const nameShort = wp.acf?.name_short || wp.acf?.nameShort;
        console.log(`  - ${wp.title} (ID: ${wp.id}):`);
        console.log(`    acf.name_short = "${nameShort}"`);
        console.log(`    nameShort 字段 = "${wp.nameShort || 'null'}"`);
        console.log(`    acf 对象键: ${Object.keys(wp.acf || {}).join(', ')}`);
      });
      console.log('');
    }

    if (withNameShort.length === 0 && withAcfNameShort.length === 0) {
      console.log(`❌ 没有找到任何 name_short 数据！`);
      console.log(`   可能的原因:`);
      console.log(`   1. WordPress ACF 字段名不是 name_short`);
      console.log(`   2. WordPress REST API 没有返回 ACF 数据`);
      console.log(`   3. ACF 数据格式不正确\n`);
      
      // 显示一个示例学校的完整 ACF 数据
      if (wpSchools.length > 0) {
        const sample = wpSchools[0];
        console.log(`📋 示例学校的完整数据结构:`);
        console.log(`  标题: ${sample.title}`);
        console.log(`  ID: ${sample.id}`);
        console.log(`  nameShort 字段: ${sample.nameShort || 'null'}`);
        console.log(`  permalink 字段: ${sample.permalink || 'null'}`);
        console.log(`  url 字段: ${sample.url || 'null'}`);
        console.log(`  ACF 对象:`, JSON.stringify(sample.acf, null, 2));
      }
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
    throw error;
  }
}

checkWordPressNameShort()
  .then(() => {
    console.log('\n✅ 检查完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 检查失败:', error);
    process.exit(1);
  });

