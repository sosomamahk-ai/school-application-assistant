# 🔧 环境变量快速设置指南

根据诊断工具的输出，您需要设置以下环境变量：
- ❌ `DATABASE_URL` - 数据库连接字符串
- ❌ `JWT_SECRET` - JWT 密钥

## 🚀 快速开始（推荐）

### 方法 1: 使用自动设置脚本

运行以下命令，脚本会自动创建 `.env` 文件并生成 JWT_SECRET：

```powershell
npm run setup:env
```

脚本会：
- ✅ 自动生成 JWT_SECRET
- ✅ 创建 `.env` 文件模板
- ✅ 提供下一步指导

### 方法 2: 手动创建 .env 文件

1. **在项目根目录创建 `.env` 文件**

2. **生成 JWT_SECRET**（在 PowerShell 中运行）：

```powershell
# 方法 A: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 B: 使用 PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes(32))
```

3. **创建 .env 文件内容**：

```env
# 数据库连接字符串（需要填写）
DATABASE_URL=""

# JWT 密钥（已生成）
JWT_SECRET="粘贴上面生成的密钥"

# OpenAI API Key（可选，AI 功能需要）
OPENAI_API_KEY=""

# 应用 URL（本地开发使用）
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📋 详细步骤

### 步骤 1: 获取 DATABASE_URL

#### 选项 A: 使用 Supabase（推荐，免费）

1. **访问 Supabase**: https://supabase.com
2. **登录/注册账户**
3. **创建新项目**:
   - 点击 "New Project"
   - 填写项目名称
   - 选择区域（建议选择离您最近的）
   - 设置数据库密码（**请保存好！**）
   - 等待项目创建完成（约 2 分钟）

4. **获取连接字符串**:
   - 在项目 Dashboard 中
   - 点击左侧菜单 "Settings" → "Database"
   - 找到 "Connection string" 部分
   - 选择 **"Session mode"**（不是 Transaction mode）
   - 复制连接字符串

5. **格式示例**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

6. **填写到 .env 文件**:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
   ```

#### 选项 B: 使用本地 PostgreSQL

如果您已经安装了 PostgreSQL：

1. **确保 PostgreSQL 正在运行**

2. **创建数据库**:
   ```sql
   CREATE DATABASE school_app;
   ```

3. **填写连接字符串**:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@localhost:5432/school_app"
   ```

#### 选项 C: 使用 Railway（简单，免费额度）

1. **访问 Railway**: https://railway.app
2. **使用 GitHub 登录**
3. **创建新项目** → "New Database" → "PostgreSQL"
4. **获取连接字符串**:
   - 点击数据库服务
   - 选择 "Variables" 标签
   - 复制 `DATABASE_URL` 的值

### 步骤 2: 生成 JWT_SECRET

**在 PowerShell 中运行**:

```powershell
# 方法 1: 使用 Node.js（推荐）
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 方法 2: 使用 PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes(32))

# 方法 3: 在线生成（最简单）
# 访问: https://randomkeygen.com/
# 复制 "CodeIgniter Encryption Keys" 下的任意一个
```

**复制生成的密钥，填写到 .env 文件**:

```env
JWT_SECRET="粘贴生成的密钥"
```

### 步骤 3: 验证配置

运行诊断工具验证配置：

```powershell
npm run diagnose:schools
```

如果看到：
- ✅ DATABASE_URL 已设置
- ✅ JWT_SECRET 已设置
- ✅ 数据库连接成功

说明配置正确！

### 步骤 4: 运行数据库迁移

配置完成后，需要创建数据库表结构：

```powershell
# 运行数据库迁移
npx prisma migrate deploy

# 或者开发环境使用
npx prisma migrate dev
```

### 步骤 5: 重新测试

再次运行诊断工具：

```powershell
npm run diagnose:schools
```

现在应该所有检查都通过了！

## 🔍 常见问题

### Q1: 如何知道 DATABASE_URL 格式是否正确？

**正确格式**:
```
postgresql://用户名:密码@主机:端口/数据库名
```

**示例**:
```
postgresql://postgres:mypassword@localhost:5432/school_app
postgresql://postgres:pass123@db.abc123.supabase.co:5432/postgres
```

### Q2: 密码包含特殊字符怎么办？

如果密码包含特殊字符（如 `@`, `#`, `%` 等），需要进行 URL 编码：

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`

**示例**:
```
原始密码: my@pass#123
编码后: my%40pass%23123
连接字符串: postgresql://postgres:my%40pass%23123@host:5432/db
```

### Q3: 如何测试数据库连接？

```powershell
# 使用 Prisma 测试
npm run test:db

# 或使用诊断工具
npm run diagnose:schools
```

### Q4: 本地开发和生产环境使用不同的数据库？

可以创建多个环境文件：
- `.env.local` - 本地开发（不会被提交到 Git）
- `.env.production` - 生产环境（在 Vercel 中设置）

**本地开发**:
```env
# .env.local
DATABASE_URL="postgresql://postgres:pass@localhost:5432/school_app"
```

**生产环境（Vercel）**:
- 在 Vercel Dashboard 中
- Settings → Environment Variables
- 添加 `DATABASE_URL`

### Q5: 忘记数据库密码怎么办？

**Supabase**:
- 登录 Supabase Dashboard
- Settings → Database
- 可以重置密码

**本地 PostgreSQL**:
```sql
-- 重置 postgres 用户密码
ALTER USER postgres WITH PASSWORD 'new_password';
```

## ✅ 完成检查清单

完成以下步骤后，您的环境就配置好了：

- [ ] 创建了 `.env` 文件
- [ ] 填写了 `DATABASE_URL`（从 Supabase/Railway/本地获取）
- [ ] 生成了 `JWT_SECRET` 并填写
- [ ] 运行 `npm run diagnose:schools` 验证配置
- [ ] 运行 `npx prisma migrate deploy` 创建数据库表
- [ ] 再次运行诊断工具，所有检查通过 ✅

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT.md)
- [Supabase 配置指南](./SUPABASE_CORRECT_CONFIG.md)
- [环境变量检查工具](./CHECK_ENV_USAGE.md)

---

**提示**: 如果遇到问题，运行 `npm run diagnose:schools` 查看详细错误信息！

