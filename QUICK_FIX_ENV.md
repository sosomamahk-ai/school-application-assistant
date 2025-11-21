# ⚡ 快速修复环境变量问题

根据诊断工具的输出，您的 `.env` 文件已存在，但诊断工具可能无法正确读取。

## 🔍 问题诊断

诊断工具显示：
```
❌ DATABASE_URL 未设置
❌ JWT_SECRET 未设置
```

但您的 `.env` 文件实际上已经包含了这些变量。

## ✅ 解决方案

### 方法 1: 重新运行诊断（推荐）

我已经修复了诊断脚本，现在它会更好地读取 `.env` 文件。

```powershell
# 重新运行诊断
npm run diagnose:schools
```

### 方法 2: 验证 .env 文件格式

检查 `.env` 文件格式是否正确：

**正确格式**:
```env
DATABASE_URL="postgresql://postgres:password@host:5432/database"
JWT_SECRET="your-secret-key"
```

**常见问题**:
- ❌ 不要有多余的空格: `DATABASE_URL = "..."` （错误）
- ✅ 正确格式: `DATABASE_URL="..."` （正确）
- ❌ 不要在值前后有多余空格
- ✅ 使用引号包裹值（如果包含特殊字符）

### 方法 3: 手动验证环境变量

在 PowerShell 中运行：

```powershell
# 加载环境变量
$env:DATABASE_URL = "your-database-url"
$env:JWT_SECRET = "your-jwt-secret"

# 验证
echo $env:DATABASE_URL
echo $env:JWT_SECRET

# 然后运行诊断
npm run diagnose:schools
```

### 方法 4: 检查 .env 文件编码

`.env` 文件应该使用 **UTF-8** 编码保存。

**如果文件有乱码**:
1. 用文本编辑器（如 VS Code）打开 `.env` 文件
2. 检查文件右下角的编码显示
3. 如果不是 UTF-8，点击编码 → "通过编码保存" → 选择 "UTF-8"
4. 重新保存文件

## 🚀 下一步

修复后，按以下步骤操作：

### 1. 验证环境变量

```powershell
npm run diagnose:schools
```

应该看到：
```
✅ DATABASE_URL = postgresql://...
✅ JWT_SECRET = ...
✅ 数据库连接成功
```

### 2. 运行数据库迁移

```powershell
npx prisma migrate deploy
```

### 3. 测试 API

```powershell
# 启动开发服务器
npm run dev
```

然后在浏览器中访问：
- http://localhost:3000/admin/schools

## 📋 检查清单

- [ ] `.env` 文件存在且格式正确
- [ ] `DATABASE_URL` 已填写（从 Supabase/Railway 获取）
- [ ] `JWT_SECRET` 已填写（至少 32 字符）
- [ ] 文件编码为 UTF-8
- [ ] 运行 `npm run diagnose:schools` 验证
- [ ] 运行 `npx prisma migrate deploy` 创建数据库表
- [ ] 启动开发服务器测试

## 🔧 如果仍然失败

### 检查 1: 确认 .env 文件位置

`.env` 文件应该在项目根目录（与 `package.json` 同级）：

```
school-application-assistant/
├── .env          ← 应该在这里
├── package.json
├── next.config.js
└── ...
```

### 检查 2: 验证变量值

打开 `.env` 文件，确认：

```env
# DATABASE_URL 应该以 postgresql:// 开头
DATABASE_URL="postgresql://postgres:password@host:5432/database"

# JWT_SECRET 应该有值（至少 32 字符）
JWT_SECRET="your-secret-key-here-at-least-32-chars"
```

### 检查 3: 重启终端

有时环境变量需要重新加载：

1. 关闭当前 PowerShell 窗口
2. 重新打开 PowerShell
3. 进入项目目录
4. 运行诊断工具

### 检查 4: 使用 check:env 工具

项目中有另一个环境变量检查工具：

```powershell
npm run check:env
```

这个工具使用 TypeScript，可能提供更详细的错误信息。

## 💡 提示

如果您的 `.env` 文件包含敏感信息（如 API 密钥），请确保：

1. ✅ `.env` 已添加到 `.gitignore`（不会被提交到 Git）
2. ✅ 不要将 `.env` 文件分享给他人
3. ✅ 在生产环境（Vercel）中，通过 Vercel Dashboard 设置环境变量

---

**需要帮助？** 运行 `npm run diagnose:schools` 查看详细错误信息！

