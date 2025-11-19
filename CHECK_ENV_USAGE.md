# 🔍 环境变量自动检查工具使用指南

## 快速开始

运行以下命令自动检查所有环境变量配置：

```bash
npm run check:env
```

## 功能特性

这个工具会自动检查：

✅ **必需环境变量**
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 密钥
- `NEXT_PUBLIC_APP_URL` - 应用 URL

⚠️ **可选环境变量**
- `OPENAI_API_KEY` - OpenAI API 密钥（AI 功能需要）

🔌 **数据库连接测试**
- 自动测试数据库连接
- 检查数据库表是否存在
- 提供连接错误诊断

## 输出示例

### ✅ 所有检查通过

```
════════════════════════════════════════════════════════════
  环境变量配置检查工具
════════════════════════════════════════════════════════════

▶ 检查 DATABASE_URL
──────────────────────────────────────────────────────────
  ✅ DATABASE_URL 已设置且格式正确
  ℹ️  连接字符串: postgresql://user:***...@host:5432/db

▶ 检查 JWT_SECRET
──────────────────────────────────────────────────────────
  ✅ JWT_SECRET 已设置 (64 字符)

▶ 检查 NEXT_PUBLIC_APP_URL
──────────────────────────────────────────────────────────
  ✅ NEXT_PUBLIC_APP_URL 已设置: https://your-app.vercel.app

▶ 检查 OPENAI_API_KEY (可选)
──────────────────────────────────────────────────────────
  ✅ OPENAI_API_KEY 已设置

▶ 测试数据库连接
──────────────────────────────────────────────────────────
  ℹ️  正在连接数据库...
  ℹ️  执行测试查询...
  ✅ 数据库连接成功！
  ℹ️  发现 5 个数据表

════════════════════════════════════════════════════════════
  检查报告
════════════════════════════════════════════════════════════

必需环境变量:
  ✅ DATABASE_URL: 格式正确
  ✅ JWT_SECRET: 已设置，长度 64 字符
  ✅ NEXT_PUBLIC_APP_URL: 已设置，使用 HTTPS

可选环境变量:
  ✅ OPENAI_API_KEY: 已设置且格式正确

总结:
  ✅ 所有检查通过！应用已准备就绪。

下一步建议:
  1. 运行开发服务器: npm run dev
  2. 访问应用并测试功能
```

### ❌ 发现问题

```
════════════════════════════════════════════════════════════
  环境变量配置检查工具
════════════════════════════════════════════════════════════

▶ 检查 DATABASE_URL
──────────────────────────────────────────────────────────
  ❌ DATABASE_URL 未设置
  ℹ️  需要设置 PostgreSQL 数据库连接字符串
  ℹ️  格式: postgresql://user:password@host:port/database

▶ 检查 JWT_SECRET
──────────────────────────────────────────────────────────
  ⚠️  长度不足 (16 字符，建议 ≥32)
  ℹ️  建议重新生成一个更长的密钥

▶ 检查 NEXT_PUBLIC_APP_URL
──────────────────────────────────────────────────────────
  ❌ NEXT_PUBLIC_APP_URL 未设置
  ℹ️  本地开发: http://localhost:3000
  ℹ️  生产环境: https://your-domain.vercel.app

▶ 测试数据库连接
──────────────────────────────────────────────────────────
  ❌ 无法测试：DATABASE_URL 未设置

════════════════════════════════════════════════════════════
  检查报告
════════════════════════════════════════════════════════════

必需环境变量:
  ❌ DATABASE_URL: 未设置 DATABASE_URL
  ⚠️  JWT_SECRET: 长度不足，当前 16 字符，建议至少 32 字符
  ❌ NEXT_PUBLIC_APP_URL: 未设置 NEXT_PUBLIC_APP_URL

总结:
  ❌ 部分环境变量未正确配置
     请根据上述提示修复配置

下一步建议:
  1. 修复缺失或格式错误的环境变量
  2. 重新运行此检查工具验证
```

## 使用方法

### 方法 1: 使用 npm 脚本（推荐）

```bash
npm run check:env
```

### 方法 2: 直接使用 ts-node

```bash
npx ts-node scripts/check-env.ts
```

### 方法 3: 全局安装 ts-node 后运行

```bash
npm install -g ts-node
ts-node scripts/check-env.ts
```

## 检查内容详解

### 1. DATABASE_URL 检查

**检查项：**
- ✅ 是否存在
- ✅ 格式是否正确（应以 `postgresql://` 或 `postgres://` 开头）
- ✅ 是否包含用户名、密码、主机和数据库名
- ✅ 实际数据库连接测试

**常见问题：**
- ❌ 未设置 → 需要添加数据库连接字符串
- ⚠️ 格式错误 → 检查连接字符串格式
- ❌ 连接失败 → 检查数据库服务器是否运行

### 2. JWT_SECRET 检查

**检查项：**
- ✅ 是否存在
- ✅ 长度是否足够（建议 ≥32 字符）

**常见问题：**
- ❌ 未设置 → 需要生成随机密钥
- ⚠️ 长度不足 → 建议重新生成更长的密钥

**生成方法：**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

### 3. NEXT_PUBLIC_APP_URL 检查

**检查项：**
- ✅ 是否存在
- ✅ 格式是否正确（应以 `http://` 或 `https://` 开头）
- ✅ 生产环境是否使用 HTTPS

**常见问题：**
- ❌ 未设置 → 需要设置应用 URL
- ⚠️ 生产环境使用 HTTP → 建议使用 HTTPS

### 4. OPENAI_API_KEY 检查（可选）

**检查项：**
- ✅ 是否存在
- ✅ 格式是否正确（通常以 `sk-` 开头）
- ✅ 长度是否足够

**注意：** 此变量是可选的，但 AI 功能需要它。

### 5. 数据库连接测试

**测试内容：**
- ✅ 能否连接到数据库服务器
- ✅ 能否执行查询
- ✅ 数据库表是否存在

**常见错误：**
- `P1001` - 无法连接到数据库服务器
- 连接超时 - 检查网络和防火墙设置
- 认证失败 - 检查用户名和密码

## 故障排除

### 问题 1: 脚本无法运行

**错误：** `ts-node: command not found`

**解决方案：**
```bash
# 安装 ts-node
npm install -g ts-node

# 或使用 npx
npx ts-node scripts/check-env.ts
```

### 问题 2: 找不到 .env 文件

**说明：** 脚本会自动查找 `.env` 和 `.env.local` 文件。如果都没有，会使用系统环境变量。

**解决方案：**
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，添加环境变量
```

### 问题 3: 数据库连接失败

**可能原因：**
1. 数据库服务器未运行
2. DATABASE_URL 格式错误
3. 网络连接问题
4. 防火墙阻止连接

**解决方案：**
```bash
# 1. 检查数据库是否运行
# PostgreSQL
pg_isready

# 2. 验证 DATABASE_URL 格式
# 格式: postgresql://user:password@host:port/database

# 3. 测试直接连接
psql "postgresql://user:password@host:port/database"
```

## 集成到 CI/CD

可以将此检查工具集成到 CI/CD 流程中：

```yaml
# .github/workflows/check-env.yml
name: Check Environment Variables

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run check:env
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
```

## 高级用法

### 只检查特定变量

修改脚本或创建自定义检查脚本。

### 导出检查结果

可以修改脚本添加 JSON 输出选项：

```bash
npm run check:env > check-results.json
```

## 相关文档

- [环境变量配置指南](./CHECK_VERCEL_ENV_VARS.md)
- [部署指南](./DEPLOYMENT.md)
- [快速开始](./QUICKSTART.md)

---

**提示：** 在部署到生产环境之前，始终运行此检查工具确保所有配置正确！

