/**
 * 简单的 Worker 测试脚本
 * 使用简单的 HTTP 请求测试 Worker
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const WORKER_URL = process.env.OPENAI_BASE_URL || 'https://openai-proxy.sosomamahk.workers.dev';
const API_KEY = process.env.OPENAI_API_KEY;

console.log('='.repeat(70));
console.log('🧪 简单测试 Cloudflare Worker');
console.log('='.repeat(70));
console.log('');
console.log(`Worker URL: ${WORKER_URL}`);
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : '(未设置)'}`);
console.log('');

function testWorker() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${WORKER_URL}/v1/models`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY || 'test'}`,
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTest() {
  console.log('正在测试 Worker...');
  console.log('');

  try {
    const result = await testWorker();
    
    console.log(`✅ Worker 响应成功！`);
    console.log(`   状态码: ${result.status}`);
    console.log(`   状态文本: ${result.statusText}`);
    console.log('');
    
    if (result.status === 200) {
      console.log('🎉 完美！Worker 正常工作！');
      console.log(`   响应预览: ${result.body.substring(0, 200)}...`);
    } else if (result.status === 401) {
      console.log('✅ Worker 正常工作！');
      console.log('   401 错误表示需要有效的 API Key，这是正常的。');
      console.log(`   响应: ${result.body.substring(0, 300)}`);
      console.log('');
      console.log('💡 提示: Worker 已经部署成功，可以正常使用！');
    } else if (result.status === 404) {
      console.log('⚠️  Worker 返回 404，可能路径配置有问题');
      console.log(`   响应: ${result.body.substring(0, 300)}`);
    } else {
      console.log(`⚠️  Worker 返回状态码: ${result.status}`);
      console.log(`   响应: ${result.body.substring(0, 300)}`);
    }
    
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ 测试完成！');
    console.log('='.repeat(70));
    console.log('');
    console.log('下一步：');
    console.log('1. 确保 .env 文件中的 OPENAI_BASE_URL 已正确配置');
    console.log('2. 重启应用（环境变量只在启动时加载）');
    console.log('3. 尝试扫描模板');
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log('❌ 测试失败');
    console.log(`   错误: ${error.message}`);
    console.log('');
    
    if (error.message.includes('timeout')) {
      console.log('💡 这可能是网络问题。');
      console.log('   建议：在浏览器中直接测试 Worker URL');
      console.log(`   访问: ${WORKER_URL}/v1/models`);
      console.log('   如果浏览器可以访问，说明 Worker 已部署成功！');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('EAI_AGAIN')) {
      console.log('💡 这可能是本地 DNS 问题。');
      console.log('   建议：');
      console.log('   1. 在浏览器中测试 Worker URL');
      console.log(`      访问: ${WORKER_URL}/v1/models`);
      console.log('   2. 检查网络连接');
      console.log('   3. 如果浏览器可以访问，Worker 已成功部署！');
    } else {
      console.log('💡 建议：');
      console.log('   1. 检查 Worker 是否已部署');
      console.log('   2. 在浏览器中测试 Worker URL');
      console.log(`      访问: ${WORKER_URL}/v1/models`);
      console.log('   3. 查看 Cloudflare Workers 控制台');
    }
    
    console.log('');
    console.log('='.repeat(70));
  }
}

runTest();

