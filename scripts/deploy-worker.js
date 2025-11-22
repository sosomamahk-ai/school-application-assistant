/**
 * 自动部署 Cloudflare Worker 脚本
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(70));
console.log('🚀 Cloudflare Worker 部署脚本');
console.log('='.repeat(70));
console.log('');

const workerDir = path.join(__dirname, '..', 'worker');

// 检查 Worker 目录是否存在
if (!fs.existsSync(workerDir)) {
  console.error('❌ Worker 目录不存在！');
  console.error(`   路径: ${workerDir}`);
  console.error('   请先创建 Worker 项目');
  process.exit(1);
}

// 检查必要文件
const indexFile = path.join(workerDir, 'index.js');
const wranglerFile = path.join(workerDir, 'wrangler.toml');

if (!fs.existsSync(indexFile)) {
  console.error('❌ index.js 文件不存在！');
  console.error(`   路径: ${indexFile}`);
  process.exit(1);
}

if (!fs.existsSync(wranglerFile)) {
  console.error('❌ wrangler.toml 文件不存在！');
  console.error(`   路径: ${wranglerFile}`);
  process.exit(1);
}

console.log('✅ Worker 文件检查通过');
console.log(`   工作目录: ${workerDir}`);
console.log(`   Worker 文件: ${indexFile}`);
console.log(`   配置文件: ${wranglerFile}`);
console.log('');

// 检查 Wrangler 是否已登录
console.log('检查 Wrangler 登录状态...');
try {
  execSync('wrangler whoami', { stdio: 'pipe', cwd: workerDir });
  console.log('✅ Wrangler 已登录');
  console.log('');
} catch (error) {
  console.log('⚠️  Wrangler 未登录，需要先登录');
  console.log('');
  console.log('请先运行以下命令登录 Cloudflare：');
  console.log('   wrangler login');
  console.log('');
  console.log('这会打开浏览器让您授权 Cloudflare Workers 访问。');
  console.log('');
  console.log('按 Enter 继续登录，或 Ctrl+C 取消...');
  console.log('');
  
  try {
    execSync('wrangler login', { stdio: 'inherit', cwd: workerDir });
    console.log('✅ 登录成功！');
    console.log('');
  } catch (loginError) {
    console.error('❌ 登录失败，请手动运行: wrangler login');
    process.exit(1);
  }
}

// 部署 Worker
console.log('='.repeat(70));
console.log('📦 开始部署 Worker...');
console.log('='.repeat(70));
console.log('');

try {
  console.log('执行部署命令: wrangler deploy');
  console.log('');
  
  execSync('wrangler deploy', {
    stdio: 'inherit',
    cwd: workerDir,
    env: {
      ...process.env,
    },
  });
  
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Worker 部署成功！');
  console.log('='.repeat(70));
  console.log('');
  console.log('Worker URL: https://openai-proxy.sosomamahk.workers.dev');
  console.log('');
  console.log('下一步：');
  console.log('1. 确保 .env 文件中已设置 OPENAI_BASE_URL');
  console.log('   格式: OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev');
  console.log('2. 运行配置更新脚本: npm run update:openai-config');
  console.log('3. 验证部署: npm run verify:worker');
  console.log('4. 重启应用以加载新的环境变量');
  console.log('');
  
} catch (error) {
  console.error('');
  console.error('❌ 部署失败！');
  console.error('');
  console.error('可能的原因：');
  console.error('1. Wrangler 未登录或登录已过期');
  console.error('2. 网络连接问题');
  console.error('3. Cloudflare 账户权限问题');
  console.error('');
  console.error('解决方案：');
  console.error('1. 运行: wrangler login');
  console.error('2. 检查网络连接');
  console.error('3. 查看上面的错误信息');
  console.error('');
  process.exit(1);
}

