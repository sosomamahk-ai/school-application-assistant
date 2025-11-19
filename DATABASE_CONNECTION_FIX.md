# 数据库连接错误修复指南

## 🚨 错误信息

```
Error querying the database: FATAL: Tenant or user not found
```

## 📋 问题诊断

这个错误表示数据库连接配置有问题。请按照以下步骤进行诊断和修复。

## 🔍 第一步：运行诊断脚本

```bash
node scripts/test-db-connection.js
```

这个脚本会：
- ✅ 检查环境变量是否设置
- ✅ 解析连接字符串格式
- ✅ 测试数据库连接
- ✅ 提供针对性的修复建议

## 🔧 第二步：检查环境变量

### 1. 确认 `.env` 文件存在

```bash
# Windows PowerShell
Test-Path .env

# 如果返回 False，需要创建 .env 文件
```

### 2. 检查 DATABASE_URL 格式

`.env` 文件中的 `DATABASE_URL` 应该遵循以下格式：

```env
DATABASE_URL="postgresql://用户名:密码@主机:端口/数据库名?参数"
```

**示例（本地 PostgreSQL）**：
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/school_app"
```

**示例（Supabase - 连接池模式，用于应用运行）**：
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**示例（Supabase - 直接连接模式，用于迁移）**：
```env
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

## 🛠️ 常见问题及解决方案

### 问题 1: 密码包含特殊字符

如果密码包含特殊字符（如 `@`, `#`, `%`, `&` 等），需要进行 URL 编码。

**解决方案**：
1. 使用在线 URL 编码工具编码密码
2. 或者修改数据库密码，使用不包含特殊字符的密码

**示例**：
- 原始密码: `my@pass#123`
- URL 编码后: `my%40pass%23123`
- 连接字符串: `postgresql://postgres:my%40pass%23123@localhost:5432/school_app`

### 问题 2: Supabase 连接配置错误

如果使用 Supabase，需要注意：

1. **应用运行**：使用连接池（端口 6543）
2. **数据库迁移**：使用直接连接（端口 5432）

**完整配置**：

```env
# .env 文件

# 应用连接（使用连接池）
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移连接（使用直接连接）
DIRECT_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:5432/postgres"
```

**获取 Supabase 连接字符串**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击 **Settings** → **Database**
4. 找到 **Connection string** 部分
5. 复制对应的连接字符串（Session mode 或 Transaction mode）

### 问题 3: 数据库用户不存在

如果数据库用户不存在，需要创建用户：

**PostgreSQL 本地数据库**：
```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建用户
CREATE USER appuser WITH PASSWORD 'yourpassword';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE school_app TO appuser;
```

### 问题 4: 数据库不存在

如果数据库不存在，需要创建数据库：

```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建数据库
CREATE DATABASE school_app;

-- 退出
\q
```

### 问题 5: 主机地址或端口错误

检查：
- 主机地址是否正确（localhost 或远程服务器地址）
- 端口是否正确（PostgreSQL 默认端口是 5432）
- 如果是远程数据库，确保防火墙允许连接

## ✅ 验证修复

修复后，运行以下命令验证：

```bash
# 1. 运行诊断脚本
node scripts/test-db-connection.js

# 2. 测试 Prisma 连接
npx prisma db pull

# 3. 如果成功，尝试运行迁移
npx prisma migrate dev
```

## 📝 完整配置示例

### 本地 PostgreSQL

```env
# .env 文件
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/school_app"
OPENAI_API_KEY="sk-your-openai-api-key"
JWT_SECRET="your-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Supabase

```env
# .env 文件
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].pooler.supabase.com:5432/postgres"
OPENAI_API_KEY="sk-your-openai-api-key"
JWT_SECRET="your-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Railway

```env
# .env 文件
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"
OPENAI_API_KEY="sk-your-openai-api-key"
JWT_SECRET="your-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🆘 仍然无法解决？

如果按照上述步骤仍然无法解决问题，请：

1. **检查数据库服务状态**：
   - 确保数据库服务正在运行
   - 检查数据库日志

2. **检查网络连接**：
   - 测试能否 ping 通数据库服务器
   - 检查防火墙设置

3. **查看详细错误日志**：
   ```bash
   # 启用详细日志
   DEBUG=* npm run dev
   ```

4. **联系数据库服务提供商**：
   - 如果是云数据库（Supabase、Railway 等），检查服务状态页面
   - 查看服务提供商的文档

## 📚 相关文档

- [Supabase 迁移修复指南](./SUPABASE_MIGRATION_FIX.md)
- [迁移问题排查指南](./MIGRATION_TROUBLESHOOTING.md)
- [安装指南](./INSTALLATION.md)

