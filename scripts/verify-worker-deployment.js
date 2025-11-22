/**
 * 验证 Cloudflare Worker 部署
 * 使用多种方法测试 Worker 是否可访问
 */

require('dotenv').config();

const WORKER_URL = process.env.OPENAI_BASE_URL || 'https://openai-proxy.sosomamahk.workers.dev';
const API_KEY = process.env.OPENAI_API_KEY;

console.log('='.repeat(70));
console.log('🔍 验证 Cloudflare Worker 部署');
console.log('='.repeat(70));
console.log('');
console.log('配置信息:');
console.log(`  Worker URL: ${WORKER_URL}`);
console.log(`  API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : '(未设置)'}`);
console.log('');

// 使用 node-fetch 测试（如果在 Node.js 18+ 或安装了 node-fetch）
async function testWithFetch() {
  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    
    console.log('测试 1: 使用 fetch 测试 Worker 基本访问...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    try {
      const response = await fetch(`${WORKER_URL}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY || 'test'}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      console.log(`  ✅ Worker 可访问！`);
      console.log(`  状态码: ${response.status}`);
      
      if (response.status === 200 || response.status === 401) {
        console.log('  ✅ Worker 正常响应（401 表示需要有效 API Key，这是正常的）');
        return true;
      } else if (response.status === 404) {
        console.log('  ⚠️  Worker 返回 404，可能路径配置有问题');
        return false;
      } else {
        console.log(`  ⚠️  Worker 返回状态码: ${response.status}`);
        const text = await response.text();
        console.log(`  响应: ${text.substring(0, 200)}`);
        return response.status < 500; // 如果状态码小于 500，说明 Worker 在工作
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

// 使用 dns 模块测试 DNS 解析
async function testDNS() {
  try {
    const dns = require('dns').promises;
    const url = new URL(WORKER_URL);
    
    console.log('测试 2: 测试 DNS 解析...');
    
    try {
      const addresses = await dns.resolve4(url.hostname);
      console.log(`  ✅ DNS 解析成功`);
      console.log(`  IP 地址: ${addresses.join(', ')}`);
      return true;
    } catch (dnsError) {
      console.log(`  ⚠️  DNS 解析失败: ${dnsError.message}`);
      console.log(`  这可能是因为本地网络或 DNS 服务器的问题`);
      console.log(`  但这不一定意味着 Worker 无法访问`);
      return false;
    }
  } catch (error) {
    console.log(`  ⚠️  无法测试 DNS: ${error.message}`);
    return false;
  }
}

async function verifyDeployment() {
  const results = {
    dnsResolved: false,
    workerAccessible: false,
  };

  // 测试 DNS
  results.dnsResolved = await testDNS();
  console.log('');

  // 测试 Worker 访问
  try {
    results.workerAccessible = await testWithFetch();
  } catch (error) {
    console.log('  ❌ Worker 无法访问');
    console.log(`  错误: ${error.message}`);
    
    if (error.message.includes('getaddrinfo EAI_AGAIN') || 
        error.message.includes('ENOTFOUND')) {
      console.log('');
      console.log('  💡 这可能是本地网络或 DNS 的问题');
      console.log('     但 Worker 可能仍然可以在生产环境中正常工作');
      console.log('');
      console.log('  🔧 建议：');
      console.log('     1. 在浏览器中测试 Worker URL');
      console.log(`        访问: ${WORKER_URL}/v1/models`);
      console.log('     2. 检查网络连接');
      console.log('     3. 尝试使用不同的 DNS 服务器（如 8.8.8.8）');
      console.log('     4. 如果浏览器可以访问，说明 Worker 已部署成功');
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('📊 验证结果');
  console.log('='.repeat(70));
  console.log('');

  if (results.workerAccessible) {
    console.log('✅ Worker 验证成功！');
    console.log('');
    console.log('配置已正确，可以开始使用。');
    console.log('');
    console.log('下一步：');
    console.log('1. 确保应用已重启（环境变量只在启动时加载）');
    console.log('2. 尝试扫描模板');
    console.log('3. 如果仍有问题，检查应用日志');
  } else {
    console.log('⚠️  Worker 验证未完全通过');
    console.log('');
    console.log('这可能是因为：');
    console.log('1. 本地网络或 DNS 问题（但 Worker 可能仍然可用）');
    console.log('2. Worker 未正确部署');
    console.log('3. Worker 代码有问题');
    console.log('');
    console.log('🔧 建议操作：');
    console.log('');
    console.log('1. 在浏览器中测试 Worker');
    console.log(`   访问: ${WORKER_URL}/v1/models`);
    console.log('   如果看到 JSON 响应（即使是错误），说明 Worker 在工作');
    console.log('');
    console.log('2. 检查 Cloudflare Workers 控制台');
    console.log('   访问: https://workers.cloudflare.com/');
    console.log('   确认 Worker 状态为 "Active"');
    console.log('   查看 Worker 日志是否有错误');
    console.log('');
    console.log('3. 验证 Worker 代码');
    console.log('   确保已部署 cloudflare-worker-code.js 中的代码');
    console.log('   代码位置: cloudflare-worker-code.js');
    console.log('');
    console.log('4. 如果浏览器可以访问 Worker，即使本地测试失败，');
    console.log('   应用在生产环境中可能仍然可以正常工作。');
  }

  console.log('');
  console.log('='.repeat(70));
}

// 运行验证
verifyDeployment().catch(error => {
  console.error('验证过程出错:', error);
  process.exit(1);
});

