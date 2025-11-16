# 📂 项目文件结构 (File Structure)

完整的项目文件清单和说明。

## 📋 目录概览

```
school-application-assistant/
├── 📁 prisma/                      # Prisma ORM 配置
├── 📁 src/                         # 源代码目录
│   ├── 📁 components/              # React 组件
│   ├── 📁 lib/                     # 库和配置
│   ├── 📁 pages/                   # Next.js 页面和 API
│   ├── 📁 styles/                  # 全局样式
│   ├── 📁 types/                   # TypeScript 类型
│   └── 📁 utils/                   # 工具函数
├── 📄 配置文件                     # 项目配置
└── 📄 文档文件                     # 说明文档
```

---

## 🗂️ 详细文件清单

### 根目录文件

| 文件名 | 类型 | 说明 |
|--------|------|------|
| `package.json` | 配置 | npm 依赖和脚本配置 |
| `tsconfig.json` | 配置 | TypeScript 编译配置 |
| `next.config.js` | 配置 | Next.js 框架配置 |
| `tailwind.config.js` | 配置 | Tailwind CSS 样式配置 |
| `postcss.config.js` | 配置 | PostCSS 配置 |
| `.eslintrc.json` | 配置 | ESLint 代码规范配置 |
| `.env.example` | 模板 | 环境变量示例文件 |
| `.gitignore` | 配置 | Git 忽略文件配置 |

### 文档文件

| 文件名 | 说明 |
|--------|------|
| `README.md` | 项目主文档，功能介绍和使用指南 |
| `QUICKSTART.md` | 5分钟快速启动指南 |
| `INSTALLATION.md` | 完整安装步骤和故障排查 |
| `DEPLOYMENT.md` | 生产环境部署指南 |
| `PROJECT_SUMMARY.md` | 项目技术总览和架构说明 |
| `FILE_STRUCTURE.md` | 本文件，项目结构说明 |

---

## 📁 prisma/ 目录

数据库相关文件

```
prisma/
├── schema.prisma          # Prisma 数据库模型定义
└── seed.ts               # 数据库种子数据脚本
```

### 文件说明

#### `schema.prisma`
- **用途**: 定义数据库模型和关系
- **内容**: 
  - User (用户)
  - UserProfile (用户资料)
  - SchoolFormTemplate (学校模板)
  - Application (申请)
  - AIConversation (AI 对话)

#### `seed.ts`
- **用途**: 初始化示例数据
- **运行**: `npm run prisma:seed`
- **内容**: 3个示例学校模板（Harvard, Stanford, MIT）

---

## 📁 src/ 目录

主要源代码目录

### 📁 src/components/ - React 组件

```
src/components/
├── Layout.tsx              # 通用页面布局组件
├── FormFieldInput.tsx      # 表单字段输入组件
└── AIGuidancePanel.tsx     # AI 指导面板组件
```

#### 组件详情

| 组件名 | 功能 | 依赖 |
|--------|------|------|
| `Layout.tsx` | 导航栏、页面框架、用户菜单 | lucide-react |
| `FormFieldInput.tsx` | 多类型表单输入渲染 | @/types |
| `AIGuidancePanel.tsx` | AI 指导、生成、优化 | @/types, API |

---

### 📁 src/lib/ - 库配置

```
src/lib/
├── prisma.ts              # Prisma Client 初始化
└── openai.ts              # OpenAI API 客户端
```

#### 文件详情

| 文件名 | 功能 | 导出 |
|--------|------|------|
| `prisma.ts` | 数据库连接池 | `prisma` |
| `openai.ts` | OpenAI 客户端 | `openai` |

---

### 📁 src/pages/ - 页面和路由

```
src/pages/
├── _app.tsx                # Next.js 应用入口
├── index.tsx               # 首页（营销页面）
│
├── auth/                   # 认证相关页面
│   ├── login.tsx          # 登录页面
│   └── register.tsx       # 注册页面
│
├── profile/               # 用户资料页面
│   ├── index.tsx         # 资料编辑页面
│   └── setup.tsx         # 首次设置引导
│
├── application/          # 申请相关页面
│   └── [applicationId].tsx  # 动态申请表单页面
│
├── dashboard.tsx         # 用户控制面板
│
└── api/                  # API 路由
    ├── auth/
    │   ├── login.ts
    │   └── register.ts
    ├── profile/
    │   └── index.ts
    ├── templates/
    │   ├── index.ts
    │   └── [templateId].ts
    ├── applications/
    │   ├── index.ts
    │   └── [applicationId].ts
    └── ai/
        ├── field-guidance.ts
        ├── generate-essay.ts
        ├── improve-content.ts
        └── auto-fill.ts
```

#### 页面组件详情

| 页面路径 | 文件 | 功能 | 认证 |
|---------|------|------|------|
| `/` | `index.tsx` | 首页营销页面 | ❌ |
| `/auth/login` | `auth/login.tsx` | 用户登录 | ❌ |
| `/auth/register` | `auth/register.tsx` | 用户注册 | ❌ |
| `/dashboard` | `dashboard.tsx` | 申请列表管理 | ✅ |
| `/profile` | `profile/index.tsx` | 编辑个人资料 | ✅ |
| `/profile/setup` | `profile/setup.tsx` | 首次设置引导 | ✅ |
| `/application/[id]` | `application/[applicationId].tsx` | 填写申请表单 | ✅ |

#### API 路由详情

| 端点 | 文件 | 方法 | 功能 | 认证 |
|------|------|------|------|------|
| `/api/auth/login` | `api/auth/login.ts` | POST | 用户登录 | ❌ |
| `/api/auth/register` | `api/auth/register.ts` | POST | 用户注册 | ❌ |
| `/api/profile` | `api/profile/index.ts` | GET, PUT | 获取/更新资料 | ✅ |
| `/api/templates` | `api/templates/index.ts` | GET, POST | 列表/创建模板 | GET:❌ POST:✅ |
| `/api/templates/:id` | `api/templates/[templateId].ts` | GET | 获取特定模板 | ❌ |
| `/api/applications` | `api/applications/index.ts` | GET, POST | 列表/创建申请 | ✅ |
| `/api/applications/:id` | `api/applications/[applicationId].ts` | GET, PUT, DELETE | 管理申请 | ✅ |
| `/api/ai/field-guidance` | `api/ai/field-guidance.ts` | POST | 字段填写指导 | ✅ |
| `/api/ai/generate-essay` | `api/ai/generate-essay.ts` | POST | 生成 Essay | ✅ |
| `/api/ai/improve-content` | `api/ai/improve-content.ts` | POST | 优化内容 | ✅ |
| `/api/ai/auto-fill` | `api/ai/auto-fill.ts` | POST | 自动填充表单 | ✅ |

---

### 📁 src/styles/ - 样式文件

```
src/styles/
└── globals.css            # 全局 CSS 样式
```

#### 样式说明

**globals.css** 包含：
- Tailwind CSS 导入
- 自定义 CSS 类（btn-primary, btn-secondary, input-field, card）
- 全局样式配置
- 主题颜色变量

---

### 📁 src/types/ - TypeScript 类型定义

```
src/types/
└── index.ts              # 所有类型定义
```

#### 主要类型

| 类型名 | 说明 |
|--------|------|
| `BasicInfo` | 基本信息 |
| `Education` | 教育背景 |
| `Experience` | 工作/实习经历 |
| `Essays` | 文书内容 |
| `UserProfileData` | 完整用户资料 |
| `FieldType` | 字段类型枚举 |
| `FormField` | 表单字段定义 |
| `SchoolFormTemplateData` | 学校模板 |
| `AIGuidance` | AI 指导内容 |
| `ApplicationFormData` | 申请表单数据 |
| `AIMessage` | AI 对话消息 |

---

### 📁 src/utils/ - 工具函数

```
src/utils/
├── formMatcher.ts         # 表单匹配和自动填充
├── aiHelper.ts            # AI 辅助功能
└── auth.ts                # 认证工具函数
```

#### 工具函数详情

**formMatcher.ts**
| 函数 | 功能 |
|------|------|
| `autoFillFormFromProfile()` | 自动填充表单 |
| `getMissingRequiredFields()` | 获取缺失必填项 |
| `getAutoFillableFields()` | 获取可自动填充字段 |
| `validateFormData()` | 验证表单数据 |
| `calculateFormCompletion()` | 计算完成百分比 |

**aiHelper.ts**
| 函数 | 功能 |
|------|------|
| `generateFieldGuidance()` | 生成字段指导 |
| `generateEssayContent()` | 生成 Essay |
| `improveContent()` | 优化现有内容 |
| `chatWithAI()` | AI 对话接口 |

**auth.ts**
| 函数 | 功能 |
|------|------|
| `authenticate()` | JWT Token 验证 |

---

## 📊 文件统计

### 代码文件

| 类型 | 数量 | 说明 |
|------|------|------|
| 页面组件 | 8 | React 页面 |
| 通用组件 | 3 | 可复用组件 |
| API 路由 | 12 | 后端接口 |
| 工具函数 | 3 | 辅助函数 |
| 类型定义 | 1 | TypeScript 类型 |
| **总计** | **27** | **主要代码文件** |

### 配置文件

| 类型 | 数量 |
|------|------|
| 项目配置 | 6 |
| 数据库配置 | 2 |
| 文档文件 | 6 |
| **总计** | **14** |

### 代码行数估算

| 分类 | 行数 |
|------|------|
| TypeScript/React | ~4,500 |
| API 路由 | ~1,200 |
| 工具函数 | ~600 |
| 类型定义 | ~200 |
| 样式 | ~150 |
| 配置 | ~200 |
| 文档 | ~3,000 |
| **总计** | **~9,850** |

---

## 🎯 核心文件说明

### 最重要的文件（必读）

1. **`prisma/schema.prisma`**
   - 定义整个数据库结构
   - 理解数据模型和关系

2. **`src/types/index.ts`**
   - 所有 TypeScript 类型定义
   - 理解数据结构

3. **`src/utils/formMatcher.ts`**
   - 核心业务逻辑
   - 表单自动匹配算法

4. **`src/utils/aiHelper.ts`**
   - AI 功能实现
   - OpenAI API 调用

5. **`src/pages/application/[applicationId].tsx`**
   - 最复杂的页面
   - 综合展示所有功能

---

## 📝 修改建议

### 要自定义学校模板

修改：`prisma/seed.ts`

### 要修改 UI 样式

修改：
- `tailwind.config.js` (颜色、间距)
- `src/styles/globals.css` (全局样式)

### 要添加新页面

1. 在 `src/pages/` 创建新文件
2. 使用 `Layout` 组件包裹
3. 在导航中添加链接

### 要添加新 API

1. 在 `src/pages/api/` 创建新文件
2. 实现 handler 函数
3. 添加认证（如需要）

---

## 🔍 快速查找

### 找特定功能的代码？

| 功能 | 文件位置 |
|------|---------|
| 用户注册 | `src/pages/auth/register.tsx`, `src/pages/api/auth/register.ts` |
| 用户登录 | `src/pages/auth/login.tsx`, `src/pages/api/auth/login.ts` |
| 编辑资料 | `src/pages/profile/index.tsx`, `src/pages/api/profile/index.ts` |
| 申请列表 | `src/pages/dashboard.tsx` |
| 填写表单 | `src/pages/application/[applicationId].tsx` |
| AI 指导 | `src/components/AIGuidancePanel.tsx`, `src/utils/aiHelper.ts` |
| 自动填充 | `src/utils/formMatcher.ts`, `src/pages/api/ai/auto-fill.ts` |
| 数据库模型 | `prisma/schema.prisma` |

---

## 🛠️ 开发工作流

### 添加新功能的典型流程

1. **更新类型定义** (`src/types/index.ts`)
2. **修改数据库模型** (`prisma/schema.prisma`)
3. **运行迁移** (`npx prisma migrate dev`)
4. **创建 API 路由** (`src/pages/api/`)
5. **创建前端页面** (`src/pages/`)
6. **添加组件** (`src/components/`)
7. **测试功能**

---

## 📚 相关文档

- [README.md](./README.md) - 项目介绍
- [INSTALLATION.md](./INSTALLATION.md) - 安装指南
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 技术详解

---

**最后更新**: 2024年11月

