# Vercel 环境变量检查清单

## ✅ 数据库连接正常

你提供的 PostgreSQL 版本信息表明数据库是可以访问的。这意味着：
- ✅ Supabase 数据库正在运行
- ✅ 数据库服务正常
- ⚠️ 问题可能在 Vercel 环境变量配置

## 🔍 需要检查的事项

### 1. Vercel 环境变量配置

#### 检查 DATABASE_URL

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 进入你的项目

2. **检查环境变量**
   - Settings → Environment Variables
   - 找到 `DATABASE_URL`

3. **验证连接字符串格式**
   应该是这样的格式：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

4. **检查关键部分**：
   - ✅ 包含 `postgres.` 前缀
   - ✅ 包含项目引用（project-ref）
   - ✅ 密码已正确替换（不是 `[YOUR-PASSWORD]`）
   - ✅ 端口是 `6543`（连接池）或 `5432`（直接连接）
   - ✅ 包含 `?pgbouncer=true`（如果使用连接池）
   - ✅ 数据库名是 `postgres`

#### 检查 DIRECT_URL（如果使用）

1. **找到 `DIRECT_URL` 环境变量**
   - 用于 Prisma 迁移
   - 格式应该类似：
   ```
   postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.supabase.co:5432/postgres
   ```
   - 注意：主机名可能是 `supabase.co` 而不是 `pooler.supabase.com`
   - 端口是 `5432`（直接连接）

### 2. 环境变量范围

确保环境变量应用到正确的环境：

- [ ] **Production** ✅
- [ ] **Preview** ✅
- [ ] **Development** ✅（可选）

**重要**：如果环境变量只应用到 Production，Preview 部署可能会失败。

### 3. 重新部署应用

**最关键**：修改环境变量后必须重新部署！

1. **在 Vercel 项目页面**
2. **Deployments** 标签
3. **找到最新部署**
4. **点击三个点（...）**
5. **选择 "Redeploy"**
6. **等待部署完成**

### 4. 验证环境变量是否加载

创建一个测试 API 来检查环境变量是否正确加载：

**创建 `src/pages/api/test-env.ts`**：

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(200).json({
    databaseUrl: process.env.DATABASE_URL 
      ? (isDev ? process.env.DATABASE_URL : 'Set ✓ (hidden in production)')
      : 'Not set ✗',
    directUrl: process.env.DIRECT_URL 
      ? (isDev ? process.env.DIRECT_URL : 'Set ✓ (hidden in production)')
      : 'Not set ✗',
    jwtSecret: process.env.JWT_SECRET ? 'Set ✓' : 'Not set ✗',
    openaiKey: process.env.OPENAI_API_KEY ? 'Set ✓' : 'Not set ✗',
    env: process.env.NODE_ENV,
  });
}
```

然后访问：`https://your-app.vercel.app/api/test-env`

**注意**：在 Production 环境中，出于安全考虑，不会显示实际的连接字符串值。

## 🔧 获取正确的 Supabase 连接字符串

### 方法 1：从 Supabase 控制台

1. **登录 Supabase**
2. **进入你的项目**
3. **Settings** → **Database**
4. **Connection string** 部分

5. **对于应用连接（DATABASE_URL）**：
   - 选择 **Connection Pooling** 标签
   - 选择 **Transaction mode**
   - 选择 **URI** 格式
   - 复制连接字符串
   - 格式类似：`postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

6. **对于迁移（DIRECT_URL）**：
   - 选择 **Session mode** 或 **Transaction mode**（不是 Connection Pooling）
   - 选择 **URI** 格式
   - 复制连接字符串
   - 格式类似：`postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.supabase.co:5432/postgres`

### 方法 2：验证连接字符串

在本地或 Supabase SQL Editor 中测试连接：

```bash
# 测试连接池 URL（端口 6543）
psql "postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 测试直接连接 URL（端口 5432）
psql "postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.supabase.co:5432/postgres"
```

## 🚨 常见错误和解决方案

### 错误 1：环境变量未设置

**症状**：
- `DATABASE_URL` 返回 `Not set`

**解决方案**：
1. 在 Vercel 中添加 `DATABASE_URL`
2. 确保应用到所有需要的环境
3. **重新部署应用**

### 错误 2：连接字符串格式错误

**症状**：
- 连接失败
- 错误代码：P1001

**解决方案**：
1. 从 Supabase 重新获取连接字符串
2. 确保格式正确
3. 检查是否包含 `?pgbouncer=true`（如果使用连接池）
4. 确保密码已正确替换

### 错误 3：环境变量已设置但未生效

**症状**：
- 环境变量显示已设置
- 但应用仍然无法连接

**解决方案**：
1. **重新部署应用**（最关键！）
2. 确保环境变量应用到正确的环境（Production/Preview）
3. 清除构建缓存（如果有）
4. 强制重新构建

### 错误 4：使用错误的连接字符串类型

**症状**：
- 应用连接失败，但迁移可能成功（或反之）

**解决方案**：
- 应用连接：使用 **Connection Pooling** URL（端口 6543）
- Prisma 迁移：使用 **DIRECT_URL**（直接连接，端口 5432）

## ✅ 完整验证清单

在修复之前，确认：

- [ ] Supabase 项目是 **Active** 状态（不是 Paused）
- [ ] 数据库可以访问（已验证：`SELECT version();` 成功）
- [ ] `DATABASE_URL` 在 Vercel 中已配置
- [ ] `DATABASE_URL` 格式正确（包含完整连接字符串）
- [ ] `DATABASE_URL` 使用连接池 URL（端口 6543，包含 `?pgbouncer=true`）
- [ ] `DIRECT_URL` 已配置（用于 Prisma 迁移）
- [ ] `DIRECT_URL` 使用直接连接 URL（端口 5432）
- [ ] 环境变量应用到所有需要的环境（Production, Preview）
- [ ] **已重新部署 Vercel 应用**（修改环境变量后）
- [ ] 数据库表已创建（运行了迁移）
- [ ] Prisma schema 包含 `directUrl` 配置

## 🔍 调试步骤

### 步骤 1：检查环境变量

1. 访问 `https://your-app.vercel.app/api/test-env`
2. 查看哪些环境变量已设置
3. 如果 `DATABASE_URL` 显示 `Not set`，需要添加

### 步骤 2：验证连接字符串

1. 从 Supabase 复制连接字符串
2. 在 Supabase SQL Editor 中测试
3. 或在本地使用 `psql` 测试
4. 确保可以连接

### 步骤 3：更新 Vercel 环境变量

1. 将正确的连接字符串添加到 Vercel
2. 确保应用到 Production 和 Preview
3. 保存

### 步骤 4：重新部署

1. **Deployments** → 最新部署 → **Redeploy**
2. 等待部署完成
3. 检查部署日志，确认没有错误

### 步骤 5：测试连接

1. 尝试登录应用
2. 查看 Vercel 日志，确认连接成功
3. 如果仍有错误，检查日志中的详细错误信息

## 📝 需要的信息

如果问题仍然存在，请提供：

1. **Vercel 环境变量配置**（隐藏敏感信息）：
   - `DATABASE_URL` 是否已设置？
   - `DIRECT_URL` 是否已设置？
   - 应用到哪些环境？

2. **连接字符串格式**（隐藏密码）：
   - 主机名是否正确？
   - 端口是否正确？
   - 是否包含 `?pgbouncer=true`？

3. **部署信息**：
   - 修改环境变量后是否重新部署？
   - 部署是否成功？

4. **错误日志**：
   - 最新的 Vercel 日志错误信息

