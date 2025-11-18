# 学校申请表单自动填充系统 - 总体架构方案

## 📋 系统概述

本系统旨在构建一个可自动/半自动识别并填充学校申请表单的 Chrome 扩展，配合后端 API 服务，实现智能表单填充功能。

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome 扩展（浏览器端）                    │
├─────────────────────────────────────────────────────────────┤
│  Content Script (content.js)                                │
│  ├─ 表单字段扫描与识别                                        │
│  ├─ 右键菜单绑定功能                                          │
│  ├─ 自动填充执行                                              │
│  └─ DOM 监听与更新                                            │
│                                                              │
│  Background Script (background.js)                           │
│  ├─ API 请求管理                                              │
│  ├─ 数据缓存（Chrome Storage）                               │
│  ├─ 消息路由                                                  │
│  └─ 上下文菜单管理                                            │
│                                                              │
│  Popup UI (popup.html)                                       │
│  ├─ 调试面板                                                  │
│  ├─ 字段映射预览                                              │
│  ├─ 手动控制                                                  │
│  └─ 设置管理                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│            school-application-assistant 后端                 │
├─────────────────────────────────────────────────────────────┤
│  API Endpoints                                               │
│  ├─ GET  /api/profile          - 获取用户资料数据            │
│  ├─ POST /api/autofill/detect  - 字段识别与匹配              │
│  └─ POST /api/autofill/save-mapping - 保存字段映射规则       │
│                                                              │
│  数据存储（PostgreSQL + Prisma）                             │
│  ├─ UserProfile              - 用户资料数据                  │
│  ├─ FieldMapping             - 字段映射规则                  │
│  └─ SchoolFormTemplate       - 学校表单模板                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 核心功能模块

### 1. 表单字段识别（Content Script）

#### 1.1 识别方式

**A. HTML 属性识别**
- `id` 属性
- `name` 属性
- `placeholder` 属性
- `label[for]` 关联

**B. 标签文本识别**
- 查找相邻的 `<label>` 元素
- 查找父容器中的文本标签
- 查找 `aria-label` 属性

**C. 上下文识别**
- DOM 结构分析（字段分组、区块标题）
- 字段顺序规律
- 表单类型推断（input type）

#### 1.2 字段信息提取

```javascript
{
  selector: "#firstName",           // CSS选择器
  id: "firstName",                  // ID属性
  name: "givenName",                // Name属性
  placeholder: "First Name",        // Placeholder文本
  label: "First Name",              // 关联的Label文本
  tag: "input",                     // 元素标签
  type: "text",                     // Input类型
  required: true,                   // 是否必填
  context: {                        // 上下文信息
    section: "Personal Information",
    position: 1,
    nearbyFields: ["lastName", "email"]
  }
}
```

### 2. 自动匹配字段逻辑

#### 2.1 匹配优先级

1. **用户自定义映射**（优先级最高）
   - 从 `FieldMapping` 表读取
   - 按 `domain + selector` 精确匹配
   - 置信度：0.99

2. **智能关键字匹配**
   - 使用关键字词典
   - 支持多语言识别
   - 置信度：0.6-0.9

3. **模糊匹配**（可选）
   - Levenshtein 距离
   - 字符串相似度
   - 置信度：0.4-0.7

#### 2.2 字段映射表

| 网页字段关键词 | 系统字段 | 置信度 |
|--------------|---------|--------|
| first name, given name, 名字 | `given_name` | 0.9 |
| last name, family name, 姓 | `family_name` | 0.9 |
| email, 邮箱 | `email` | 0.95 |
| phone, mobile, 电话 | `phone` | 0.85 |
| date of birth, dob, 出生日期 | `dob` | 0.8 |
| personal statement, 个人陈述 | `personal_statement` | 0.7 |
| school name, 学校名称 | `school_name` | 0.75 |

### 3. 手动标签绑定系统

#### 3.1 右键菜单功能

用户右键点击表单字段时，显示上下文菜单：

```
将此字段绑定到 →
  ├─ given_name（名字）
  ├─ family_name（姓）
  ├─ email（邮箱）
  ├─ phone（电话）
  ├─ dob（出生日期）
  ├─ personal_statement（个人陈述）
  └─ ...（更多字段）
```

#### 3.2 绑定数据存储

绑定信息保存到：
- **Chrome Storage**（本地缓存，快速访问）
- **后端数据库**（持久化，跨设备同步）

存储格式：
```json
{
  "domain": "apply.stanford.edu",
  "selector": "#firstName",
  "profileField": "given_name",
  "domId": "firstName",
  "domName": "givenName"
}
```

### 4. 数据获取与填充

#### 4.1 用户资料 API

**Endpoint**: `GET /api/profile`

**响应格式**:
```json
{
  "success": true,
  "profile": {
    "fullName": "Liang Wang",
    "phone": "+86 13800138000",
    "birthday": "2001-06-22",
    "nationality": "Chinese",
    "email": "liang@example.com",
    "education": [...],
    "experiences": [...],
    "essays": {
      "personal_statement": "I am passionate about...",
      "statement_of_purpose": "..."
    },
    "additional": {...}
  }
}
```

#### 4.2 字段映射与填充

1. 扩展获取用户资料数据
2. 根据匹配规则映射到表单字段
3. 执行填充操作：
   - 设置 `value` 属性
   - 触发 `input` 事件
   - 触发 `change` 事件
   - 处理特殊字段（日期、选择框等）

### 5. 工作流程

#### 5.1 首次访问新网站

```
1. 用户进入学校申请网站
   ↓
2. 扩展自动扫描表单字段
   ↓
3. 发送字段信息到后端进行匹配
   ↓
4. 显示匹配结果（置信度）
   ↓
5. 用户确认或手动绑定字段
   ↓
6. 保存映射规则
   ↓
7. 执行自动填充
```

#### 5.2 再次访问（已保存映射）

```
1. 用户进入已识别的网站
   ↓
2. 扩展读取保存的映射规则
   ↓
3. 直接执行精准填充
   ↓
4. 无需用户干预
```

### 6. 扩展功能

#### 6.1 调试面板（Popup UI）

显示信息：
- ✅ 检测到的表单字段列表
- ✅ 字段匹配结果（置信度）
- ✅ 用户绑定规则
- ✅ 准备填充的数据预览
- ✅ 填充状态（成功/失败）

功能：
- 手动触发扫描
- 手动触发填充
- 清除映射规则
- 导出/导入配置

#### 6.2 自动检测新网站

首次访问时弹出提示：
```
🔍 检测到新的申请表单

这是一个未识别的表单，是否开启自动识别？

[ 是，尝试自动识别 ]  [ 我将手动绑定 ]  [ 稍后提醒 ]
```

#### 6.3 学习机制

- 记录用户的手动绑定操作
- 分析常见字段模式
- 提升自动识别准确度
- 支持批量导入映射规则

## 📁 文件结构

```
school-application-assistant/
├── src/
│   ├── modules/
│   │   └── autofill/
│   │       ├── chrome-extension/
│   │       │   ├── manifest.json          # 扩展配置
│   │       │   ├── content.js             # 内容脚本（字段识别、填充）
│   │       │   ├── background.js          # 后台脚本（API、消息路由）
│   │       │   ├── popup.html             # 弹出界面
│   │       │   ├── popup.js               # 弹出界面逻辑
│   │       │   ├── popup.css              # 弹出界面样式
│   │       │   └── icons/                 # 图标资源
│   │       ├── api/
│   │       │   ├── detectFields.ts        # 字段识别API处理
│   │       │   └── saveMapping.ts         # 保存映射API处理
│   │       └── utils/
│   │           ├── matcher.ts             # 字段匹配逻辑
│   │           ├── fieldScanner.ts        # 字段扫描工具
│   │           └── filler.ts               # 填充执行工具
│   └── pages/
│       └── api/
│           ├── profile/
│           │   └── index.ts               # 用户资料API
│           └── autofill/
│               ├── detect.ts              # 字段识别端点
│               └── save-mapping.ts        # 保存映射端点
└── ARCHITECTURE.md                        # 本文档
```

## 🔐 安全考虑

1. **认证机制**
   - 使用 JWT Token 进行用户认证
   - API 请求携带 Authorization Header

2. **数据隐私**
   - 用户资料数据仅存储在用户自己的数据库中
   - 字段映射规则按用户隔离

3. **CORS 配置**
   - 后端 API 需要正确配置 CORS
   - 允许 Chrome 扩展的 Origin

## 🚀 部署说明

### Chrome 扩展打包

1. 开发模式：直接加载 `src/modules/autofill/chrome-extension/` 目录
2. 生产模式：使用构建脚本打包为 `.crx` 文件

### 后端 API

- 部署到 Vercel/其他平台
- 配置环境变量（DATABASE_URL, JWT_SECRET）
- 确保 CORS 配置正确

## 📊 数据流图

```
用户操作
   ↓
Content Script (扫描字段)
   ↓
Background Script (发送到后端)
   ↓
API: /api/autofill/detect
   ↓
Matcher (匹配字段)
   ↓
返回匹配结果
   ↓
Content Script (显示匹配/执行填充)
   ↓
用户确认/手动绑定
   ↓
API: /api/autofill/save-mapping
   ↓
保存到数据库
   ↓
下次自动使用
```

## 🎯 未来扩展

1. **AI 增强识别**
   - 使用 GPT/Claude 分析表单结构
   - 智能推断字段含义

2. **多浏览器支持**
   - Firefox 扩展
   - Edge 扩展

3. **模板共享**
   - 用户可分享映射规则
   - 社区维护常见学校模板

4. **批量填充**
   - 支持多表单同时填充
   - 批量申请管理

