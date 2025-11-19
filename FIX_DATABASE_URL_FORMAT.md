# 🔧 修复 DATABASE_URL 格式错误

## 🚨 当前错误

```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

这个错误表示 Prisma 无法识别 `DATABASE_URL` 的格式。

## 🔍 可能的原因

1. **环境变量中包含引号**
   - Vercel 环境变量值不应该包含引号
   - 错误：`"postgresql://..."`
   - 正确：`postgresql://...`

2. **环境变量值有空格或换行**
   - 连接字符串前后可能有空格
   - 可能包含隐藏字符

3. **环境变量未正确设置**
   - 变量名拼写错误
   - 环境选择错误（Production/Preview/Development）

4. **连接字符串格式错误**
   - 缺少协议前缀
   - 格式不完整

## ✅ 修复步骤

### 步骤 1: 检查 Vercel 环境变量

1. **登录 Vercel Dashboard**
   - 访问 https://vercel.com
   - 进入项目：`school-application-assistant`
   - Settings → Environment Variables

2. **检查 DATABASE_URL**
   - 找到 `DATABASE_URL`
   - 点击 **Reveal Value** 或 **Edit**
   - 检查格式

3. **确保格式正确**

   ❌ **错误格式（包含引号）：**
   ```
   "postgresql://postgres.zlydqxbbrmqhpzjheatx:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

   ✅ **正确格式（无引号）：**
   ```
   postgresql://postgres.zlydqxbbrmqhpzjheatx:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 步骤 2: 重新设置环境变量

1. **删除旧的 DATABASE_URL**
   - 点击 `DATABASE_URL` 旁边的 `...`
   - 选择 **Delete**
   - 确认删除

2. **添加新的 DATABASE_URL**
   - 点击 **Add New**
   - Name: `DATABASE_URL`
   - Value: 粘贴连接字符串（**不要包含引号**）
   - Environments: ✅ Production ✅ Preview ✅ Development
   - 点击 **Save**

3. **验证格式**
   - 点击 **Reveal Value** 查看
   - 确保以 `postgresql://` 开头
   - 确保没有引号
   - 确保没有前后空格

### 步骤 3: 正确的连接字符串格式

#### Session Pooler 格式（推荐）

```
postgresql://postgres.zlydqxbbrmqhpzjheatx:YourPassword@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**要点：**
- ✅ 以 `postgresql://` 开头
- ✅ 无引号
- ✅ 端口：`6543`
- ✅ 参数：`?pgbouncer=true`

#### 直接连接格式

```
postgresql://postgres:YourPassword@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres
```

**要点：**
- ✅ 以 `postgresql://` 开头
- ✅ 无引号
- ✅ 端口：`5432`
- ✅ 无参数

### 步骤 4: 处理密码特殊字符

如果密码包含特殊字符，需要 URL 编码：

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

### 步骤 5: 重新部署

1. **保存环境变量后**
   - Deployments → 最新部署
   - 点击 `...` → **Redeploy**
   - 等待部署完成

2. **验证修复**
   - 访问：`https://school-application-assistant.vercel.app/api/health`
   - 应该看到 `"database": { "connected": true }`

## 🔍 调试技巧

### 方法 1: 使用 Vercel CLI 检查

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 拉取环境变量到本地
vercel env pull .env.local

# 检查 .env.local 文件
cat .env.local
```

查看 `DATABASE_URL` 的值，确保：
- 以 `postgresql://` 开头
- 无引号
- 无前后空格

### 方法 2: 在代码中打印（临时调试）

在 API 路由中临时添加：

```typescript
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('Starts with postgresql://', process.env.DATABASE_URL?.startsWith('postgresql://'));
```

查看 Vercel 函数日志，确认实际值。

### 方法 3: 使用健康检查端点

健康检查端点会显示环境变量状态，但不会显示实际值（安全考虑）。

## 📋 检查清单

使用以下清单确保格式正确：

- [ ] **连接字符串以 `postgresql://` 开头**
- [ ] **不包含引号**（单引号或双引号）
- [ ] **无前后空格**
- [ ] **端口号正确**（6543 用于 pooler，5432 用于直接连接）
- [ ] **密码已正确编码**（如果包含特殊字符）
- [ ] **环境变量已选择所有环境**（Production, Preview, Development）
- [ ] **已重新部署应用**

## 🚨 常见错误示例

### 错误 1: 包含引号

```
❌ "postgresql://..."
✅ postgresql://...
```

### 错误 2: 前后有空格

```
❌  postgresql://... 
✅ postgresql://...
```

### 错误 3: 缺少协议

```
❌ postgres.zlydqxbbrmqhpzjheatx:password@...
✅ postgresql://postgres.zlydqxbbrmqhpzjheatx:password@...
```

### 错误 4: 使用错误的协议

```
❌ https://postgres.zlydqxbbrmqhpzjheatx:password@...
✅ postgresql://postgres.zlydqxbbrmqhpzjheatx:password@...
```

## ✅ 正确的完整示例

### Session Pooler（推荐）

在 Vercel 环境变量中设置：

**Name:** `DATABASE_URL`

**Value:**
```
postgresql://postgres.zlydqxbbrmqhpzjheatx:YourPassword123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**重要：**
- 直接粘贴，不要加引号
- 确保没有前后空格
- 将 `YourPassword123` 替换为实际密码

### 直接连接

**Name:** `DATABASE_URL`

**Value:**
```
postgresql://postgres:YourPassword123@db.zlydqxbbrmqhpzjheatx.supabase.co:5432/postgres
```

## 🆘 仍然无法解决？

如果按照上述步骤仍无法解决：

1. **完全删除并重新创建环境变量**
   - 删除 `DATABASE_URL`
   - 等待几秒钟
   - 重新添加

2. **使用直接连接而不是 pooler**
   - 更简单，更少配置问题
   - 格式：`postgresql://postgres:password@db.project.supabase.co:5432/postgres`

3. **检查 Vercel 项目设置**
   - 确保项目未暂停
   - 检查是否有其他配置问题

4. **查看 Vercel 构建日志**
   - Deployments → 最新部署 → 查看构建日志
   - 查找 Prisma 相关错误

---

**提示：** 大多数情况下，问题都是因为环境变量值包含了引号或空格。确保在 Vercel 中设置时，直接粘贴连接字符串，不要添加任何引号。

