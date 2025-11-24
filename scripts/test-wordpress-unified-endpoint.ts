import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../.env.local') });

async function testWordPressUnifiedEndpoint() {
  const baseUrl = process.env.WORDPRESS_BASE_URL || process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL;
  
  if (!baseUrl) {
    console.error('❌ WordPress base URL 未配置');
    process.exit(1);
  }

  console.log(`🔍 测试 WordPress Unified Endpoint: ${baseUrl}/wp-json/schools/v1/list\n`);

  try {
    const response = await fetch(`${baseUrl}/wp-json/schools/v1/list`, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const data = await response.json();
    
    // 检查数据结构
    if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
      const sample = data.profiles[0];
      console.log(`✅ 获取到 ${data.profiles.length} 个 profiles\n`);
      console.log(`📋 示例 profile 数据结构:`);
      console.log(`  ID: ${sample.id}`);
      console.log(`  标题: ${sample.title || sample.name || 'N/A'}`);
      console.log(`  有 acf 字段: ${!!sample.acf}`);
      console.log(`  acf 类型: ${typeof sample.acf}`);
      console.log(`  acf 是对象: ${typeof sample.acf === 'object' && !Array.isArray(sample.acf)}`);
      
      if (sample.acf && typeof sample.acf === 'object' && !Array.isArray(sample.acf)) {
        console.log(`  acf 键: ${Object.keys(sample.acf).join(', ')}`);
        console.log(`  acf.name_short: ${sample.acf.name_short || 'null'}`);
        console.log(`  acf.nameShort: ${sample.acf.nameShort || 'null'}`);
      } else {
        console.log(`  ⚠️  acf 不是有效对象`);
      }
      
      console.log(`  link 字段: ${sample.link || 'null'}`);
      console.log(`  url 字段: ${sample.url || 'null'}`);
      
      // 检查是否有 name_short 在其他位置
      console.log(`\n  完整对象键: ${Object.keys(sample).join(', ')}`);
      
      // 尝试查找 name_short
      if (sample.name_short) {
        console.log(`  ✅ 找到 name_short (根级别): ${sample.name_short}`);
      }
      if (sample.nameShort) {
        console.log(`  ✅ 找到 nameShort (根级别): ${sample.nameShort}`);
      }
      
      console.log(`\n  完整示例对象 (前 500 字符):`);
      console.log(JSON.stringify(sample, null, 2).substring(0, 500));
    } else {
      console.log(`⚠️  响应格式不符合预期`);
      console.log(`  响应键: ${Object.keys(data).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testWordPressUnifiedEndpoint()
  .then(() => {
    console.log('\n✅ 测试完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  });

