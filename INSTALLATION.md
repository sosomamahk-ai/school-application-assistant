# 📦 完整安装指南 (Installation Guide)

本指南提供详细的安装步骤，适合初学者和有经验的开发者。

---

## 🔍 系统要求

### 必需软件

| 软件 | 最低版本 | 推荐版本 | 下载链接 |
|------|---------|---------|---------|
| Node.js | 18.0.0 | 20.x | [nodejs.org](https://nodejs.org/) |
| npm | 9.0.0 | 10.x | 随 Node.js 安装 |
| PostgreSQL | 14.0 | 15.x | [postgresql.org](https://www.postgresql.org/download/) |
| Git | 2.30+ | 最新版 | [git-scm.com](https://git-scm.com/) |

### 操作系统支持
- ✅ macOS 11.0+
- ✅ Windows 10/11
- ✅ Ubuntu 20.04+
- ✅ Debian 11+

### 硬件要求
- **内存**: 最少 4GB RAM (推荐 8GB+)
- **存储**: 最少 1GB 可用空间
- **网络**: 稳定的互联网连接（用于 OpenAI API）

---

## 📥 第一步：安装必需软件

### 安装 Node.js

#### Windows
1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 LTS 版本 (推荐)
3. 运行安装程序
4. 验证安装：
   ```bash
   node --version
   npm --version
   ```

#### macOS
```bash
# 使用 Homebrew
brew install node

# 验证安装
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

---

### 安装 PostgreSQL

#### Windows
1. 访问 [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. 下载 PostgreSQL 安装程序
3. 运行安装程序，记住设置的密码
4. 默认端口: 5432

#### macOS
```bash
# 使用 Homebrew
brew install postgresql@15

# 启动 PostgreSQL 服务
brew services start postgresql@15

# 创建数据库用户（可选）
createuser -s postgres
```

#### Linux (Ubuntu/Debian)
```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 切换到 postgres 用户
sudo -i -u postgres
```

---

## 🚀 第二步：项目设置

### 1. 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/yourusername/school-application-assistant.git

# 或使用 SSH
git clone git@github.com:yourusername/school-application-assistant.git

# 进入项目目录
cd school-application-assistant
```

### 2. 安装依赖

```bash
npm install
```

**可能遇到的问题**:

#### 问题: `npm install` 失败
**解决方案**:
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 问题: Python 或 build tools 错误
**Windows 解决方案**:
```bash
npm install --global windows-build-tools
```

**Linux 解决方案**:
```bash
sudo apt-get install build-essential
```

---

## ⚙️ 第三步：配置数据库

### 1. 创建数据库

#### 使用命令行

**PostgreSQL**:
```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE school_app;

# 创建用户（可选）
CREATE USER appuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE school_app TO appuser;

# 退出
\q
```

#### 使用 pgAdmin (GUI)

1. 打开 pgAdmin
2. 右键点击 "Databases"
3. 选择 "Create" → "Database"
4. 输入名称: `school_app`
5. 点击 "Save"

### 2. 配置连接

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# PostgreSQL 连接字符串
DATABASE_URL="postgresql://username:password@localhost:5432/school_app"

# 示例（使用默认 postgres 用户）:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/school_app"

# 如果使用其他主机:
# DATABASE_URL="postgresql://user:pass@hostname:5432/dbname"
```

**连接字符串格式**:
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[选项]
```

### 3. 测试数据库连接

```bash
# 使用 Prisma 测试连接
npx prisma db pull
```

如果成功，应该看到类似输出：
```
Datasource "db": PostgreSQL database "school_app"
```

---

## 🔑 第四步：获取 OpenAI API Key

### 1. 创建 OpenAI 账户

1. 访问 [platform.openai.com](https://platform.openai.com/)
2. 点击 "Sign up" 注册账户
3. 验证邮箱

### 2. 获取 API Key

1. 登录 OpenAI 平台
2. 点击右上角头像 → "View API keys"
3. 点击 "Create new secret key"
4. 复制 API Key（只显示一次！）
5. 保存到安全的地方

### 3. 配置 API Key

编辑 `.env` 文件：

```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

**重要提示**:
- ⚠️ 不要将 API Key 提交到 Git
- ⚠️ 不要分享给他人
- ⚠️ 定期轮换 Key
- ⚠️ 设置使用限额

### 4. 充值账户

OpenAI API 需要付费使用：
1. 访问 [platform.openai.com/account/billing](https://platform.openai.com/account/billing)
2. 添加支付方式
3. 充值（建议从 $10 开始）

**费用估算**:
- GPT-4: ~$0.03 / 1K tokens（输入）
- 一次 Essay 生成约 $0.05-0.15
- 100 次使用约 $5-15

---

## 🔐 第五步：配置 JWT Secret

### 1. 生成安全的密钥

```bash
# macOS/Linux
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes(32))
```

### 2. 添加到 .env

```env
JWT_SECRET="your-generated-secret-here"
```

**示例完整的 .env 文件**:

```env
# 数据库
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/school_app"

# OpenAI
OPENAI_API_KEY="sk-proj-abc123..."

# JWT Secret
JWT_SECRET="XyZ123abC456..."

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗄️ 第六步：初始化数据库

### 1. 运行数据库迁移

```bash
npx prisma migrate dev
```

这会：
- ✅ 创建所有数据表
- ✅ 设置关系和索引
- ✅ 生成 Prisma Client

**输出示例**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "school_app"

✔ Enter a name for the new migration: … init
Applying migration `20240101000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### 2. 添加示例数据

```bash
npm run prisma:seed
```

这会添加：
- 3 个学校模板（Harvard, Stanford, MIT）
- 完整的表单字段定义
- AI 填写规则

**输出示例**:
```
Starting seed...
Cleared existing templates
Created template: Harvard University - Graduate School of Arts and Sciences
Created template: Stanford Graduate School of Business - MBA Program
Created template: MIT - School of Engineering Graduate Programs
Seed completed successfully!
```

### 3. 验证数据库

```bash
# 打开 Prisma Studio（数据库 GUI）
npx prisma studio
```

访问 [http://localhost:5555](http://localhost:5555) 查看数据。

---

## ▶️ 第七步：启动应用

### 开发模式

```bash
npm run dev
```

**成功输出**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
event - compiled client and server successfully
```

### 访问应用

打开浏览器访问：
- **主页**: [http://localhost:3000](http://localhost:3000)
- **登录**: [http://localhost:3000/auth/login](http://localhost:3000/auth/login)
- **注册**: [http://localhost:3000/auth/register](http://localhost:3000/auth/register)

---

## ✅ 第八步：验证安装

### 功能检查清单

- [ ] **首页加载正常**
  - 访问 http://localhost:3000
  - 页面显示正常，无错误

- [ ] **用户注册**
  - 点击 "Get Started"
  - 填写邮箱、密码
  - 成功创建账户

- [ ] **用户登录**
  - 使用注册的账户登录
  - 重定向到 Dashboard

- [ ] **编辑资料**
  - 访问 Profile 页面
  - 添加教育背景
  - 保存成功

- [ ] **创建申请**
  - Dashboard 点击 "New Application"
  - 选择一个学校
  - 表单正常显示

- [ ] **AI 功能**
  - 查看字段指导
  - 尝试生成 Essay
  - AI 响应正常

### 测试命令

```bash
# 检查 Node.js
node --version

# 检查 npm
npm --version

# 检查数据库连接
npx prisma db pull

# 检查环境变量
node -e "console.log(process.env.DATABASE_URL ? '✓ DATABASE_URL set' : '✗ DATABASE_URL missing')"
node -e "console.log(process.env.OPENAI_API_KEY ? '✓ OPENAI_API_KEY set' : '✗ OPENAI_API_KEY missing')"
```

---

## 🐛 常见问题排查

### 问题 1: 端口被占用

**错误**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 方法 1: 使用其他端口
PORT=3001 npm run dev

# 方法 2: 杀死占用进程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### 问题 2: 数据库连接失败

**错误**: `Can't reach database server`

**检查清单**:
1. PostgreSQL 是否正在运行？
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   
   # Windows（检查服务）
   sc query postgresql
   ```

2. 连接字符串是否正确？
   - 用户名、密码正确？
   - 主机和端口正确？
   - 数据库已创建？

3. 防火墙是否阻止连接？

---

### 问题 3: Prisma 错误

**错误**: `@prisma/client did not initialize yet`

**解决方案**:
```bash
# 重新生成 Prisma Client
npx prisma generate

# 如果仍有问题，清理并重新安装
rm -rf node_modules
rm -rf .next
npm install
```

---

### 问题 4: OpenAI API 错误

**错误**: `Invalid API key` 或 `Insufficient quota`

**检查清单**:
1. API Key 是否正确复制？
2. 账户是否有余额？
3. 网络是否能访问 OpenAI API？

**测试 API Key**:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

### 问题 5: TypeScript 编译错误

**解决方案**:
```bash
# 清理 Next.js 缓存
rm -rf .next

# 重新构建
npm run build
```

---

## 🛠️ 开发工具推荐

### 代码编辑器
- **VS Code** (推荐)
  - 扩展: ES7+ React/Redux/React-Native snippets
  - 扩展: Prisma
  - 扩展: Tailwind CSS IntelliSense
  - 扩展: ESLint

### 数据库工具
- **Prisma Studio** (内置): `npx prisma studio`
- **pgAdmin** (GUI): 功能强大的 PostgreSQL 管理工具
- **TablePlus** (macOS): 现代化的数据库客户端

### API 测试
- **Thunder Client** (VS Code 扩展)
- **Postman**
- **Insomnia**

### 浏览器扩展
- **React Developer Tools**
- **Redux DevTools**
- **Wappalyzer** (技术栈检测)

---

## 📚 下一步

安装完成后，建议：

1. **阅读文档**
   - [README.md](./README.md) - 完整功能介绍
   - [QUICKSTART.md](./QUICKSTART.md) - 快速开始
   - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目总览

2. **探索代码**
   - `src/pages/` - 页面组件
   - `src/components/` - 通用组件
   - `src/pages/api/` - API 路由

3. **学习资源**
   - [Next.js 文档](https://nextjs.org/docs)
   - [Prisma 文档](https://www.prisma.io/docs)
   - [Tailwind CSS 文档](https://tailwindcss.com/docs)
   - [OpenAI API 文档](https://platform.openai.com/docs)

4. **自定义项目**
   - 添加新的学校模板
   - 自定义 UI 主题
   - 扩展 AI 功能

---

## 🆘 获取帮助

如果遇到问题：

1. **查看错误日志**
   - 终端输出
   - 浏览器控制台 (F12)
   - `npm run dev` 的输出

2. **搜索文档**
   - 项目 README
   - 相关技术文档
   - GitHub Issues

3. **寻求帮助**
   - 提交 GitHub Issue
   - Stack Overflow
   - Discord/Slack 社区

---

**安装完成！祝您开发愉快！🎉**

