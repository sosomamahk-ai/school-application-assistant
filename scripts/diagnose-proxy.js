/**
 * 自动诊断和修复代理连接问题
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const WORKER_URL = process.env.OPENAI_BASE_URL || process.env.OPENAI_PROXY_URL || 'https://openai-proxy.sosomamahk.workers.dev';
const API_KEY = process.env.OPENAI_API_KEY || 'test-key';

console.log('='.repeat(70));
console.log('🔍 自动诊断代理连接问题');
console.log('='.repeat(70));
console.log('');
console.log('配置信息:');
console.log(`  Worker URL: ${WORKER_URL}`);
console.log(`  API Key: ${API_KEY.substring(0, 10)}...`);
console.log('');

// 测试函数
async function testConnection(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 30000,
    };

    const req = client.request(reqOptions, (res) => {
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

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function diagnose() {
  const results = {
    workerAccessible: false,
    workerResponds: false,
    apiRequestWorks: false,
    errors: [],
  };

  // 测试 1: Worker 基本访问
  console.log('测试 1: 检查 Worker 是否可访问...');
  try {
    const response = await testConnection(`${WORKER_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });

    results.workerAccessible = true;
    console.log(`  ✅ Worker 可访问`);
    console.log(`  状态码: ${response.status}`);
    
    if (response.status === 200 || response.status === 401) {
      results.workerResponds = true;
      console.log(`  ✅ Worker 正常响应`);
    } else if (response.status === 404) {
      console.log(`  ⚠️  Worker 返回 404，可能路径不正确`);
      results.errors.push('Worker 返回 404，检查路径配置');
    } else {
      console.log(`  ⚠️  Worker 返回异常状态: ${response.status}`);
      results.errors.push(`Worker 返回状态码: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Worker 无法访问: ${error.message}`);
    results.errors.push(`Worker 连接失败: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log(`  💡 建议: 检查 Worker URL 是否正确`);
    } else if (error.message.includes('timeout')) {
      console.log(`  💡 建议: Worker 响应超时，检查 Cloudflare Workers 状态`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(`  💡 建议: 连接被拒绝，Worker 可能未部署或已停止`);
    }
  }

  console.log('');

  // 测试 2: 实际的 API 请求
  if (results.workerAccessible) {
    console.log('测试 2: 测试实际的 API 请求...');
    try {
      const response = await testConnection(`${WORKER_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "test"' }],
          max_tokens: 5,
        }),
      });

      console.log(`  状态码: ${response.status}`);
      
      if (response.status === 200) {
        results.apiRequestWorks = true;
        console.log(`  ✅ API 请求成功！`);
        try {
          const data = JSON.parse(response.body);
          console.log(`  响应: ${data.choices?.[0]?.message?.content || 'N/A'}`);
        } catch (e) {
          console.log(`  响应体: ${response.body.substring(0, 200)}`);
        }
      } else if (response.status === 401) {
        console.log(`  ⚠️  API Key 无效或未授权`);
        results.errors.push('API Key 可能无效');
        console.log(`  响应: ${response.body.substring(0, 200)}`);
      } else {
        console.log(`  ⚠️  API 请求失败: ${response.status}`);
        results.errors.push(`API 请求返回状态码: ${response.status}`);
        console.log(`  响应: ${response.body.substring(0, 300)}`);
      }
    } catch (error) {
      console.log(`  ❌ API 请求失败: ${error.message}`);
      results.errors.push(`API 请求失败: ${error.message}`);
    }
  }

  console.log('');

  // 诊断结果和建议
  console.log('='.repeat(70));
  console.log('📊 诊断结果');
  console.log('='.repeat(70));
  console.log('');
  
  if (results.workerAccessible && results.workerResponds && results.apiRequestWorks) {
    console.log('✅ 所有测试通过！代理配置正常。');
    console.log('');
    console.log('如果应用仍然报错，请检查：');
    console.log('1. 应用是否已重启（环境变量只在启动时加载）');
    console.log('2. .env 文件中的 OPENAI_BASE_URL 是否正确');
    console.log('3. 查看应用日志中的详细错误信息');
  } else {
    console.log('❌ 发现问题：');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
    console.log('🔧 修复建议：');
    
    if (!results.workerAccessible) {
      console.log('');
      console.log('1. 检查 Worker URL 是否正确');
      console.log(`   当前配置: ${WORKER_URL}`);
      console.log('   确保 URL 格式为: https://your-worker.workers.dev');
      console.log('   不要包含 /v1 路径');
      console.log('');
      console.log('2. 检查 Cloudflare Workers 是否已部署');
      console.log('   访问: https://workers.cloudflare.com/');
      console.log('   确认 Worker 状态为 "Active"');
      console.log('');
      console.log('3. 测试 Worker 直接访问');
      console.log(`   在浏览器中访问: ${WORKER_URL}/v1/models`);
      console.log('   应该看到 JSON 响应或错误消息');
    }
    
    if (results.workerAccessible && !results.apiRequestWorks) {
      console.log('');
      console.log('1. 检查 Worker 代码是否正确');
      console.log('   参考: docs/CLOUDFLARE_WORKER_FIX.md');
      console.log('   确保代码已正确部署');
      console.log('');
      console.log('2. 检查 API Key 是否有效');
      console.log('   访问: https://platform.openai.com/api-keys');
      console.log('   确认 API Key 有效且有余额');
      console.log('');
      console.log('3. 查看 Cloudflare Workers 日志');
      console.log('   在 Workers 控制台查看实时日志');
      console.log('   查找错误消息');
    }
  }

  console.log('');
  console.log('='.repeat(70));
  
  // 生成修复代码
  if (!results.workerAccessible || !results.apiRequestWorks) {
    console.log('');
    console.log('📝 推荐的 Worker 代码（如果 Worker 代码有问题）:');
    console.log('='.repeat(70));
    console.log(`
export default {
  async fetch(request, env) {
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    
    if (!url.pathname.startsWith('/v1/')) {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = \`https://api.openai.com\${url.pathname}\${url.search}\`;
    const headers = new Headers();
    
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host' && 
          key.toLowerCase() !== 'cf-ray' &&
          key.toLowerCase() !== 'cf-connecting-ip') {
        headers.set(key, value);
      }
    }
    
    headers.set('Host', 'api.openai.com');

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });

      const responseBody = await response.text();
      
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
    `);
    console.log('='.repeat(70));
  }
}

// 运行诊断
diagnose().catch(error => {
  console.error('诊断过程出错:', error);
  process.exit(1);
});

