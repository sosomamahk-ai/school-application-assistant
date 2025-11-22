/**
 * 测试 OpenAI API 代理配置
 * 
 * 使用方法：
 * node test-proxy.js
 */

require('dotenv').config();
const OpenAI = require('openai');

// 检查环境变量
console.log('='.repeat(60));
console.log('🧪 Testing OpenAI API Proxy Configuration');
console.log('='.repeat(60));
console.log('');

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
  console.error('   Please set OPENAI_API_KEY in your .env file');
  process.exit(1);
}

if (!process.env.OPENAI_BASE_URL) {
  console.error('❌ ERROR: OPENAI_BASE_URL not found in environment variables');
  console.error('   Please set OPENAI_BASE_URL in your .env file');
  console.error('   Example: OPENAI_BASE_URL=http://localhost:3001');
  process.exit(1);
}

console.log('✅ Environment variables found:');
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);
console.log(`   OPENAI_BASE_URL: ${process.env.OPENAI_BASE_URL}`);
console.log('');

// 创建 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

async function testProxy() {
  try {
    console.log('🔄 Testing connection to proxy...');
    console.log(`   Target: ${process.env.OPENAI_BASE_URL}/v1/chat/completions`);
    console.log('');

    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ 
        role: 'user', 
        content: 'Say "Hello! Proxy is working correctly." in one sentence.' 
      }],
      max_tokens: 20,
      temperature: 0,
    });

    const duration = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log('✅ SUCCESS! Proxy is working correctly!');
    console.log('='.repeat(60));
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`🤖 Model: ${completion.model}`);
    console.log(`💬 Response: ${completion.choices[0]?.message?.content}`);
    console.log('');
    console.log('✨ Your proxy configuration is correct!');
    console.log('   You can now use the template scanning feature.');
    console.log('');

  } catch (error) {
    console.log('='.repeat(60));
    console.log('❌ ERROR: Proxy test failed');
    console.log('='.repeat(60));
    console.log('');
    console.error('Error details:');
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
    }
    
    if (error.message.includes('Country, region, or territory not supported')) {
      console.error('');
      console.error('⚠️  Region restriction detected!');
      console.error('');
      console.error('Possible solutions:');
      console.error('1. Check if your proxy server is running');
      console.error('2. Verify OPENAI_BASE_URL is correct');
      console.error('3. Test proxy server: curl http://localhost:3001/health');
      console.error('4. Check proxy server logs for errors');
    } else if (error.message.includes('Invalid API key')) {
      console.error('');
      console.error('⚠️  Invalid API key!');
      console.error('');
      console.error('Please check your OPENAI_API_KEY in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('⚠️  Connection refused!');
      console.error('');
      console.error('The proxy server might not be running.');
      console.error('Please start the proxy server first:');
      console.error('   node proxy-server.js');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error('');
      console.error('⚠️  DNS resolution failed!');
      console.error('');
      console.error('Please check your OPENAI_BASE_URL hostname.');
    }
    
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    
    process.exit(1);
  }
}

// 运行测试
testProxy();

