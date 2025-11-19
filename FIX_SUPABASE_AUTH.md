# 🔧 修复 Supabase 数据库认证错误

## 🚨 当前问题

根据健康检查结果，问题很明确：

```json
{
  "database": {
    "connected": false,
    "error": "Authentication failed against database server at `aws-1-ap-south-1.pooler.supabase.com`, the provided database credentials for `postgres` are not valid."
  }
}
```

**问题：** Supabase 数据库认证失败 - 提供的数据库凭据无效。

## 🔍 诊断步骤

### 步骤 1: 检查 Supabase 连接字符串

1. **登录 Supabase**
   - 访问 https://supabase.com
   - 登录您的账户
   - 选择项目

2. **获取正确的连接字符串**
   - 进入项目 → **Settings** → **Database**
   - 找到 **Connection string** 部分
   - 选择 **URI** 标签（不是 Session pooler）

3. **检查连接字符串格式**

   正确的格式应该是：
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   或者直接连接（不使用 pooler）：
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 步骤 2: 验证密码

**重要：** Supabase 数据库密码可能已更改，需要：

1. **重置数据库密码**
   - Supabase → Settings → Database
   - 找到 **Database password** 部分
   - 点击 **Reset database password**
   - 复制新密码（只显示一次！）

2. **更新连接字符串**
   - 使用新密码更新 `DATABASE_URL`
   - 确保密码正确编码（特殊字符需要 URL 编码）

## 🔧 修复步骤

### 方法 1: 使用 Supabase 直接连接（推荐）

1. **获取直接连接字符串**
   - Supabase → Settings → Database
   - Connection string → **URI** 标签
   - 选择 **Direct connection**（不是 Session pooler）
   - 复制连接字符串

2. **更新 Vercel 环境变量**
   - Vercel → Settings → Environment Variables
   - 找到 `DATABASE_URL`
   - 点击 **Edit**
   - 粘贴新的连接字符串
   - 保存

3. **重新部署**
   - Deployments → 最新部署 → `...` → **Redeploy**

### 方法 2: 使用 Session Pooler（如果必须）

如果必须使用 Session pooler，确保：

1. **使用正确的连接字符串格式**
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **注意端口号**
   - Session pooler 使用端口 **6543**
   - 直接连接使用端口 **5432**

3. **添加连接参数**
   ```
   ?pgbouncer=true&connection_limit=1
   ```

### 方法 3: 重置数据库密码并更新

如果密码可能已更改：

1. **在 Supabase 重置密码**
   ```
   Supabase Dashboard → Settings → Database → Reset database password
   ```

2. **复制新密码**
   - 重要：密码只显示一次，立即复制

3. **更新连接字符串**
   - 格式：`postgresql://postgres:[NEW_PASSWORD]@...`
   - 确保密码中的特殊字符已正确编码

4. **更新 Vercel 环境变量**
   - 替换 `DATABASE_URL` 的值
   - 保存并重新部署

## 📋 连接字符串格式检查清单

确保连接字符串：

- [ ] 以 `postgresql://` 开头
- [ ] 包含正确的用户名（通常是 `postgres`）
- [ ] 密码正确且已 URL 编码（如果包含特殊字符）
- [ ] 主机名正确（Supabase 项目引用）
- [ ] 端口号正确（5432 或 6543）
- [ ] 数据库名正确（通常是 `postgres`）

## 🔍 特殊字符处理

如果密码包含特殊字符，需要进行 URL 编码：

| 字符 | URL 编码 |
|------|---------|
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
```
原始密码: P@ssw0rd#123
编码后: P%40ssw0rd%23123
```

## 🧪 测试连接

### 使用 psql 测试

```bash
# 测试直接连接
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# 测试 session pooler
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 使用 Prisma 测试

```bash
# 设置环境变量
export DATABASE_URL="postgresql://..."

# 测试连接
npx prisma db pull
```

## 🚨 常见错误

### 错误 1: "Authentication failed"

**原因：**
- 密码错误
- 用户名错误
- 连接字符串格式错误

**解决：**
1. 重置 Supabase 数据库密码
2. 使用新密码更新连接字符串
3. 确保格式正确

### 错误 2: "Connection refused"

**原因：**
- 端口号错误
- 主机名错误
- 网络问题

**解决：**
- 检查端口号（5432 或 6543）
- 验证主机名是否正确
- 尝试直接连接而不是 pooler

### 错误 3: "Database does not exist"

**原因：**
- 数据库名错误

**解决：**
- Supabase 默认数据库名是 `postgres`
- 检查连接字符串中的数据库名

## ✅ 验证修复

修复后，再次访问健康检查端点：

```
https://school-application-assistant.vercel.app/api/health
```

应该看到：

```json
{
  "status": "ok",
  "checks": {
    "database": {
      "connected": true,
      "error": null
    }
  }
}
```

## 📝 快速修复步骤总结

1. ✅ 登录 Supabase Dashboard
2. ✅ Settings → Database → Reset database password
3. ✅ 复制新密码
4. ✅ 获取连接字符串（URI，直接连接）
5. ✅ Vercel → Settings → Environment Variables
6. ✅ 更新 `DATABASE_URL` 为新连接字符串
7. ✅ 保存并重新部署
8. ✅ 验证 `/api/health` 端点

## 🆘 仍然无法连接？

如果按照上述步骤仍无法连接：

1. **检查 Supabase 项目状态**
   - 确保项目未暂停
   - 检查项目是否在正确的区域

2. **验证网络连接**
   - 尝试从不同网络连接
   - 检查防火墙设置

3. **联系 Supabase 支持**
   - 如果项目状态正常但无法连接
   - 可能是 Supabase 服务问题

4. **考虑使用其他数据库**
   - Railway PostgreSQL（推荐，更简单）
   - Vercel Postgres
   - 其他 PostgreSQL 提供商

---

**提示：** 大多数认证错误都是由密码错误或连接字符串格式问题引起的。确保使用 Supabase Dashboard 中显示的准确连接字符串。

