# 🔧 修复 .env 文件

## 问题诊断

你的 `.env` 文件有以下问题：

1. ❌ **DATABASE_URL 被定义了两次** - 这会导致环境变量冲突
2. ❌ **第一个 DATABASE_URL 使用了错误的用户名格式** - `postgres.[PROJECT-REF]` 会导致 "Tenant or user not found" 错误

## ✅ 正确的 .env 文件内容

请将你的 `.env` 文件内容替换为以下内容：

```env
# Database - Supabase 连接配置
# 应用连接（使用连接池，端口 6543）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移连接（使用直接连接，端口 5432）
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT Secret for authentication
JWT_SECRET="[YOUR-JWT-SECRET]"

# OpenAI API
OPENAI_API_KEY="[YOUR-OPENAI-API-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔑 关键修复点

### 1. 删除重复的 DATABASE_URL

**错误**（有两个 DATABASE_URL）：
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@..."
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@..."
```

**正确**（只有一个 DATABASE_URL）：
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@..."
```

### 2. 使用正确的用户名格式

**错误格式**：
```
postgres.[PROJECT-REF]:[PASSWORD]@
```

**正确格式**：
```
postgres:[YOUR-PASSWORD]@
```

Supabase 的连接字符串格式应该是：
- ✅ `postgres:[YOUR-PASSWORD]@` （正确）
- ❌ `postgres.[PROJECT-REF]:[PASSWORD]@` （错误）

## 📝 修复步骤

1. **打开 `.env` 文件**

2. **删除第一个 DATABASE_URL**（包含 `postgres.[PROJECT-REF]` 的那个）

3. **保留第二个 DATABASE_URL**（格式正确的那个）

4. **确保 DIRECT_URL 存在**（用于数据库迁移）

5. **保存文件**

6. **重启开发服务器**：
   ```bash
   # 停止当前服务器（Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

## ✅ 验证修复

修复后，运行诊断工具：

```bash
npm run test:db
```

如果看到 "✅ 数据库连接成功！"，说明修复成功！

## 🚨 如果仍然失败

如果修复后仍然出现错误，请检查：

1. **密码是否正确**
   - 确认 Supabase Dashboard 中的数据库密码
   - 如果密码包含特殊字符，可能需要 URL 编码

2. **Supabase 项目状态**
   - 登录 Supabase Dashboard
   - 确认项目未暂停
   - 检查数据库是否正常运行

3. **网络连接**
   - 确保可以访问 Supabase 服务器
   - 检查防火墙设置

4. **重新获取连接字符串**
   - 在 Supabase Dashboard 中
   - Settings → Database → Connection string
   - 选择 **Session mode**
   - 复制新的连接字符串

