/**
 * 测试 Cloudflare Workers 代理
 * 
 * 使用方法：
 * 1. 在 .env 文件中设置 OPENAI_BASE_URL 和 OPENAI_API_KEY
 * 2. 运行：node test-worker.js
 */

require('dotenv').config();

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_BASE_URL) {
  console.error('❌ ERROR: OPENAI_BASE_URL not found in environment variables');
  console.error('   Please set OPENAI_BASE_URL in your .env file');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
  console.error('   Please set OPENAI_API_KEY in your .env file');
  process.exit(1);
}

async function testWorker() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Cloudflare Workers Proxy');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('Configuration:');
  console.log(`   Base URL: ${OPENAI_BASE_URL}`);
  console.log(`   API Key: ${OPENAI_API_KEY.substring(0, 10)}...`);
  console.log('');

  // 测试 1: 测试 Worker 基本访问
  console.log('Test 1: Testing Worker basic access...');
  try {
    const testUrl = `${OPENAI_BASE_URL}/v1/models`;
    console.log(`   URL: ${testUrl}`);
    
    // 创建超时控制器（兼容旧版 Node.js）
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
    
    if (response.ok) {
      console.log('   ✅ Worker is accessible and responding correctly!');
      console.log(`   Response preview: ${preview}`);
    } else {
      console.log('   ⚠️  Worker returned error status');
      console.log(`   Response: ${preview}`);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    if (error.name === 'TimeoutError') {
      console.error('   ⚠️  Request timed out. Worker might be slow or unresponsive.');
    } else if (error.message.includes('fetch failed')) {
      console.error('   ⚠️  Network error. Check your internet connection and Worker URL.');
    }
  }

  console.log('');

  // 测试 2: 测试实际的聊天完成请求
  console.log('Test 2: Testing actual chat completion request...');
  try {
    const testUrl = `${OPENAI_BASE_URL}/v1/chat/completions`;
    console.log(`   URL: ${testUrl}`);
    
    // 创建超时控制器（兼容旧版 Node.js）
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 60000); // 60秒超时
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'user', 
          content: 'Say "Hello! Worker is working." in one sentence.' 
        }],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: controller2.signal,
    });
    
    clearTimeout(timeout2);

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    const preview = text.length > 300 ? text.substring(0, 300) + '...' : text;
    
    if (response.ok) {
      console.log('   ✅ Chat completion request successful!');
      try {
        const data = JSON.parse(text);
        console.log(`   Response: ${data.choices[0]?.message?.content || 'N/A'}`);
      } catch (e) {
        console.log(`   Response preview: ${preview}`);
      }
    } else {
      console.log('   ⚠️  Request failed');
      console.log(`   Response: ${preview}`);
      
      // 尝试解析错误消息
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) {
          console.log(`   Error message: ${errorData.error.message || errorData.error}`);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    if (error.name === 'TimeoutError') {
      console.error('   ⚠️  Request timed out. Worker might be slow or unresponsive.');
      console.error('   ⚠️  Check Cloudflare Workers logs for timeout errors.');
    } else if (error.message.includes('fetch failed')) {
      console.error('   ⚠️  Network error. Check:');
      console.error('      1. Worker URL is correct');
      console.error('      2. Worker is deployed and running');
      console.error('      3. Network connection is working');
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('Test completed!');
  console.log('='.repeat(60));
}

testWorker().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

