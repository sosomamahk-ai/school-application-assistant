# ✅ Supabase 正确配置（IPv4 兼容）

## 🔍 问题分析

根据 Supabase Dashboard：
- ✅ Direct connection 格式：`db.[PROJECT-REF].supabase.co:5432`
- ❌ **Not IPv4 compatible** - 如果你的网络是 IPv4，无法使用 Direct connection
- ✅ **解决方案**：使用 Session Pooler（IPv4 兼容）

## ✅ 正确的 .env 配置

根据 Supabase 的要求和 IPv4 兼容性，使用以下配置：

```env
# Database - Supabase 连接配置

# 应用连接（使用连接池，IPv4 兼容，端口 6543）
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移连接（使用连接池的直接模式，端口 5432，IPv4 兼容）
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT Secret
JWT_SECRET="[YOUR-JWT-SECRET]"

# OpenAI API
OPENAI_API_KEY="[YOUR-OPENAI-API-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔑 关键点

1. **DATABASE_URL**：
   - 使用 `postgres.[PROJECT-REF]` 用户名格式
   - 使用 `pooler.supabase.com` 主机（不是 `db.xxx.supabase.co`）
   - 端口：**6543**（连接池）
   - 参数：`?pgbouncer=true&connection_limit=1`

2. **DIRECT_URL**：
   - 使用 `postgres.[PROJECT-REF]` 用户名格式
   - 使用 `pooler.supabase.com` 主机（不是 `db.xxx.supabase.co`）
   - 端口：**5432**（直接模式，但通过 pooler）
   - 不添加 `pgbouncer` 参数

3. **为什么两个都使用 pooler**：
   - Direct connection (`db.xxx.supabase.co`) 不支持 IPv4
   - Session Pooler (`pooler.supabase.com`) 支持 IPv4
   - 使用 pooler 的 5432 端口可以提供类似直接连接的功能

## 📋 配置步骤

1. **更新 .env 文件**（使用上面的配置）

2. **测试连接**：
   ```bash
   npm run test:supabase
   ```

3. **如果成功，启动开发服务器**：
   ```bash
   npm run dev
   ```

## ⚠️ 重要提示

- **不要使用** `db.[PROJECT-REF].supabase.co`（Direct connection），因为不支持 IPv4
- **必须使用** `pooler.supabase.com`（Session Pooler），因为支持 IPv4
- **用户名格式**：`postgres.[PROJECT-REF]`（不是 `postgres`）

## 🆘 如果仍然失败

如果使用上面的配置仍然失败，可能是：

1. **密码问题**：
   - 在 Supabase Dashboard 中重置数据库密码
   - 更新 `.env` 文件中的密码

2. **网络问题**：
   - 检查防火墙设置
   - 尝试从不同网络连接

3. **Supabase 项目问题**：
   - 检查项目状态
   - 查看数据库日志

