import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

async function testWordPressDirectACF() {
  const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  
  if (!baseUrl) {
    console.error('❌ WordPress base URL 未配置');
    process.exit(1);
  }

  console.log(`🔍 测试直接访问 WordPress REST API 获取 ACF 数据...\n`);

  // 使用之前找到的一个 profile ID
  const testProfileId = 35899; // ６１１生命树幼稚园

  try {
    // 测试 1: 使用标准 WordPress REST API
    console.log(`1️⃣  测试标准 WordPress REST API: /wp-json/wp/v2/profile/${testProfileId}?_embed&acf_format=standard`);
    const standardResponse = await fetch(`${baseUrl}/wp-json/wp/v2/profile/${testProfileId}?_embed&acf_format=standard`, {
      headers: { Accept: 'application/json' }
    });

    if (standardResponse.ok) {
      const standardData = await standardResponse.json();
      console.log(`   ✅ 成功获取数据`);
      console.log(`   - 有 acf 字段: ${!!standardData.acf}`);
      console.log(`   - acf 类型: ${typeof standardData.acf}`);
      if (standardData.acf && typeof standardData.acf === 'object' && !Array.isArray(standardData.acf)) {
        console.log(`   - acf 键: ${Object.keys(standardData.acf).join(', ')}`);
        console.log(`   - acf.name_short: ${standardData.acf.name_short || 'null'}`);
        console.log(`   - acf.nameShort: ${standardData.acf.nameShort || 'null'}`);
      } else {
        console.log(`   - acf 值: ${JSON.stringify(standardData.acf)}`);
      }
      console.log(`   - link 字段: ${standardData.link || 'null'}`);
    } else {
      console.log(`   ❌ 请求失败: ${standardResponse.status}`);
    }
    console.log('');

    // 测试 2: 使用 ACF REST API (如果安装了 ACF to REST API 插件)
    console.log(`2️⃣  测试 ACF REST API: /wp-json/acf/v3/profile/${testProfileId}`);
    const acfResponse = await fetch(`${baseUrl}/wp-json/acf/v3/profile/${testProfileId}`, {
      headers: { Accept: 'application/json' }
    });

    if (acfResponse.ok) {
      const acfData = await acfResponse.json();
      console.log(`   ✅ 成功获取 ACF 数据`);
      console.log(`   ACF 数据:`, JSON.stringify(acfData, null, 2).substring(0, 500));
    } else {
      console.log(`   ⚠️  ACF REST API 不可用: ${acfResponse.status}`);
    }
    console.log('');

    // 测试 3: 检查 meta 字段
    console.log(`3️⃣  检查 meta 字段: /wp-json/wp/v2/profile/${testProfileId}?context=edit`);
    const metaResponse = await fetch(`${baseUrl}/wp-json/wp/v2/profile/${testProfileId}?context=edit`, {
      headers: { Accept: 'application/json' }
    });

    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      console.log(`   ✅ 成功获取数据`);
      if (metaData.meta) {
        console.log(`   - 有 meta 字段: true`);
        console.log(`   - meta 键: ${Object.keys(metaData.meta).filter(k => k.includes('name') || k.includes('short')).join(', ')}`);
        // 查找可能的 name_short 字段
        const nameShortKeys = Object.keys(metaData.meta).filter(k => 
          k.toLowerCase().includes('name') && k.toLowerCase().includes('short')
        );
        if (nameShortKeys.length > 0) {
          console.log(`   - 找到可能的 name_short 字段: ${nameShortKeys.join(', ')}`);
          nameShortKeys.forEach(key => {
            console.log(`     ${key}: ${metaData.meta[key]}`);
          });
        }
      } else {
        console.log(`   - 没有 meta 字段`);
      }
    } else {
      console.log(`   ⚠️  需要认证才能访问 context=edit`);
    }
    console.log('');

    // 测试 4: 尝试获取多个 profiles 查看是否有不同的格式
    console.log(`4️⃣  测试批量获取: /wp-json/wp/v2/profile?per_page=3&_embed&acf_format=standard`);
    const batchResponse = await fetch(`${baseUrl}/wp-json/wp/v2/profile?per_page=3&_embed&acf_format=standard`, {
      headers: { Accept: 'application/json' }
    });

    if (batchResponse.ok) {
      const batchData = await batchResponse.json();
      console.log(`   ✅ 成功获取 ${batchData.length} 个 profiles`);
      batchData.forEach((item: any, index: number) => {
        console.log(`   Profile ${index + 1} (ID: ${item.id}):`);
        console.log(`     - 标题: ${item.title?.rendered || item.title}`);
        console.log(`     - 有 acf: ${!!item.acf}`);
        if (item.acf && typeof item.acf === 'object' && !Array.isArray(item.acf)) {
          console.log(`     - acf 键: ${Object.keys(item.acf).slice(0, 10).join(', ')}${Object.keys(item.acf).length > 10 ? '...' : ''}`);
          console.log(`     - acf.name_short: ${item.acf.name_short || 'null'}`);
        } else {
          console.log(`     - acf 类型: ${typeof item.acf}, 值: ${Array.isArray(item.acf) ? '[]' : String(item.acf).substring(0, 50)}`);
        }
      });
    } else {
      console.log(`   ❌ 批量请求失败: ${batchResponse.status}`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testWordPressDirectACF()
  .then(() => {
    console.log('\n✅ 测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  });

