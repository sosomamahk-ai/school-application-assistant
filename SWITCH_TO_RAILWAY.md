# 🚀 切换到 Railway PostgreSQL（推荐）

## 为什么推荐 Railway？

- ✅ **简单**：标准 PostgreSQL 连接，无特殊格式
- ✅ **可靠**：无 IPv4/IPv6 兼容性问题
- ✅ **免费**：免费额度充足（$5/月免费额度）
- ✅ **快速**：几分钟内完成设置

## 📋 设置步骤

### 步骤 1: 创建 Railway 账户

1. **访问 Railway**：https://railway.app
2. **使用 GitHub 登录**（推荐）或邮箱注册
3. **验证邮箱**（如果需要）

### 步骤 2: 创建 PostgreSQL 数据库

1. **点击 "New Project"**
2. **选择 "Provision PostgreSQL"**
3. **等待数据库创建**（约 30 秒）

### 步骤 3: 获取连接字符串

1. **点击创建的 PostgreSQL 服务**
2. **找到 "Connect" 或 "Variables" 选项卡**
3. **复制 "PostgreSQL Connection URL"**

连接字符串格式类似：
```
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### 步骤 4: 更新 .env 文件

```env
# Database - Railway PostgreSQL

# 应用连接
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"

# 迁移连接（Railway 使用相同的连接字符串）
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway"

# JWT Secret
JWT_SECRET="[YOUR-JWT-SECRET]"

# OpenAI API
OPENAI_API_KEY="[YOUR-OPENAI-API-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**重要**：将 `[PASSWORD]`, `[HOST]`, `[PORT]` 替换为 Railway 提供的实际值。

### 步骤 5: 运行数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 或者如果迁移已存在，使用
npx prisma migrate deploy
```

### 步骤 6: 测试连接

```bash
# 测试数据库连接
npm run test:db

# 如果成功，启动开发服务器
npm run dev
```

## ✅ 验证

1. **运行测试**：`npm run test:db` 应该显示 "✅ 数据库连接成功！"
2. **启动应用**：`npm run dev` 应该可以正常启动
3. **访问登录页面**：http://localhost:3000/auth/login 应该可以正常显示

## 🎉 完成！

现在你的应用应该可以正常连接数据库了！

## 💡 额外提示

- Railway 提供免费的数据库备份
- 可以在 Railway Dashboard 中查看数据库使用情况
- 如果需要，可以轻松升级到付费计划

## 🆘 如果遇到问题

1. **检查连接字符串格式**：确保完全复制，没有遗漏字符
2. **检查密码**：确保密码中没有特殊字符需要 URL 编码
3. **检查网络**：确保可以访问 Railway 服务器
4. **查看 Railway 日志**：在 Railway Dashboard 中查看服务日志

