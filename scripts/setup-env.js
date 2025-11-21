/**
 * 环境变量快速设置工具
 * 帮助用户创建 .env 文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64');
}

function main() {
  log('\n🔧 环境变量设置工具', 'blue');
  log('='.repeat(50), 'blue');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // 检查是否已存在 .env 文件
  if (fs.existsSync(envPath)) {
    log('\n⚠️  .env 文件已存在', 'yellow');
    log('  如果要重新创建，请先删除现有的 .env 文件', 'yellow');
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\n是否要覆盖现有文件？(y/N): ', (answer) => {
      if (answer.toLowerCase() !== 'y') {
        log('\n已取消操作', 'yellow');
        rl.close();
        return;
      }
      createEnvFile(envPath);
      rl.close();
    });
  } else {
    createEnvFile(envPath);
  }
  
  // 创建 .env.example 文件
  if (!fs.existsSync(envExamplePath)) {
    createEnvExample(envExamplePath);
  }
}

function createEnvFile(envPath) {
  log('\n📝 创建 .env 文件...', 'cyan');
  
  const jwtSecret = generateJWTSecret();
  
  const envContent = `# 数据库连接字符串
# 格式: postgresql://用户名:密码@主机:端口/数据库名
# 示例: postgresql://postgres:password@localhost:5432/school_app
# 如果使用 Supabase: 在 Supabase Dashboard → Settings → Database → Connection String 获取
DATABASE_URL=""

# JWT 密钥（用于用户认证）
# 已自动生成，请保存好此密钥
JWT_SECRET="${jwtSecret}"

# OpenAI API Key（可选，用于 AI 功能）
# 获取方式: https://platform.openai.com/api-keys
OPENAI_API_KEY=""

# 应用 URL（生产环境部署后填写）
# 示例: https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=""
`;

  fs.writeFileSync(envPath, envContent, 'utf-8');
  
  log('  ✅ .env 文件已创建', 'green');
  log(`\n📋 已自动生成 JWT_SECRET: ${jwtSecret}`, 'cyan');
  log('\n⚠️  重要提示:', 'yellow');
  log('  1. DATABASE_URL 需要手动填写', 'yellow');
  log('  2. 如果使用 Supabase，请从 Supabase Dashboard 获取连接字符串', 'yellow');
  log('  3. 如果使用本地数据库，格式为: postgresql://postgres:password@localhost:5432/school_app', 'yellow');
  log('  4. .env 文件已添加到 .gitignore，不会被提交到 Git', 'yellow');
  
  log('\n📖 下一步:', 'cyan');
  log('  1. 编辑 .env 文件，填写 DATABASE_URL', 'cyan');
  log('  2. 运行: npm run diagnose:schools 验证配置', 'cyan');
  log('  3. 运行: npx prisma migrate deploy 执行数据库迁移', 'cyan');
}

function createEnvExample(envExamplePath) {
  const exampleContent = `# 数据库连接字符串
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_app"

# JWT 密钥（用于用户认证）
JWT_SECRET="your-jwt-secret-here"

# OpenAI API Key（可选，用于 AI 功能）
OPENAI_API_KEY="sk-your-openai-api-key"

# 应用 URL（生产环境部署后填写）
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
`;

  fs.writeFileSync(envExamplePath, exampleContent, 'utf-8');
  log('  ✅ .env.example 文件已创建', 'green');
}

main();

