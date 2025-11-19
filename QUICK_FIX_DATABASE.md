# 🚨 快速修复：数据库连接错误

## 当前问题

```
Error querying the database: FATAL: Tenant or user not found
```

**诊断结果**：
- ✅ 使用 Supabase 数据库
- ✅ 使用连接池模式（端口 6543）
- ❌ 数据库连接失败

## 🔧 快速修复步骤

### 步骤 1: 验证 Supabase 连接字符串

1. **登录 Supabase Dashboard**
   - 访问 https://app.supabase.com
   - 选择你的项目

2. **获取正确的连接字符串**
   - 点击 **Settings** → **Database**
   - 找到 **Connection string** 部分
   - **重要**：选择 **Session mode**（不是 Transaction mode）
   - 复制连接字符串

3. **更新 `.env` 文件**

   将连接字符串添加到 `.env` 文件：

   ```env
   # 应用连接（使用连接池，端口 6543）
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   
   # 迁移连接（使用直接连接，端口 5432）
   DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

   **⚠️ 重要**：
   - 将 `[YOUR-PASSWORD]` 替换为你的实际数据库密码
   - 确保密码中没有特殊字符，或者进行 URL 编码
   - 如果密码包含 `@`, `#`, `%` 等字符，需要进行 URL 编码

### 步骤 2: 检查密码是否正确

**常见问题**：密码可能包含特殊字符导致连接失败

**解决方案**：

1. **方法 A：修改密码（推荐）**
   - 在 Supabase Dashboard 中重置数据库密码
   - 使用只包含字母、数字和基本符号的密码

2. **方法 B：URL 编码密码**
   - 使用在线工具编码密码：https://www.urlencoder.org/
   - 将编码后的密码放入连接字符串

### 步骤 3: 验证连接

运行诊断脚本：

```bash
npm run test:db
```

如果仍然失败，尝试使用直接连接：

```env
# 临时使用直接连接测试
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### 步骤 4: 检查 Supabase 项目状态

1. **确认项目未暂停**
   - 在 Supabase Dashboard 中检查项目状态
   - 确保项目处于活跃状态

2. **检查数据库日志**
   - Dashboard → Logs → Database Logs
   - 查看是否有相关错误信息

3. **验证数据库用户**
   - 确保使用 `postgres` 用户（Supabase 默认）
   - 检查密码是否正确

## 📋 完整配置示例

### `.env` 文件（Supabase）

```env
# 数据库连接
# 应用使用连接池（性能更好）
DATABASE_URL="postgresql://postgres:your_password_here@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移使用直接连接（支持所有 SQL 功能）
DIRECT_URL="postgresql://postgres:your_password_here@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# OpenAI API Key
OPENAI_API_KEY="sk-your-openai-api-key"

# JWT Secret
JWT_SECRET="your-random-secret-key-change-in-production"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### `prisma/schema.prisma` 文件

确保包含 `directUrl`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 应用使用连接池
  directUrl = env("DIRECT_URL")        // 迁移使用直接连接
}
```

## ✅ 验证修复

修复后，按以下步骤验证：

```bash
# 1. 测试数据库连接
npm run test:db

# 2. 如果成功，测试 Prisma
npx prisma db pull

# 3. 启动开发服务器
npm run dev

# 4. 尝试登录
# 访问 http://localhost:3000/auth/login
```

## 🆘 仍然无法解决？

### 选项 1: 重置 Supabase 数据库密码

1. 在 Supabase Dashboard 中
2. Settings → Database → Database Password
3. 点击 "Reset database password"
4. 复制新密码
5. 更新 `.env` 文件中的 `DATABASE_URL` 和 `DIRECT_URL`

### 选项 2: 使用 Supabase SQL Editor 测试

1. 在 Supabase Dashboard 中
2. 打开 SQL Editor
3. 运行简单查询：

```sql
SELECT version();
```

如果这个查询成功，说明数据库连接正常，问题可能在连接字符串配置。

### 选项 3: 检查网络和防火墙

- 确保网络连接正常
- 检查防火墙是否阻止了数据库连接
- 尝试从不同网络环境连接

### 选项 4: 联系 Supabase 支持

如果以上方法都不行，可能是 Supabase 服务端的问题：
- 检查 Supabase 状态页面：https://status.supabase.com/
- 联系 Supabase 支持

## 📚 相关文档

- [详细数据库连接修复指南](./DATABASE_CONNECTION_FIX.md)
- [Supabase 迁移修复指南](./SUPABASE_MIGRATION_FIX.md)
- [迁移问题排查指南](./MIGRATION_TROUBLESHOOTING.md)

