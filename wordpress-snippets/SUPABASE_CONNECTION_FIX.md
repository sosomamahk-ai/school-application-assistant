# Supabase 数据库连接失败解决方案

## 错误信息

```
PrismaClientInitializationError: Can't reach database server at `aws-1-ap-south-1.pooler.supabase.com:6543`
Error Code: P1001
```

## 问题分析

错误代码 `P1001` 表示无法连接到数据库服务器。对于 Supabase，可能的原因：

1. **Supabase 项目被暂停**（免费版会自动暂停）
2. **连接字符串配置错误**
3. **数据库连接设置问题**
4. **网络连接问题**
5. **Supabase 服务临时不可用**

## 🔥 立即解决方案

### 步骤 1：检查 Supabase 项目状态

1. **登录 Supabase**
   - 访问 [supabase.com](https://supabase.com)
   - 登录你的账户

2. **检查项目状态**
   - 进入你的项目
   - 查看项目是否显示 **"Paused"** 或 **"Active"**

3. **如果项目已暂停**
   - 免费版项目在 7 天不活动后会自动暂停
   - 点击 **"Restore"** 或 **"Resume"** 按钮恢复项目
   - 等待 1-2 分钟让项目完全恢复

### 步骤 2：验证连接字符串

#### 获取正确的连接字符串

1. **在 Supabase 项目中**
   - Settings → Database
   - 找到 **Connection string** 部分

2. **选择正确的连接字符串**
   - **Session mode**：用于 Prisma 迁移（端口 5432）
   - **Transaction mode**：用于 Prisma 迁移（端口 5432）
   - **Connection Pooling**：用于应用连接（端口 6543）- **推荐用于 Vercel**

3. **复制连接字符串**
   - 选择 **Connection Pooling** 标签
   - 选择 **Transaction mode**（用于 Prisma）
   - 复制 URI 格式的连接字符串

#### 连接字符串格式

应该类似于：
```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

或：
```
postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**重要注意事项**：
- ✅ 端口应该是 `6543`（连接池）或 `5432`（直接连接）
- ✅ 包含 `?pgbouncer=true` 参数（如果使用连接池）
- ✅ 密码部分需要替换为实际密码

### 步骤 3：配置 Vercel 环境变量

#### 如果使用连接池（推荐）

在 Vercel 中设置：

1. **DATABASE_URL**（连接池 URL）
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **DIRECT_URL**（直接连接 URL，用于迁移）
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.supabase.co:5432/postgres
   ```

**注意**：
- 端口 `6543` = 连接池（用于应用）
- 端口 `5432` = 直接连接（用于迁移）
- 主机名可能不同：`pooler.supabase.com` vs `supabase.co`

#### 更新 Prisma schema

确保 `prisma/schema.prisma` 配置正确：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 连接池 URL
  directUrl = env("DIRECT_URL")        // 直接连接 URL（用于迁移）
}
```

### 步骤 4：重新部署 Vercel 应用

1. **在 Vercel 项目页面**
2. **Deployments** → 最新部署 → 三个点 → **Redeploy**
3. **等待部署完成**

**重要**：修改环境变量后必须重新部署！

### 步骤 5：测试数据库连接

#### 方法 1：使用 Supabase SQL Editor

1. **在 Supabase 项目中**
2. **SQL Editor** → **New query**
3. **运行测试查询**：
   ```sql
   SELECT version();
   ```
4. **如果查询成功**，说明数据库正常运行

#### 方法 2：使用 Vercel 测试端点

创建测试 API：`src/pages/api/test-db.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount: count,
      databaseUrl: process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗'
    });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
```

访问：`https://your-app.vercel.app/api/test-db`

## 🛠️ 常见问题和解决方案

### 问题 1：Supabase 项目已暂停

**症状**：
- 错误代码：P1001
- 无法连接到数据库

**解决方案**：
1. 登录 Supabase
2. 找到暂停的项目
3. 点击 **"Restore"** 恢复项目
4. 等待项目完全恢复（1-2 分钟）
5. 重新测试连接

### 问题 2：连接字符串格式错误

**症状**：
- 错误代码：P1001
- 无法连接到特定主机

**解决方案**：
1. 检查连接字符串是否包含正确的：
   - ✅ 主机名（`aws-0-ap-south-1.pooler.supabase.com` 或 `aws-1-ap-south-1.pooler.supabase.com`）
   - ✅ 端口（连接池：`6543`，直接连接：`5432`）
   - ✅ 数据库名（通常是 `postgres`）
   - ✅ 密码（已替换 `[YOUR-PASSWORD]`）

2. **验证连接字符串格式**：
   ```bash
   # 在本地测试连接
   psql "postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### 问题 3：缺少 DIRECT_URL（用于迁移）

**症状**：
- 迁移失败
- 错误提到需要 directUrl

**解决方案**：
1. **在 Supabase 中获取直接连接字符串**
   - Settings → Database
   - Connection string → Session mode 或 Transaction mode
   - 使用端口 `5432` 的 URL

2. **添加到 Vercel 环境变量**
   - 添加 `DIRECT_URL` 变量
   - 使用直接连接 URL（端口 5432）

3. **更新 Prisma schema**：
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")  // 添加这一行
   }
   ```

### 问题 4：网络连接问题

**症状**：
- 间歇性连接失败
- 超时错误

**解决方案**：
1. **检查 Supabase 服务状态**
   - 访问 [status.supabase.com](https://status.supabase.com)
   - 查看是否有服务中断

2. **检查数据库连接限制**
   - Supabase 免费版：60 个连接池连接
   - 如果达到限制，需要升级或优化连接

3. **使用连接池**
   - 确保使用连接池 URL（端口 6543）
   - 不要使用直接连接（除非迁移）

### 问题 5：Prisma Client 未正确生成

**症状**：
- 连接成功但查询失败
- 类型错误

**解决方案**：
1. **在 Vercel 构建命令中确保生成 Prisma Client**
   
   检查 `package.json`：
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "build": "prisma generate && next build"
     }
   }
   ```

2. **在本地运行**：
   ```bash
   npx prisma generate
   ```

## ✅ 验证清单

修复前请确认：

- [ ] Supabase 项目状态是 **Active**（不是 Paused）
- [ ] `DATABASE_URL` 环境变量已配置（连接池 URL，端口 6543）
- [ ] `DIRECT_URL` 环境变量已配置（直接连接 URL，端口 5432）- 如果需要迁移
- [ ] 连接字符串格式正确
- [ ] 密码已替换（不是 `[YOUR-PASSWORD]`）
- [ ] Prisma schema 包含 `directUrl`（如果使用）
- [ ] 环境变量已应用到所有环境（Production, Preview, Development）
- [ ] **已重新部署 Vercel 应用**
- [ ] 数据库表已创建（运行了迁移）

## 🔍 诊断步骤

### 步骤 1：检查 Supabase 项目

1. 登录 Supabase
2. 检查项目是否 Active
3. 如果暂停，恢复项目

### 步骤 2：获取正确的连接字符串

1. Settings → Database → Connection string
2. 选择 Connection Pooling（Transaction mode）
3. 复制完整的 URI

### 步骤 3：验证 Vercel 环境变量

1. Vercel 项目 → Settings → Environment Variables
2. 检查 `DATABASE_URL` 是否正确
3. 检查 `DIRECT_URL` 是否配置（如果需要）

### 步骤 4：测试连接

1. 使用 Supabase SQL Editor 测试
2. 或创建测试 API 端点
3. 查看 Vercel 日志

### 步骤 5：重新部署

1. 修改环境变量后
2. 重新部署应用
3. 等待部署完成
4. 测试登录功能

## 📞 需要更多帮助？

如果问题仍然存在：

1. **检查 Supabase 日志**：在 Supabase 项目中查看日志
2. **查看 Vercel 日志**：获取更详细的错误信息
3. **联系 Supabase 支持**：如果项目持续无法恢复
4. **考虑切换到其他数据库服务**：
   - Vercel Postgres（最简单）
   - Railway PostgreSQL
   - Neon PostgreSQL

