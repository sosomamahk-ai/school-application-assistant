# Prisma 迁移问题排查指南

## 🚨 问题：迁移卡死或中断

### 快速解决方案

#### 方案 1: 使用 `db push`（推荐，最快）

如果迁移一直卡死，可以使用 `db push` 直接同步 schema 到数据库：

```bash
# 直接推送 schema 到数据库（不创建迁移文件）
npx prisma db push
```

**优点**：
- 速度快，不会卡死
- 直接同步，无需迁移文件
- 适合开发环境

**缺点**：
- 不会创建迁移历史
- 生产环境建议使用 `migrate`

#### 方案 2: 手动创建迁移文件

如果 `migrate dev` 卡死，可以手动创建迁移：

```bash
# 1. 创建迁移文件（不执行）
npx prisma migrate dev --create-only --name add_application_data

# 2. 检查生成的 SQL 文件
# 文件位置: prisma/migrations/XXXXX_add_application_data/migration.sql

# 3. 手动执行迁移
npx prisma migrate deploy
```

#### 方案 3: 重置迁移状态（开发环境）

⚠️ **警告：这会删除所有数据！仅用于开发环境**

```bash
# 1. 重置数据库（删除所有数据）
npx prisma migrate reset

# 2. 重新运行迁移
npx prisma migrate dev
```

## 🔍 详细排查步骤

### 步骤 1: 检查数据库连接

```bash
# 测试数据库连接
npx prisma db pull
```

如果这个命令也卡死，说明是数据库连接问题。

**解决方案**：
1. 检查 `.env` 文件中的 `DATABASE_URL`
2. 确认数据库服务正在运行
3. 检查网络连接和防火墙

### 步骤 2: 检查是否有未完成的迁移

```bash
# 查看迁移状态
npx prisma migrate status
```

如果显示有未应用的迁移，尝试：

```bash
# 应用待处理的迁移
npx prisma migrate deploy
```

### 步骤 3: 检查数据库锁定

PostgreSQL 可能因为其他连接而锁定。

**解决方案**：

1. **关闭所有数据库连接**：
   - 关闭所有运行的应用（`npm run dev`）
   - 关闭 Prisma Studio（如果有）
   - 关闭其他数据库客户端

2. **检查并终止锁定进程**（PostgreSQL）：

```sql
-- 连接到数据库后运行
SELECT pid, usename, application_name, state, query 
FROM pg_stat_activity 
WHERE datname = 'your_database_name';

-- 如果需要，终止进程
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'your_database_name' AND pid <> pg_backend_pid();
```

### 步骤 4: 使用超时设置

如果迁移因为超时而卡死，可以设置更长的超时：

```bash
# 设置环境变量增加超时时间
set PRISMA_MIGRATE_SKIP_GENERATE=1
npx prisma migrate dev --name add_application_data
```

或者直接修改 `prisma/schema.prisma` 添加连接池配置：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 添加连接池配置
  directUrl = env("DIRECT_URL") // 可选：用于迁移的直连 URL
}
```

## 🛠️ 针对 ApplicationData 模型的迁移

### 方法 A: 使用 db push（最简单）

```bash
# 直接推送，无需迁移文件
npx prisma db push

# 然后生成 Prisma Client
npx prisma generate
```

### 方法 B: 手动创建迁移

1. **创建迁移文件**：

```bash
npx prisma migrate dev --create-only --name add_application_data
```

2. **检查生成的 SQL**：

打开 `prisma/migrations/XXXXX_add_application_data/migration.sql`，应该包含：

```sql
-- CreateTable
CREATE TABLE "ApplicationData" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationData_schoolId_userId_key" ON "ApplicationData"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "ApplicationData_schoolId_idx" ON "ApplicationData"("schoolId");

-- CreateIndex
CREATE INDEX "ApplicationData_userId_idx" ON "ApplicationData"("userId");
```

3. **如果 SQL 正确，应用迁移**：

```bash
npx prisma migrate deploy
```

### 方法 C: 直接在数据库中执行 SQL

如果迁移工具一直有问题，可以直接在数据库中执行 SQL：

1. **连接到数据库**：

```bash
# 使用 psql（PostgreSQL）
psql -h localhost -U your_username -d your_database_name
```

或者使用数据库管理工具（如 pgAdmin、DBeaver 等）

2. **执行 SQL**：

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

3. **标记迁移为已应用**：

```bash
# 创建迁移记录（告诉 Prisma 这个迁移已完成）
npx prisma migrate resolve --applied add_application_data
```

或者手动在 `_prisma_migrations` 表中插入记录。

4. **生成 Prisma Client**：

```bash
npx prisma generate
```

## 📋 完整操作流程（推荐）

### 开发环境推荐流程

```bash
# 1. 使用 db push（最快，不会卡死）
npx prisma db push

# 2. 生成 Prisma Client
npx prisma generate

# 3. 验证
npx prisma studio
```

### 生产环境推荐流程

```bash
# 1. 创建迁移文件（不执行）
npx prisma migrate dev --create-only --name add_application_data

# 2. 检查生成的 SQL 文件
# 文件: prisma/migrations/XXXXX_add_application_data/migration.sql

# 3. 应用迁移
npx prisma migrate deploy

# 4. 生成 Prisma Client
npx prisma generate
```

## 🔧 常见错误和解决方案

### 错误 1: "Migration XXXX failed to apply"

**原因**：迁移文件有问题或数据库状态不一致

**解决方案**：

```bash
# 1. 查看迁移状态
npx prisma migrate status

# 2. 如果迁移失败，标记为已回滚
npx prisma migrate resolve --rolled-back migration_name

# 3. 修复问题后重新应用
npx prisma migrate deploy
```

### 错误 2: "Database is not empty"

**原因**：数据库已有数据，但迁移历史不匹配

**解决方案**：

```bash
# 1. 基线迁移（标记当前数据库状态为基线）
npx prisma migrate resolve --applied baseline

# 2. 然后继续迁移
npx prisma migrate dev
```

### 错误 3: "Connection timeout"

**原因**：数据库连接超时

**解决方案**：

1. **检查数据库 URL**：
   ```env
   # .env 文件
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connect_timeout=10"
   ```

2. **使用连接池**：
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=5"
   ```

3. **检查数据库服务**：
   ```bash
   # PostgreSQL
   pg_isready -h localhost -p 5432
   ```

## ✅ 验证迁移是否成功

### 方法 1: 使用 Prisma Studio

```bash
npx prisma studio
```

打开浏览器，检查 `ApplicationData` 表是否存在。

### 方法 2: 使用数据库客户端

连接到数据库，运行：

```sql
-- PostgreSQL
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'ApplicationData';
```

如果返回结果，说明表已创建。

### 方法 3: 使用代码测试

创建测试文件 `test-migration.js`：

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // 尝试创建一条测试数据
    const result = await prisma.applicationData.create({
      data: {
        schoolId: 'test',
        userId: 'test',
        data: { test: 'data' }
      }
    });
    console.log('✅ 迁移成功！', result);
    
    // 清理测试数据
    await prisma.applicationData.delete({
      where: { id: result.id }
    });
  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
```

运行：
```bash
node test-migration.js
```

## 🎯 针对你的具体情况

根据你的情况（迁移卡死），我建议：

### 立即解决方案

```bash
# 1. 停止所有运行的程序（Ctrl+C）

# 2. 使用 db push（最快，不会卡死）
npx prisma db push

# 3. 生成 Prisma Client
npx prisma generate

# 4. 验证
npx prisma studio
```

### 如果 db push 也卡死

1. **检查数据库连接**：
   ```bash
   npx prisma db pull
   ```

2. **如果连接正常，直接执行 SQL**（见上面的方法 C）

3. **然后标记迁移**：
   ```bash
   npx prisma migrate resolve --applied add_application_data
   npx prisma generate
   ```

## 📞 需要更多帮助？

如果以上方法都不行，请提供：
1. 错误信息（完整输出）
2. 数据库类型和版本
3. `.env` 中的 `DATABASE_URL` 格式（隐藏密码）
4. 迁移命令的输出

