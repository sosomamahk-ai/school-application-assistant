# 🔍 检查 Vercel 环境变量配置指南

本指南将帮助您检查 Vercel 上的环境变量是否已正确配置。

## 📋 需要检查的环境变量

- ✅ `DATABASE_URL` - 数据库连接字符串
- ✅ `JWT_SECRET` - JWT 密钥
- ✅ `NEXT_PUBLIC_APP_URL` - 应用 URL
- ⚠️ `OPENAI_API_KEY` - OpenAI API 密钥（可选，用于 AI 功能）

---

## 🎯 方法 1：通过 Vercel 网页界面检查（推荐）

### 步骤 1：登录 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用您的 GitHub 账户登录

### 步骤 2：进入项目设置

1. 在 Dashboard 中找到您的项目：`school-application-assistant`
2. 点击项目名称进入项目页面
3. 点击顶部的 **`Settings`**（设置）标签
4. 在左侧菜单中点击 **`Environment Variables`**（环境变量）

### 步骤 3：检查环境变量列表

您应该看到类似这样的列表：

```
┌─────────────────────────────────────────────────────┐
│ Environment Variables                                │
├─────────────────────────────────────────────────────┤
│ Name                 │ Value (hidden) │ Environments │
├─────────────────────────────────────────────────────┤
│ DATABASE_URL         │ ••••••••••••  │ All          │
│ JWT_SECRET           │ ••••••••••••  │ All          │
│ NEXT_PUBLIC_APP_URL   │ ••••••••••••  │ All          │
│ OPENAI_API_KEY       │ ••••••••••••  │ All          │
└─────────────────────────────────────────────────────┘
```

### 步骤 4：验证每个变量

#### ✅ 检查 DATABASE_URL

1. 找到 `DATABASE_URL` 行
2. 点击右侧的 **`...`** 菜单
3. 选择 **`Reveal Value`**（显示值）或 **`Edit`**（编辑）
4. **验证格式**：
   - ✅ 应该以 `postgresql://` 开头
   - ✅ 包含用户名、密码、主机和数据库名
   - ✅ 格式类似：`postgresql://user:password@host:port/database`
   - ❌ 如果显示 "Not set" 或为空，需要添加

**示例格式**：
```
postgresql://postgres:password123@containers-us-west-123.railway.app:5432/railway
```

#### ✅ 检查 JWT_SECRET

1. 找到 `JWT_SECRET` 行
2. 点击 **`Reveal Value`** 查看
3. **验证**：
   - ✅ 应该是一个长随机字符串（至少 32 个字符）
   - ✅ 包含字母、数字和特殊字符
   - ❌ 如果为空或太短，需要重新生成

**如何生成新的 JWT_SECRET**：

**方法 A：在线生成**
- 访问：https://randomkeygen.com/
- 复制 "CodeIgniter Encryption Keys" 下的任意一个密钥

**方法 B：使用 PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

#### ✅ 检查 NEXT_PUBLIC_APP_URL

1. 找到 `NEXT_PUBLIC_APP_URL` 行
2. 点击 **`Reveal Value`** 查看
3. **验证**：
   - ✅ 应该是完整的 HTTPS URL
   - ✅ 格式：`https://your-project-name.vercel.app`
   - ✅ 与您实际的应用 URL 匹配
   - ❌ 如果为空或使用 `http://`，需要更新

**如何获取正确的 URL**：
- 在 Vercel 项目页面顶部查看
- 或在 **`Deployments`** 标签中查看最新部署的 URL

#### ⚠️ 检查 OPENAI_API_KEY（可选）

1. 找到 `OPENAI_API_KEY` 行（如果存在）
2. **验证**：
   - ✅ 应该以 `sk-` 开头
   - ✅ 长度约 50+ 字符
   - ⚠️ 如果没有，AI 功能将不可用，但应用仍可运行

---

## 🎯 方法 2：通过 Vercel CLI 检查

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：登录并链接项目

```bash
# 登录 Vercel
vercel login

# 进入项目目录
cd school-application-assistant

# 链接到 Vercel 项目
vercel link
```

### 步骤 3：拉取环境变量

```bash
# 拉取环境变量到本地 .env.local 文件
vercel env pull .env.local
```

### 步骤 4：检查文件内容

打开 `.env.local` 文件，检查是否包含：

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
OPENAI_API_KEY="sk-..."  # 可选
```

---

## 🎯 方法 3：通过浏览器控制台检查（仅限前端变量）

⚠️ **注意**：只能检查以 `NEXT_PUBLIC_` 开头的变量

### 步骤：

1. 打开您的应用：https://school-application-assistant.vercel.app
2. 按 `F12` 打开开发者工具
3. 在 Console（控制台）中输入：

```javascript
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL);
```

4. 如果显示 `undefined`，说明变量未设置

---

## 🎯 方法 4：通过 API 测试检查

### 测试数据库连接

创建一个测试 API 路由来检查数据库连接：

```typescript
// src/pages/api/test-env.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  };

  // 测试数据库连接
  let dbConnected = false;
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection test failed:', error);
  }

  res.status(200).json({
    environmentVariables: checks,
    databaseConnected: dbConnected,
    message: 'Environment check complete'
  });
}
```

然后访问：`https://your-app.vercel.app/api/test-env`

---

## ✅ 检查清单

使用以下清单确保所有变量都已正确配置：

- [ ] `DATABASE_URL` 已设置且格式正确
- [ ] `JWT_SECRET` 已设置且长度足够（≥32 字符）
- [ ] `NEXT_PUBLIC_APP_URL` 已设置且使用 HTTPS
- [ ] `OPENAI_API_KEY` 已设置（如果使用 AI 功能）
- [ ] 所有变量都选择了正确的环境（Production、Preview、Development）

---

## 🔧 如何修复缺失的变量

### 如果 DATABASE_URL 缺失：

1. **使用 Vercel Postgres**（推荐）：
   - Vercel 项目 → **Storage** → **Create Database** → **Postgres**
   - Vercel 会自动添加 `DATABASE_URL`

2. **使用 Railway**：
   - 访问 https://railway.app
   - 创建 PostgreSQL 数据库
   - 复制连接字符串
   - 在 Vercel 中添加为 `DATABASE_URL`

3. **使用 Supabase**：
   - 访问 https://supabase.com
   - 创建项目
   - Settings → Database → Connection String
   - 复制并添加到 Vercel

### 如果 JWT_SECRET 缺失：

1. 生成新的密钥（见上方方法）
2. 在 Vercel → Settings → Environment Variables
3. 添加 `JWT_SECRET`，值为生成的密钥
4. 选择所有环境（Production、Preview、Development）
5. 点击 **Save**
6. **重要**：重新部署应用

### 如果 NEXT_PUBLIC_APP_URL 缺失：

1. 在 Vercel 项目页面查看应用 URL
2. 添加环境变量：
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: `https://your-project-name.vercel.app`
   - 选择所有环境
3. 点击 **Save**
4. 重新部署

---

## 🚨 常见问题

### Q: 环境变量已设置，但应用仍报错？

**A:** 可能的原因：
1. **需要重新部署**：添加环境变量后必须重新部署
   - 在 Vercel → Deployments → 点击最新部署的 `...` → **Redeploy**

2. **环境选择错误**：确保变量选择了正确的环境
   - Production：生产环境
   - Preview：预览环境（PR 部署）
   - Development：开发环境

3. **变量名拼写错误**：检查大小写是否完全匹配

### Q: 如何知道变量是否生效？

**A:** 
1. 查看 Vercel 部署日志
2. 检查应用是否正常运行
3. 查看浏览器控制台是否有错误
4. 使用测试 API（方法 4）

### Q: 修改环境变量后需要做什么？

**A:**
1. ✅ 保存变量
2. ✅ **重新部署应用**（重要！）
3. ✅ 等待部署完成
4. ✅ 测试应用功能

---

## 📝 快速检查命令（使用 Vercel CLI）

```bash
# 1. 登录
vercel login

# 2. 链接项目
vercel link

# 3. 查看所有环境变量（不显示值）
vercel env ls

# 4. 查看特定变量的值
vercel env pull .env.local
cat .env.local

# 5. 添加新变量
vercel env add DATABASE_URL production

# 6. 删除变量
vercel env rm DATABASE_URL production
```

---

## 🎉 完成检查后

如果所有变量都已正确配置：

1. ✅ 重新部署应用（确保新变量生效）
2. ✅ 测试登录功能
3. ✅ 检查数据库连接
4. ✅ 验证应用正常运行

---

## 📞 需要帮助？

如果检查后仍有问题：

1. 查看 Vercel 部署日志：Project → Deployments → 点击最新部署
2. 查看函数日志：Project → Logs
3. 检查浏览器控制台错误
4. 验证数据库连接是否正常

---

**祝您配置顺利！** 🚀

