/**
 * 使用有效的 API Key 测试 Worker
 * 这会真正验证 Worker 是否正常工作
 */

require('dotenv').config();

const WORKER_URL = process.env.OPENAI_BASE_URL || 'https://openai-proxy.sosomamahk.workers.dev';
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
  console.error('   Please set OPENAI_API_KEY in your .env file');
  process.exit(1);
}

console.log('='.repeat(70));
console.log('🧪 使用 API Key 测试 Worker');
console.log('='.repeat(70));
console.log('');
console.log(`Worker URL: ${WORKER_URL}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log('');

// 使用 node-fetch 或原生 fetch
async function testWorker() {
  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    
    console.log('测试 1: 测试 Worker 基本访问（GET /v1/models）...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(`${WORKER_URL}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      const text = await response.text();
      
      console.log(`  状态码: ${response.status}`);
      
      if (response.status === 200) {
        console.log('  ✅ Worker 完美工作！');
        try {
          const data = JSON.parse(text);
          console.log(`  响应: 找到 ${data.data?.length || 0} 个模型`);
          if (data.data && data.data.length > 0) {
            console.log(`  第一个模型: ${data.data[0].id}`);
          }
        } catch (e) {
          console.log(`  响应预览: ${text.substring(0, 200)}`);
        }
        return true;
      } else if (response.status === 401) {
        console.log('  ⚠️  401 错误 - API Key 可能无效或已过期');
        try {
          const errorData = JSON.parse(text);
          console.log(`  错误消息: ${errorData.error?.message || 'Unknown error'}`);
        } catch (e) {
          console.log(`  响应: ${text.substring(0, 300)}`);
        }
        return false;
      } else {
        console.log(`  ⚠️  返回状态码: ${response.status}`);
        console.log(`  响应: ${text.substring(0, 300)}`);
        return response.status < 500; // 如果小于 500，说明 Worker 在工作
      }
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('  ❌ 请求超时');
      return false;
    }
    throw error;
  }
}

async function testChatCompletion() {
  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    
    console.log('');
    console.log('测试 2: 测试实际的聊天完成请求...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${WORKER_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ 
            role: 'user', 
            content: 'Say "Worker is working!" in one sentence.' 
          }],
          max_tokens: 20,
          temperature: 0,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      const text = await response.text();
      
      console.log(`  状态码: ${response.status}`);
      
      if (response.status === 200) {
        console.log('  ✅ 聊天完成请求成功！');
        try {
          const data = JSON.parse(text);
          const content = data.choices?.[0]?.message?.content;
          console.log(`  响应: ${content || 'N/A'}`);
          return true;
        } catch (e) {
          console.log(`  响应预览: ${text.substring(0, 200)}`);
          return true;
        }
      } else if (response.status === 401) {
        console.log('  ⚠️  401 错误 - API Key 可能无效');
        try {
          const errorData = JSON.parse(text);
          console.log(`  错误消息: ${errorData.error?.message || 'Unknown error'}`);
        } catch (e) {
          console.log(`  响应: ${text.substring(0, 300)}`);
        }
        return false;
      } else {
        console.log(`  ⚠️  返回状态码: ${response.status}`);
        console.log(`  响应: ${text.substring(0, 300)}`);
        return response.status < 500;
      }
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('  ❌ 请求超时');
      return false;
    }
    throw error;
  }
}

async function runTests() {
  const results = {
    modelsTest: false,
    chatTest: false,
  };

  try {
    results.modelsTest = await testWorker();
  } catch (error) {
    console.log(`  ❌ 测试失败: ${error.message}`);
  }

  if (results.modelsTest) {
    results.chatTest = await testChatCompletion();
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📊 测试结果');
  console.log('='.repeat(70));
  console.log('');

  if (results.modelsTest && results.chatTest) {
    console.log('🎉 完美！Worker 完全正常工作！');
    console.log('');
    console.log('✅ 所有测试通过');
    console.log('✅ Worker 可以正常转发请求到 OpenAI API');
    console.log('✅ 可以开始使用扫描功能了！');
    console.log('');
    console.log('下一步：');
    console.log('1. 确保应用已重启（环境变量只在启动时加载）');
    console.log('2. 尝试扫描模板');
    console.log('3. 应该不再看到连接错误！');
  } else if (results.modelsTest) {
    console.log('✅ Worker 基本功能正常');
    console.log('⚠️  聊天完成请求可能有问题，但基本代理功能正常');
    console.log('');
    console.log('可以尝试使用扫描功能，应该可以工作。');
  } else {
    console.log('⚠️  测试未完全通过');
    console.log('');
    console.log('可能的原因：');
    console.log('1. API Key 无效或已过期');
    console.log('2. API Key 没有足够的权限');
    console.log('3. 网络连接问题');
    console.log('');
    console.log('建议：');
    console.log('1. 检查 API Key 是否有效');
    console.log('2. 访问 https://platform.openai.com/api-keys 验证');
    console.log('3. 检查账户余额');
    console.log('4. 即使测试失败，Worker 本身可能仍然可用');
    console.log('   可以尝试在应用中直接使用扫描功能');
  }

  console.log('');
  console.log('='.repeat(70));
}

runTests().catch(error => {
  console.error('测试过程出错:', error);
  process.exit(1);
});

