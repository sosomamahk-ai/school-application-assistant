# Supabase Session Pooler 连接修复

## 🔍 问题分析

Supabase 提供的连接字符串格式：
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

这个格式是正确的，但需要注意：

1. **Session Pooler** vs **Session Mode**：
   - Session Pooler = 通过连接池的连接（端口 5432，但通过 pooler）
   - Session Mode = 直接连接（端口 5432，不通过 pooler）

2. **认证失败的可能原因**：
   - 密码不正确
   - 需要使用 Session Mode 而不是 Session Pooler
   - 连接池配置问题

## ✅ 解决方案

### 方案 1: 使用 Session Mode（推荐）

Session Pooler 可能不适合 Prisma 的直接连接。尝试使用 **Session Mode**：

1. **在 Supabase Dashboard 中**：
   - Settings → Database → Connection string
   - 找到 **Session mode**（不是 Session pooler）
   - 复制连接字符串

2. **Session Mode 格式应该是**：
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   ```
   或者可能是：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. **更新 .env 文件**：
   ```env
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

### 方案 2: 验证密码并重置

如果多次更换密码仍然失败，可能是：

1. **密码复制问题**：
   - 确保密码没有多余的空格
   - 确保密码完全正确（区分大小写）
   - 如果密码包含特殊字符，可能需要 URL 编码

2. **重置数据库密码**：
   - Settings → Database → Database Password
   - 点击 "Reset database password"
   - **重要**：复制新密码时，确保完全复制，没有遗漏字符
   - 更新 `.env` 文件

3. **测试密码**：
   - 在 Supabase SQL Editor 中尝试连接
   - 如果 SQL Editor 可以连接，说明密码正确，问题在连接字符串格式

### 方案 3: 检查连接字符串的完整性

确保连接字符串完全正确：

1. **检查格式**：
   ```env
   # 正确格式
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   ```

2. **不要添加额外参数**：
   - ❌ 不要添加 `?pgbouncer=true`（这是连接池参数）
   - ❌ 不要添加 `&connection_limit=1`
   - ✅ 直接使用 Supabase 提供的格式

3. **确保引号正确**：
   - 使用双引号 `"` 包裹整个连接字符串
   - 确保没有转义问题

### 方案 4: 尝试不同的主机地址

Supabase 可能提供多个连接选项：

1. **检查 Supabase Dashboard**：
   - Settings → Database → Connection string
   - 查看是否有多个选项：
     - Session mode
     - Session pooler
     - Direct connection
     - Transaction mode
     - Transaction pooler

2. **尝试 Direct connection**：
   - 如果可用，尝试使用 Direct connection
   - 格式可能是：`postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## 📋 推荐的 .env 配置

根据 Supabase 提供的 Session pooler 格式：

```env
# Database - Supabase Session Pooler
# 使用 Supabase 提供的格式（Session pooler）
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT Secret
JWT_SECRET="[YOUR-JWT-SECRET]"

# OpenAI API
OPENAI_API_KEY="[YOUR-OPENAI-API-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**关键点**：
- ✅ 使用 `postgres.[PROJECT-REF]` 格式（项目引用）
- ✅ 端口 5432
- ✅ 不添加额外参数
- ✅ 确保密码完全正确

## 🔧 测试步骤

1. **更新 .env 文件**（使用上面的配置）

2. **验证密码**：
   - 在 Supabase Dashboard 中
   - Settings → Database → Database Password
   - 确认密码是否正确
   - 如果需要，重置密码并更新 `.env`

3. **运行测试**：
   ```bash
   npm run test:supabase
   ```

4. **如果仍然失败**：
   - 尝试使用 Session Mode（不是 Session Pooler）
   - 或者尝试 Direct connection
   - 检查 Supabase 项目状态

## 🆘 如果仍然无法连接

### 选项 1: 使用 Session Mode

在 Supabase Dashboard 中：
- 选择 **Session mode**（不是 Session pooler）
- 复制连接字符串
- 更新 `.env` 文件

### 选项 2: 检查 Supabase 项目

1. **确认项目未暂停**
2. **检查区域设置**（确保与连接字符串中的区域匹配）
3. **查看数据库日志**（Dashboard → Logs → Database Logs）

### 选项 3: 联系 Supabase 支持

提供：
- 项目引用：`[PROJECT-REF]`
- 错误信息：Authentication failed
- 使用的连接字符串格式（隐藏密码）

