# 🚀 快速启动指南 (Quick Start Guide)

这是一个简化版的启动指南，帮助您在 5 分钟内启动项目。

## ⚡ 5 分钟快速启动

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置：

```env
# 本地 PostgreSQL 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_app"

# OpenAI API Key（必需）
OPENAI_API_KEY="sk-your-openai-api-key-here"

# JWT Secret（任意随机字符串）
JWT_SECRET="my-super-secret-jwt-key-change-this"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3️⃣ 设置数据库

确保 PostgreSQL 正在运行，然后执行：

```bash
# 创建数据库（如果使用 psql）
createdb school_app

# 运行数据库迁移
npx prisma migrate dev

# 添加示例学校模板
npm run prisma:seed
```

### 4️⃣ 启动开发服务器

```bash
npm run dev
```

### 5️⃣ 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

---

## 🎯 首次使用流程

1. **注册账户**
   - 点击首页的 "Get Started" 按钮
   - 填写邮箱、密码和姓名
   - 点击 "Create account"

2. **完善个人资料**
   - 登录后会提示设置资料
   - 填写基本信息、教育背景、经历等
   - 这些信息会用于自动填写申请表

3. **创建申请**
   - 在 Dashboard 点击 "New Application"
   - 选择一个学校（例如 "Harvard University"）
   - 系统会自动创建申请表单

4. **体验 AI 功能**
   - 表单会自动填充您的资料
   - 右侧 AI 面板会提供填写指导
   - 对于 Essay 字段，可以点击 "Generate Content with AI" 生成内容

5. **保存和查看**
   - 点击 "Save Progress" 保存
   - 返回 Dashboard 可以看到所有申请

---

## 🛠️ 常用命令

```bash
# 开发相关
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库相关
npx prisma studio        # 打开数据库可视化工具
npx prisma migrate dev   # 运行数据库迁移
npm run prisma:seed      # 重新添加示例数据

# 代码质量
npm run lint             # 运行 ESLint
```

---

## 📝 示例数据

运行 seed 脚本后，系统会添加以下学校模板：

1. **Harvard University** - Graduate School of Arts and Sciences
2. **Stanford Graduate School of Business** - MBA Program
3. **MIT** - School of Engineering Graduate Programs

每个模板都包含完整的申请表单字段和 AI 填写规则。

---

## 🔧 故障排除

### 数据库连接失败

**问题**: `Error: Can't reach database server`

**解决方案**:
1. 确认 PostgreSQL 正在运行：
   ```bash
   # macOS
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo service postgresql start
   
   # Windows (在 Services 中启动 PostgreSQL)
   ```

2. 验证数据库存在：
   ```bash
   psql -l  # 列出所有数据库
   ```

3. 检查 `.env` 中的 `DATABASE_URL` 是否正确

### OpenAI API 错误

**问题**: AI 功能不工作

**解决方案**:
1. 确认 `.env` 中的 `OPENAI_API_KEY` 正确
2. 访问 [OpenAI Platform](https://platform.openai.com/) 检查账户余额
3. 确认 API Key 有访问 GPT-4 的权限

### 端口被占用

**问题**: `Port 3000 is already in use`

**解决方案**:
```bash
# 方法1: 使用其他端口
PORT=3001 npm run dev

# 方法2: 关闭占用端口的进程
# macOS/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma Client 错误

**问题**: `@prisma/client did not initialize yet`

**解决方案**:
```bash
npx prisma generate
npm install
```

---

## 📚 下一步

- 查看 [README.md](./README.md) 了解完整功能
- 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 学习如何部署到生产环境
- 探索 `src/` 目录了解代码结构

---

## 💡 提示

1. **开发时自动重载**: 修改代码后，Next.js 会自动重新编译
2. **查看数据库**: 使用 `npx prisma studio` 可视化管理数据
3. **API 测试**: 使用 Postman 或 Thunder Client 测试 API
4. **日志查看**: 在终端查看实时日志和错误信息

---

## 🆘 需要帮助？

- 查看项目 Issues
- 阅读 Next.js 文档：[nextjs.org/docs](https://nextjs.org/docs)
- 查看 Prisma 文档：[prisma.io/docs](https://www.prisma.io/docs)
- 查看 OpenAI API 文档：[platform.openai.com/docs](https://platform.openai.com/docs)

---

**祝您使用愉快！如果遇到问题，请查看详细的 README.md 文档。**

