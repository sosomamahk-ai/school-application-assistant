/**
 * 直接测试 OpenAI 客户端配置
 * 验证代理配置是否正确
 */

require('dotenv').config();
const OpenAI = require('openai');

console.log('='.repeat(70));
console.log('🧪 直接测试 OpenAI 客户端配置');
console.log('='.repeat(70));
console.log('');

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL;

if (!apiKey) {
  console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

if (!baseURL) {
  console.error('❌ ERROR: OPENAI_BASE_URL not found in environment variables');
  console.error('   Please set OPENAI_BASE_URL in your .env file');
  process.exit(1);
}

console.log('配置信息:');
console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
console.log(`  Base URL: ${baseURL}`);
console.log(`  Full URL: ${baseURL}/v1/chat/completions`);
console.log('');

// 创建 OpenAI 客户端
console.log('创建 OpenAI 客户端...');
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL, // Remove trailing slash
});

console.log('✅ OpenAI 客户端已创建');
console.log('');

// 测试请求
async function testRequest() {
  try {
    console.log('发送测试请求...');
    console.log(`  目标: ${baseURL}/v1/chat/completions`);
    console.log('');
    
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ 
        role: 'user', 
        content: 'Say "Hello, proxy is working!" in one sentence.' 
      }],
      max_tokens: 20,
      temperature: 0,
    });

    const duration = Date.now() - startTime;
    
    console.log('='.repeat(70));
    console.log('✅ 测试成功！');
    console.log('='.repeat(70));
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`🤖 模型: ${completion.model}`);
    console.log(`💬 响应: ${completion.choices[0]?.message?.content}`);
    console.log('');
    console.log('🎉 代理配置正确！OpenAI 客户端可以正常工作！');
    console.log('');
    console.log('下一步：');
    console.log('1. 确保应用已重启（环境变量只在启动时加载）');
    console.log('2. 尝试扫描模板');
    console.log('3. 应该不再看到连接错误！');
    console.log('');
    
  } catch (error) {
    console.log('='.repeat(70));
    console.log('❌ 测试失败');
    console.log('='.repeat(70));
    console.log('');
    console.error('错误详情:');
    console.error(`  消息: ${error.message}`);
    
    if (error.response) {
      console.error(`  状态码: ${error.response.status}`);
      console.error(`  状态文本: ${error.response.statusText}`);
      if (error.response.data) {
        console.error(`  响应: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    if (error.request) {
      console.error(`  请求 URL: ${error.request.url || baseURL}`);
    }
    
    if (error.code) {
      console.error(`  错误代码: ${error.code}`);
    }
    
    console.error('');
    console.error('完整错误:');
    console.error(error.stack);
    console.error('');
    
    // 检查错误的内部属性
    if (error.cause) {
      console.error('错误原因:', error.cause);
    }
    
    if (error.error) {
      console.error('内部错误:', error.error);
      if (error.error.message) {
        console.error('  消息:', error.error.message);
      }
      if (error.error.code) {
        console.error('  代码:', error.error.code);
      }
    }
    
    // 检查是否是网络错误
    if (error.message === 'Connection error.' || error.message.includes('Connection error')) {
      console.log('💡 诊断: 连接错误（通用）');
      console.log('');
      console.log('   这可能是网络或 DNS 问题。');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 在浏览器中测试 Worker URL（已验证可访问）');
      console.log(`      访问: ${baseURL}/v1/models`);
      console.log('   2. 如果浏览器可以访问，可能是 Node.js 网络配置问题');
      console.log('   3. 尝试使用不同的 DNS 服务器（如 8.8.8.8）');
      console.log('   4. 检查防火墙是否阻止了 Node.js 的网络访问');
      console.log('   5. 虽然本地测试失败，应用在生产环境中可能仍然可用');
      console.log('');
      console.log('   💡 重要提示：');
      console.log('      - 浏览器可以访问 Worker，说明 Worker 已部署成功');
      console.log('      - 如果应用仍然报错，可能是应用未重启或环境变量未加载');
      console.log('      - 请确保应用已完全重启以加载新的环境变量');
      console.log('');
    }
    
    // 提供具体的错误分析
    if (error.message.includes('getaddrinfo EAI_AGAIN') || 
        error.message.includes('ENOTFOUND')) {
      console.log('💡 诊断: DNS 解析失败');
      console.log('   可能的原因：');
      console.log('   1. Worker URL 不正确');
      console.log('   2. 网络连接问题');
      console.log('   3. DNS 服务器问题');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 在浏览器中测试 Worker URL');
      console.log(`      访问: ${baseURL}/v1/models`);
      console.log('   2. 检查网络连接');
      console.log('   3. 如果浏览器可以访问，可能是本地网络问题');
    } else if (error.message.includes('timeout')) {
      console.log('💡 诊断: 请求超时');
      console.log('   可能的原因：');
      console.log('   1. Worker 响应慢');
      console.log('   2. 网络连接慢');
      console.log('   3. Worker 未部署或已停止');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 检查 Cloudflare Workers 控制台');
      console.log('   2. 查看 Worker 日志');
      console.log('   3. 重新部署 Worker');
    } else if (error.response?.status === 401) {
      console.log('💡 诊断: 401 未授权');
      console.log('   可能的原因：');
      console.log('   1. API Key 无效或已过期');
      console.log('   2. API Key 没有权限');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 检查 API Key 是否有效');
      console.log('   2. 访问 https://platform.openai.com/api-keys 验证');
      console.log('   3. 检查账户余额');
    } else if (error.response?.status === 403) {
      console.log('💡 诊断: 403 禁止访问');
      console.log('   可能的原因：');
      console.log('   1. 地区限制（但 Worker 应该解决这个问题）');
      console.log('   2. Worker 代码有问题');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 检查 Worker 代码是否正确');
      console.log('   2. 查看 Worker 日志');
      console.log('   3. 重新部署 Worker');
    } else if (error.response?.status === 404) {
      console.log('💡 诊断: 404 未找到');
      console.log('   可能的原因：');
      console.log('   1. Worker URL 路径不正确');
      console.log('   2. Worker 未部署');
      console.log('');
      console.log('   解决方案：');
      console.log('   1. 确认 OPENAI_BASE_URL 不包含 /v1 路径');
      console.log('   2. 检查 Worker 是否已部署');
      console.log('   3. 在浏览器中测试 Worker URL');
    }
    
    console.log('');
    process.exit(1);
  }
}

// 运行测试
testRequest();

