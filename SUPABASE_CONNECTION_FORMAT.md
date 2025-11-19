# 🔧 Supabase 连接字符串格式指南

## ❌ 您当前的格式（有问题）

```
postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**问题：**
- ✅ 用户名格式正确：`postgres.zlydqxbbrmqhpzjheatx`
- ✅ 主机名正确：`aws-1-ap-south-1.pooler.supabase.com`
- ❌ **端口错误**：使用了 `5432`，但 pooler 应该使用 `6543`
- ❌ **缺少参数**：应该添加 `?pgbouncer=true`

## ✅ 正确的格式

### 选项 1: 使用 Session Pooler（推荐用于生产环境）

```
postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**关键点：**
- 端口：**6543**（不是 5432）
- 参数：`?pgbouncer=true`
- 用户名：`postgres.zlydqxbbrmqhpzjheatx`（包含项目引用）

### 选项 2: 使用直接连接（推荐用于迁移和开发）

```
postgresql://postgres:[password]@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres
```

**关键点：**
- 主机：`db.zlydqxbbrmqhpzjheatx.supabase.co`（不是 pooler 地址）
- 端口：**5432**
- 用户名：`postgres`（不包含项目引用）
- 不需要 `?pgbouncer=true` 参数

## 📋 格式对比

| 类型 | 主机 | 端口 | 用户名 | 参数 |
|------|------|------|--------|------|
| **Session Pooler** | `aws-1-ap-south-1.pooler.supabase.com` | **6543** | `postgres.zlydqxbbrmqhpzjheatx` | `?pgbouncer=true` |
| **直接连接** | `db.zlydqxbbrmqhpzjheatx.supabase.co` | **5432** | `postgres` | 无 |

## 🔧 修复步骤

### 方法 1: 修复 Session Pooler 连接（推荐）

1. **更新连接字符串**
   ```
   postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **在 Vercel 中更新**
   - Vercel → Settings → Environment Variables
   - 找到 `DATABASE_URL`
   - 点击 **Edit**
   - 将端口从 `5432` 改为 `6543`
   - 在末尾添加 `?pgbouncer=true`
   - 保存

3. **重新部署**
   - Deployments → 最新部署 → `...` → **Redeploy**

### 方法 2: 切换到直接连接（更简单）

1. **在 Supabase 获取直接连接字符串**
   - Supabase Dashboard → Settings → Database
   - Connection string → **URI** 标签
   - 选择 **Direct connection**（不是 Session pooler）
   - 复制连接字符串

2. **格式应该是：**
   ```
   postgresql://postgres:[password]@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres
   ```

3. **更新 Vercel 环境变量**
   - 替换 `DATABASE_URL` 为直接连接字符串
   - 保存并重新部署

## ⚠️ 重要提示

### 密码特殊字符处理

如果密码包含特殊字符，需要进行 URL 编码：

| 字符 | 编码 |
|------|------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| `:` | `%3A` |

**示例：**
- 原始密码：`P@ssw0rd#123`
- 编码后：`P%40ssw0rd%23123`
- 完整连接字符串：
  ```
  postgresql://postgres.zlydqxbbrmqhpzjheatx:P%40ssw0rd%23123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

## 🧪 测试连接

### 使用 psql 测试

```bash
# 测试 Session Pooler（端口 6543）
psql "postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 测试直接连接（端口 5432）
psql "postgresql://postgres:[password]@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres"
```

### 使用 Prisma 测试

```bash
# 设置环境变量
export DATABASE_URL="postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 测试连接
npx prisma db pull
```

## ✅ 正确的完整示例

### Session Pooler 格式（生产环境推荐）

```env
DATABASE_URL="postgresql://postgres.zlydqxbbrmqhpzjheatx:YourPassword123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 直接连接格式（迁移和开发推荐）

```env
DATABASE_URL="postgresql://postgres:YourPassword123@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres"
```

## 🎯 推荐方案

**对于 Vercel 部署，推荐使用 Session Pooler：**

1. ✅ 更好的连接池管理
2. ✅ 适合服务器less环境
3. ✅ 减少连接数限制问题

**修复后的正确格式：**
```
postgresql://postgres.zlydqxbbrmqhpzjheatx:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**关键修改：**
- 端口：`5432` → `6543`
- 添加参数：`?pgbouncer=true`

---

**提示：** 如果使用 Session pooler，端口必须是 **6543**，不能是 5432！

