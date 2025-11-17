# School Application Assistant 🎓

一个基于 AI 的学校申请辅助系统，帮助学生简化申请流程，提供智能表单填写、个性化指导和 AI 生成的内容。

> **Status**: 已部署并运行中 ✅

## ✨ 核心功能

- **智能自动填充**: 根据用户资料自动填写申请表单
- **AI 实时指导**: 为每个表单字段提供详细解释和填写建议
- **Essay 生成**: 使用 AI 生成高质量的个人陈述和申请文书
- **内容优化**: AI 分析现有内容并提供改进建议
- **多步骤表单**: 友好的逐步填写界面，降低填写压力
- **多学校管理**: 轻松管理多个学校的申请
- **进度跟踪**: 实时查看申请完成进度

## 🏗️ 技术栈

### 前端
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端
- **Next.js API Routes** - 后端 API
- **Prisma** - ORM 数据库访问
- **PostgreSQL** - 主数据库
- **JWT** - 身份认证

### AI 集成
- **OpenAI GPT-4** - AI 内容生成和指导

## 📋 前置要求

- Node.js 18+ 
- PostgreSQL 数据库
- OpenAI API Key

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd school-application-assistant
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/school_application_db"

# OpenAI API Key (必需)
OPENAI_API_KEY="sk-your-openai-api-key"

# JWT 密钥 (生产环境请使用强随机字符串)
JWT_SECRET="your-random-secret-key-change-in-production"

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. 数据库设置

```bash
# 运行数据库迁移
npx prisma migrate dev

# 生成 Prisma Client
npx prisma generate

# (可选) 添加示例学校模板数据
npx ts-node prisma/seed.ts
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
school-application-assistant/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   └── seed.ts                # 示例数据种子
├── src/
│   ├── components/            # React 组件
│   │   ├── Layout.tsx         # 通用布局
│   │   ├── AIGuidancePanel.tsx    # AI 指导面板
│   │   └── FormFieldInput.tsx     # 表单字段输入
│   ├── lib/                   # 库配置
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── openai.ts          # OpenAI 客户端
│   ├── pages/                 # Next.js 页面
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关
│   │   │   ├── profile/       # 用户资料
│   │   │   ├── templates/     # 学校模板
│   │   │   ├── applications/  # 申请管理
│   │   │   └── ai/            # AI 功能
│   │   ├── auth/              # 认证页面
│   │   ├── profile/           # 资料管理
│   │   ├── application/       # 申请表单
│   │   ├── dashboard.tsx      # 控制面板
│   │   └── index.tsx          # 首页
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/                 # 工具函数
│   │   ├── formMatcher.ts     # 表单匹配逻辑
│   │   ├── aiHelper.ts        # AI 辅助函数
│   │   └── auth.ts            # 认证工具
│   └── styles/                # 全局样式
│       └── globals.css
├── .env.example               # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 核心 API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户资料
- `GET /api/profile` - 获取用户资料
- `PUT /api/profile` - 更新用户资料

### 学校模板
- `GET /api/templates` - 获取所有学校模板
- `GET /api/templates/[templateId]` - 获取特定模板
- `POST /api/templates` - 创建新模板 (管理员)

### 申请管理
- `GET /api/applications` - 获取用户所有申请
- `POST /api/applications` - 创建新申请
- `GET /api/applications/[id]` - 获取特定申请
- `PUT /api/applications/[id]` - 更新申请
- `DELETE /api/applications/[id]` - 删除申请

### AI 功能
- `POST /api/ai/field-guidance` - 获取字段填写指导
- `POST /api/ai/generate-essay` - 生成 Essay 内容
- `POST /api/ai/improve-content` - 优化现有内容
- `POST /api/ai/auto-fill` - 自动填充表单

## 💡 使用指南

### 1. 注册账户
访问首页，点击 "Get Started" 创建账户。

### 2. 完善个人资料
登录后，前往 Profile 页面填写：
- 基本信息（姓名、联系方式、国籍等）
- 教育背景
- 工作/实习经历
- Essays（如果已有）

### 3. 创建申请
在 Dashboard 中：
1. 点击 "New Application"
2. 选择目标学校和项目
3. 系统自动创建申请表单

### 4. 填写申请表
两种填写模式：
- **逐步模式**: 一次一个字段，配合 AI 指导
- **全览模式**: 查看所有字段，自由填写

### 5. 使用 AI 功能
- **查看指导**: 每个字段都有 AI 提供的解释和建议
- **生成内容**: 点击 "Generate Content with AI" 自动生成 Essay
- **优化内容**: 对已填写内容点击 "Get Improvement Suggestions"

### 6. 保存和提交
- 随时保存进度
- 完成所有必填项后提交申请

## 🎨 自定义学校模板

可以通过 API 或数据库直接添加新的学校模板：

```typescript
{
  schoolId: "unique-school-id",
  schoolName: "University Name",
  program: "Program Name",
  description: "Program description",
  fields: [
    {
      id: "field-id",
      label: "Field Label",
      type: "text" | "date" | "select" | "essay" | "textarea",
      required: true,
      mapToUserField: "basicInfo.fullName",  // 可选：映射到用户资料
      aiFillRule: "AI 填写规则说明",  // 可选：AI 如何生成内容
      helpText: "帮助文本",
      placeholder: "占位符",
      maxLength: 2000,
      options: ["选项1", "选项2"]  // 仅 select 类型需要
    }
  ]
}
```

## 🔐 安全性

- 密码使用 bcrypt 加密存储
- JWT Token 用于身份认证
- 所有用户数据需要认证访问
- 环境变量保护敏感信息
- 生产环境建议：
  - 使用强 JWT_SECRET
  - 启用 HTTPS
  - 配置 CORS
  - 添加速率限制

## 🧪 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行 Linter
npm run lint

# 数据库迁移
npm run prisma:migrate

# 打开 Prisma Studio (数据库可视化工具)
npm run prisma:studio
```

## 📝 数据库管理

### 查看数据库
```bash
npx prisma studio
```

### 创建新迁移
```bash
npx prisma migrate dev --name migration-name
```

### 重置数据库
```bash
npx prisma migrate reset
```

## 🌐 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量
4. 部署

### 其他平台

确保配置：
- Node.js 18+
- PostgreSQL 数据库
- 所有环境变量

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 License

MIT License

## 🆘 问题排查

### 数据库连接失败
- 检查 PostgreSQL 是否运行
- 验证 DATABASE_URL 配置正确
- 确保数据库已创建

### OpenAI API 错误
- 验证 OPENAI_API_KEY 是否有效
- 检查 API 配额是否充足
- 确认网络可以访问 OpenAI API

### 编译错误
- 删除 `.next` 和 `node_modules` 文件夹
- 重新运行 `npm install`
- 运行 `npx prisma generate`

## 📞 支持

如有问题或建议，请提交 Issue 或联系开发团队。

---

**祝你申请顺利！🎓✨**

