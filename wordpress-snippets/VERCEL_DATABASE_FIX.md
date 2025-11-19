# Vercel 数据库连接失败解决方案

## 问题

在 Vercel 部署的 Next.js 应用中登录时出现 **"Database connection failed"** 错误。

## 快速诊断步骤

### 步骤 1：检查 Vercel 环境变量

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 登录你的账户

2. **进入项目设置**
   - 点击你的项目
   - 进入 **Settings** → **Environment Variables**

3. **检查必需的变量**
   确保以下环境变量都已配置：

   | 变量名 | 必需 | 说明 |
   |--------|------|------|
   | `DATABASE_URL` | ✅ 是 | PostgreSQL 连接字符串 |
   | `JWT_SECRET` | ✅ 是 | JWT 签名密钥 |
   | `OPENAI_API_KEY` | ✅ 是 | OpenAI API 密钥 |
   | `NEXT_PUBLIC_APP_URL` | ⚠️ 可选 | 应用 URL |

4. **检查环境范围**
   - 确保变量设置为 **Production**、**Preview** 和 **Development**
   - 点击每个变量，确保三个环境都勾选

### 步骤 2：验证 DATABASE_URL 格式

`DATABASE_URL` 应该是这样的格式：

```
postgresql://username:password@host:port/database?schema=public
```

**示例（Vercel Postgres）：**
```
postgres://default:xxxxx@xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

**示例（Supabase）：**
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**示例（Railway）：**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### 步骤 3：检查数据库服务状态

#### 如果使用 Vercel Postgres

1. 在 Vercel 项目页面，点击 **Storage**
2. 查看 PostgreSQL 数据库状态
3. 确保数据库是 **Active** 状态
4. 如果显示错误，尝试重启数据库

#### 如果使用 Supabase

1. 登录 [supabase.com](https://supabase.com)
2. 进入你的项目
3. 检查 **Settings** → **Database** → **Connection Pooling**
4. 确保数据库是 **Healthy** 状态

#### 如果使用 Railway

1. 登录 [railway.app](https://railway.app)
2. 查看 PostgreSQL 服务状态
3. 确保服务正在运行

### 步骤 4：重新部署应用

如果环境变量是新添加或修改的：

1. **在 Vercel 项目页面**
2. **进入 Deployments**
3. **点击最新部署旁边的三个点（...）**
4. **选择 "Redeploy"**
5. **等待部署完成**

**重要**：修改环境变量后必须重新部署才能生效！

## 解决方案

### 方案 1：检查并修复 DATABASE_URL（最常见）

#### 如果使用 Vercel Postgres

1. **在 Vercel 项目页面**
   - 点击 **Storage**
   - 点击你的 PostgreSQL 数据库

2. **复制连接字符串**
   - 在 **.env.local** 标签页中
   - 复制 `POSTGRES_URL` 或 `POSTGRES_PRISMA_URL`

3. **添加到环境变量**
   - Settings → Environment Variables
   - 添加或更新 `DATABASE_URL`
   - 使用刚才复制的连接字符串

4. **重要**：如果你使用的是连接池 URL（Pooler URL），确保使用正确的格式：
   - Vercel Postgres 可能需要使用 `POSTGRES_PRISMA_URL`（用于 Prisma）
   - 或 `POSTGRES_URL_NON_POOLING`（直接连接）

#### 如果使用 Supabase

1. **获取连接字符串**
   - Supabase 项目 → Settings → Database
   - 找到 **Connection string**
   - 选择 **URI** 标签
   - 复制连接字符串

2. **替换密码**
   - 将 `[YOUR-PASSWORD]` 替换为你的实际密码

3. **选择正确的连接字符串**
   - **事务模式（Transaction Mode）**：用于 Prisma 迁移
   - **会话模式（Session Mode）**：用于应用连接
   - **连接池（Connection Pooling）**：用于服务器端应用（推荐）

4. **添加到 Vercel**
   - 使用 **Connection Pooling** URL（格式：`postgresql://postgres.xxx:6543/postgres`）

#### 如果使用 Railway

1. **获取连接字符串**
   - Railway 项目 → PostgreSQL 服务
   - 点击 **Variables** 标签
   - 复制 `DATABASE_URL` 或 `POSTGRES_URL`

2. **添加到 Vercel**
   - 确保连接字符串格式正确

### 方案 2：检查 Prisma 配置

#### 检查 `prisma/schema.prisma`

确保 `datasource` 配置正确：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 如果使用 Supabase，需要这个
}
```

#### 如果使用 Supabase，需要 DIRECT_URL

对于 Supabase，需要两个环境变量：

1. **DATABASE_URL**（连接池 URL）
   ```
   postgresql://postgres.xxx:6543/postgres?pgbouncer=true
   ```

2. **DIRECT_URL**（直接连接 URL，用于迁移）
   ```
   postgresql://postgres.xxx:5432/postgres
   ```

在 Vercel 中：
- Settings → Environment Variables
- 添加 `DATABASE_URL`（连接池）
- 添加 `DIRECT_URL`（直接连接）

### 方案 3：验证数据库表是否已创建

确保数据库迁移已运行：

#### 方法 A：通过 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 链接到项目
vercel link

# 拉取环境变量
vercel env pull .env.local

# 运行迁移
npx prisma migrate deploy

# 验证数据库
npx prisma studio
```

#### 方法 B：手动检查数据库

1. **连接到数据库**（使用 pgAdmin 或命令行）
2. **检查表是否存在**：
   ```sql
   \dt
   ```
   应该看到：
   - `User`
   - `UserProfile`
   - `SchoolFormTemplate`
   - `Application`
   - 等等

3. **如果表不存在**，运行迁移：
   ```bash
   DATABASE_URL="your-database-url" npx prisma migrate deploy
   ```

### 方案 4：检查网络连接限制

某些数据库服务可能有连接限制：

1. **检查数据库连接数限制**
   - Vercel Postgres：免费版有连接限制
   - Supabase：免费版连接池有 60 个连接限制
   - Railway：根据套餐不同有限制

2. **使用连接池**
   - 确保使用连接池 URL（不是直接连接）
   - Prisma 默认会管理连接池

### 方案 5：检查防火墙/IP 白名单

某些数据库服务可能需要：

1. **允许 Vercel IP 地址**
   - Vercel 使用动态 IP
   - 某些数据库服务（如 Supabase）默认允许所有连接
   - 如果使用其他服务，可能需要配置 IP 白名单

2. **检查数据库安全设置**
   - Supabase：Settings → Database → Connection Pooling → 确保允许公共连接
   - Railway：通常自动允许

## 调试方法

### 方法 1：查看 Vercel 日志

1. **在 Vercel 项目页面**
2. **点击 "Logs" 标签**
3. **查看最新的部署日志**
4. **查找错误信息**：
   - `P1001` - 无法连接到数据库
   - `P1017` - 服务器关闭了连接
   - `P2002` - 唯一约束违反

### 方法 2：创建测试端点

创建一个测试 API 端点来检查连接：

创建 `src/pages/api/test-db.ts`：

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 测试数据库连接
    await prisma.$connect();
    
    // 执行简单查询
    const count = await prisma.user.count();
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount: count,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
```

然后访问：`https://your-app.vercel.app/api/test-db`

### 方法 3：检查环境变量是否正确加载

创建 `src/pages/api/test-env.ts`（如果还没有）：

访问 `https://your-app.vercel.app/api/test-env` 查看环境变量是否已加载。

## 常见错误及解决方案

### 错误 1: `P1001: Can't reach database server`

**原因**：无法连接到数据库服务器

**解决方案**：
- 检查 `DATABASE_URL` 是否正确
- 检查数据库服务是否正在运行
- 检查网络连接

### 错误 2: `P1017: Server has closed the connection`

**原因**：服务器关闭了连接（通常是连接超时或限制）

**解决方案**：
- 使用连接池 URL 而不是直接连接
- 检查数据库连接数限制
- 确保正确断开连接

### 错误 3: `environment variable "DATABASE_URL" is not set`

**原因**：环境变量未配置

**解决方案**：
- 在 Vercel 中添加 `DATABASE_URL`
- 重新部署应用

### 错误 4: `relation "User" does not exist`

**原因**：数据库表未创建

**解决方案**：
- 运行数据库迁移：`npx prisma migrate deploy`
- 确保迁移已成功完成

## 检查清单

在修复之前，请确认：

- [ ] `DATABASE_URL` 环境变量已在 Vercel 中配置
- [ ] 环境变量已应用到所有环境（Production, Preview, Development）
- [ ] 连接字符串格式正确
- [ ] 数据库服务正在运行
- [ ] 已重新部署应用（修改环境变量后）
- [ ] 数据库表已创建（运行了迁移）
- [ ] 如果使用 Supabase，已配置 `DIRECT_URL`
- [ ] 检查 Vercel 日志中的详细错误信息

## 需要帮助？

如果以上方法都无法解决：

1. **查看 Vercel 日志**：获取详细的错误信息
2. **测试数据库连接**：使用 `psql` 或其他工具测试连接
3. **联系数据库服务提供商**：检查是否有服务中断
4. **查看 Prisma 文档**：https://www.prisma.io/docs

