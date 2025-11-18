# Supabase 迁移问题解决方案

## 🚨 问题：Supabase 迁移卡死

你使用的是 **Supabase** 数据库，端口 `6543` 是**连接池端口**，不适合用于迁移操作。

### 原因

- **端口 6543** = Supabase 连接池（Transaction Mode）
- **端口 5432** = Supabase 直接连接（Session Mode）
- Prisma 迁移需要**直接连接**，不能使用连接池

## ✅ 解决方案

### 方法 1: 使用直接连接 URL（推荐）

1. **获取 Supabase 直接连接 URL**：

   - 登录 Supabase Dashboard
   - 进入你的项目
   - 点击 **Settings** → **Database**
   - 找到 **Connection string** 部分
   - 选择 **Session mode**（不是 Transaction mode）
   - 复制连接字符串，格式类似：
     ```
     postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
     ```
     注意端口是 **5432**，不是 6543

2. **更新 `.env` 文件**：

   添加两个环境变量：

   ```env
   # 用于应用运行（可以使用连接池）
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # 用于迁移（必须使用直接连接）
   DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

3. **更新 `prisma/schema.prisma`**：

   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")  // 添加这一行
   }
   ```

4. **运行迁移**：

   ```bash
   npx prisma migrate dev --name add_application_data
   ```

   或者使用 push：

   ```bash
   npx prisma db push
   ```

### 方法 2: 临时修改 DATABASE_URL

如果不想修改 schema，可以临时修改环境变量：

1. **在 `.env` 中临时使用直接连接**：

   ```env
   # 临时改为直接连接（端口 5432）
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

2. **运行迁移**：

   ```bash
   npx prisma migrate dev --name add_application_data
   ```

3. **迁移完成后，改回连接池 URL**（用于应用运行）：

   ```env
   # 改回连接池（端口 6543）
   DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### 方法 3: 使用 Supabase SQL Editor（最简单）

如果迁移工具一直有问题，可以直接在 Supabase 中执行 SQL：

1. **登录 Supabase Dashboard**
2. **进入 SQL Editor**
3. **执行以下 SQL**：

   ```sql
   -- 创建 ApplicationData 表
   CREATE TABLE IF NOT EXISTS "ApplicationData" (
       "id" TEXT NOT NULL,
       "schoolId" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "data" JSONB NOT NULL,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,
       CONSTRAINT "ApplicationData_pkey" PRIMARY KEY ("id")
   );

   -- 创建唯一索引
   CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationData_schoolId_userId_key" 
   ON "ApplicationData"("schoolId", "userId");

   -- 创建索引
   CREATE INDEX IF NOT EXISTS "ApplicationData_schoolId_idx" 
   ON "ApplicationData"("schoolId");

   CREATE INDEX IF NOT EXISTS "ApplicationData_userId_idx" 
   ON "ApplicationData"("userId");
   ```

4. **标记迁移为已应用**：

   ```bash
   # 生成迁移记录
   npx prisma migrate resolve --applied add_application_data
   ```

   或者手动创建迁移记录：

   ```bash
   # 创建迁移文件夹和文件
   mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_application_data
   
   # 创建空的 migration.sql（因为已经在 Supabase 中执行了）
   echo "-- Migration already applied via Supabase SQL Editor" > prisma/migrations/$(date +%Y%m%d%H%M%S)_add_application_data/migration.sql
   ```

5. **生成 Prisma Client**：

   ```bash
   npx prisma generate
   ```

## 🔍 如何获取 Supabase 连接信息

### 获取 Session Mode URL（直接连接）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击 **Settings**（左下角齿轮图标）
4. 点击 **Database**
5. 找到 **Connection string** 部分
6. 选择 **Session mode**（不是 Transaction mode）
7. 复制连接字符串

### 连接字符串格式

**Session Mode（直接连接，用于迁移）**：
```
postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**Transaction Mode（连接池，用于应用）**：
```
postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## 📋 完整配置示例

### `.env` 文件

```env
# 应用连接（使用连接池，性能更好）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移连接（使用直接连接，支持所有 SQL 功能）
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

### `prisma/schema.prisma` 文件

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 应用使用连接池
  directUrl = env("DIRECT_URL")        // 迁移使用直接连接
}
```

## ✅ 验证配置

运行以下命令验证：

```bash
# 1. 检查连接
npx prisma db pull

# 2. 如果成功，运行迁移
npx prisma migrate dev --name add_application_data

# 3. 或者使用 push
npx prisma db push
```

## 🎯 推荐方案

**对于 Supabase，我强烈推荐方法 3（使用 Supabase SQL Editor）**：

1. ✅ 最简单，不会卡死
2. ✅ 直接在 Supabase Dashboard 中执行
3. ✅ 可以立即看到结果
4. ✅ 不需要处理连接池问题

执行 SQL 后，只需要运行：

```bash
npx prisma generate
```

就可以正常使用了！

## 📞 如果还有问题

1. **检查 Supabase 项目状态**：
   - 确认项目没有暂停
   - 检查数据库是否正常运行

2. **检查网络连接**：
   ```bash
   # 测试连接
   psql "postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

3. **检查防火墙**：
   - 确保没有阻止数据库连接

4. **查看 Supabase 日志**：
   - Dashboard → Logs → Database Logs

