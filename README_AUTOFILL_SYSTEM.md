# 学校申请自动填充系统 - 完整文档

## 📋 系统概述

本系统实现了 Chrome 插件与后端 API 的联动，支持：
1. **学校模板绑定** - 解析并上传学校申请页面的字段结构
2. **字段同步** - 将字段模板存储到后台数据库
3. **申请资料获取与自动填充** - 从后台获取学生申请资料并自动填充到网页表单

## 🏗️ 系统架构

```
Chrome 插件 (浏览器端)
├── content-script.js      - 扫描 DOM 表单字段
├── background.js          - API 调用、消息路由
├── popup.html/js          - 用户界面和控制
└── utils/
    ├── detectSchool.js    - URL → schoolId 识别
    └── fillForm.js         - 自动填充逻辑

后端 API (Next.js)
├── POST /api/templates/pushFields          - 上传字段模板
├── GET  /api/templates/:schoolId           - 获取学校模板
├── GET  /api/applicationData/:schoolId/:userId  - 获取申请资料
└── POST /api/applicationData/save          - 保存申请资料

数据库 (PostgreSQL + Prisma)
├── SchoolFormTemplate  - 学校字段模板
└── ApplicationData     - 学生申请资料
```

## 📦 数据库模型

### ApplicationData

```prisma
model ApplicationData {
  id        String   @id @default(cuid())
  schoolId  String
  userId    String
  data      Json     // 申请数据 (key-value 格式)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([schoolId, userId])
  @@index([schoolId])
  @@index([userId])
}
```

## 🔌 API 端点

### 1. POST /api/templates/pushFields

上传学校的字段模板。

**请求示例：**
```json
{
  "schoolId": "oxford_msc_cs",
  "fields": [
    {"key": "personal_statement", "label": "Personal Statement", "type": "text"},
    {"key": "cv", "label": "CV Upload", "type": "file"}
  ]
}
```

**响应：**
```json
{
  "status": "ok",
  "template": {
    "schoolId": "oxford_msc_cs",
    "fields": [...]
  }
}
```

### 2. GET /api/templates/:schoolId

获取学校字段模板。

**响应：**
```json
{
  "success": true,
  "template": {
    "id": "...",
    "schoolId": "oxford_msc_cs",
    "schoolName": "Oxford",
    "program": "General",
    "fields": [...]
  }
}
```

### 3. GET /api/applicationData/:schoolId/:userId

获取学生为该学校填写的申请资料。

**响应：**
```json
{
  "personal_statement": "xxx",
  "cv": "https://cdn/cv123.pdf"
}
```

**注意：** 需要用户认证，且只能访问自己的数据。

### 4. POST /api/applicationData/save

保存学生填写的学校申请资料。

**请求示例：**
```json
{
  "schoolId": "oxford_msc_cs",
  "userId": "user_123",
  "data": {
    "personal_statement": "xxx",
    "cv": "https://cdn/cv123.pdf"
  }
}
```

**响应：**
```json
{
  "status": "ok",
  "applicationData": {
    "id": "...",
    "schoolId": "oxford_msc_cs",
    "userId": "user_123",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 Chrome 插件功能

### 1. 字段扫描 (content-script.js)

自动扫描页面中的表单字段：
- `input[type=text]`
- `textarea`
- `select`
- `radio` / `checkbox`

扫描结果包含：
- `key` - 字段标识（优先使用 name，然后是 id）
- `label` - 字段标签文本
- `type` - 字段类型
- `selector` - CSS 选择器
- `required` - 是否必填
- `description` - 字段描述

### 2. URL → schoolId 识别 (utils/detectSchool.js)

根据 URL 模式自动识别学校 ID：

```javascript
const SCHOOL_URL_PATTERNS = [
  { pattern: /ox\.ac\.uk.*msc.*cs/i, schoolId: "oxford_msc_cs" },
  { pattern: /gradapply\.mit\.edu\/meche/i, schoolId: "mit_meche" },
  // ...
];
```

**使用方式：**
```javascript
const schoolId = detectSchoolId(window.location.href);
```

### 3. 自动填充 (utils/fillForm.js)

支持多种字段类型的自动填充：
- 文本字段 (`input[type=text]`, `textarea`)
- 下拉框 (`select`)
- 复选框 (`checkbox`)
- 单选框 (`radio`)
- 日期字段 (`input[type=date]`)
- 文件字段 (`input[type=file]`) - 仅显示提示

**使用方式：**
```javascript
// 使用数据对象和模板填充
fillFormWithData(applicationData, templateFields);

// 单个字段填充
fillField(selector, value, fieldType);
```

### 4. Popup 界面功能

- **扫描表单** - 扫描当前页面的表单字段
- **上传模板** - 将扫描的字段上传为学校模板
- **自动填充** - 使用学校模板和申请数据自动填充表单
- **学校识别** - 显示当前识别的学校 ID，支持手动选择

## 🚀 使用流程

### 编辑/管理阶段（创建模板）

1. 用户访问学校申请页面
2. 点击插件图标，打开 Popup
3. 点击"扫描表单"按钮，扫描页面字段
4. 系统自动识别学校 ID（或手动选择）
5. 点击"上传模板"按钮，将字段结构推送到后台
6. 后台保存为 `SchoolFormTemplate`

### 申请阶段（自动填充）

1. 用户访问学校申请页面
2. 系统自动识别学校 ID
3. 点击"自动填充"按钮
4. 插件从后台获取：
   - 学校模板 (`GET /api/templates/:schoolId`)
   - 申请数据 (`GET /api/applicationData/:schoolId/:userId`)
5. 使用模板和数据自动填充表单

## 📝 配置说明

### 环境变量

后端需要配置：
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

### Chrome 插件配置

在 `background.js` 中配置 API 地址：
```javascript
async function getApiBaseUrl() {
  const result = await chrome.storage.local.get('autofill_api_url');
  return result.autofill_api_url || 'http://localhost:3000';
}
```

可以通过 Popup 设置界面配置 API 地址。

## 🔐 安全考虑

1. **用户认证** - 所有 API 请求需要 JWT Token
2. **数据隔离** - 用户只能访问自己的申请数据
3. **CORS 配置** - 后端需要正确配置 CORS，允许 Chrome 扩展的请求

## 🛠️ 开发说明

### 数据库迁移

添加 `ApplicationData` 模型后，需要运行迁移：

```bash
npx prisma migrate dev --name add_application_data
```

### 测试 API

#### 方法 1: 使用浏览器测试（最简单）

1. **启动开发服务器**
   ```bash
   npm run dev
   ```
   服务器会在 `http://localhost:3000` 启动

2. **测试获取模板 API（无需认证）**
   - 打开浏览器，访问：`http://localhost:3000/api/templates/oxford_msc_cs`
   - 如果模板不存在，会返回 404
   - 如果存在，会显示 JSON 格式的模板数据

3. **测试上传模板 API（无需认证）**
   - 打开浏览器开发者工具（F12）
   - 在 Console 中运行：
   ```javascript
   fetch('http://localhost:3000/api/templates/pushFields', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       schoolId: "oxford_msc_cs",
       fields: [
         { key: "personal_statement", label: "Personal Statement", type: "text" }
       ]
     })
   })
   .then(r => r.json())
   .then(console.log)
   ```

#### 方法 2: 使用 PowerShell 测试（Windows）

1. **打开 PowerShell**（在项目目录下）

2. **测试上传模板**（无需认证）
   ```powershell
   $body = @{
       schoolId = "oxford_msc_cs"
       fields = @(
           @{
               key = "personal_statement"
               label = "Personal Statement"
               type = "text"
           }
       )
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3000/api/templates/pushFields" `
       -Method POST `
       -ContentType "application/json" `
       -Body $body
   ```

3. **测试获取模板**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/api/templates/oxford_msc_cs"
   ```

4. **测试保存申请数据（需要先登录获取 Token）**
   
   首先登录获取 Token：
   ```powershell
   $loginBody = @{
       email = "your-email@example.com"
       password = "your-password"
   } | ConvertTo-Json

   $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
       -Method POST `
       -ContentType "application/json" `
       -Body $loginBody

   $token = $response.token
   ```

   然后使用 Token 保存数据：
   ```powershell
   $dataBody = @{
       schoolId = "oxford_msc_cs"
       userId = $response.user.id
       data = @{
           personal_statement = "这是我的个人陈述"
       }
   } | ConvertTo-Json -Depth 10

   Invoke-RestMethod -Uri "http://localhost:3000/api/applicationData/save" `
       -Method POST `
       -ContentType "application/json" `
       -Headers @{ "Authorization" = "Bearer $token" } `
       -Body $dataBody
   ```

#### 方法 3: 使用 Postman 或 Insomnia（推荐）

1. **下载 Postman**：https://www.postman.com/downloads/

2. **创建请求**：
   - **上传模板**：
     - Method: `POST`
     - URL: `http://localhost:3000/api/templates/pushFields`
     - Headers: `Content-Type: application/json`
     - Body (raw JSON):
       ```json
       {
         "schoolId": "oxford_msc_cs",
         "fields": [
           {
             "key": "personal_statement",
             "label": "Personal Statement",
             "type": "text"
           }
         ]
       }
       ```

   - **获取模板**：
     - Method: `GET`
     - URL: `http://localhost:3000/api/templates/oxford_msc_cs`

   - **保存申请数据**：
     - Method: `POST`
     - URL: `http://localhost:3000/api/applicationData/save`
     - Headers: 
       - `Content-Type: application/json`
       - `Authorization: Bearer YOUR_TOKEN`
     - Body (raw JSON):
       ```json
       {
         "schoolId": "oxford_msc_cs",
         "userId": "user_id_here",
         "data": {
           "personal_statement": "xxx"
         }
       }
       ```

#### 方法 4: 使用 curl（Linux/Mac/Git Bash）

```bash
# 上传模板
curl -X POST http://localhost:3000/api/templates/pushFields \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "oxford_msc_cs",
    "fields": [
      {"key": "personal_statement", "label": "Personal Statement", "type": "text"}
    ]
  }'

# 获取模板
curl http://localhost:3000/api/templates/oxford_msc_cs

# 保存申请数据（需要先登录获取 TOKEN）
# 1. 先登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  -c cookies.txt

# 2. 使用 Token 保存数据
curl -X POST http://localhost:3000/api/applicationData/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "schoolId": "oxford_msc_cs",
    "userId": "user_123",
    "data": {"personal_statement": "xxx"}
  }'
```

#### 快速测试步骤

1. **确保开发服务器运行**：
   ```bash
   npm run dev
   ```

2. **在浏览器中测试最简单的 API**：
   - 访问 `http://localhost:3000/api/templates/oxford_msc_cs`
   - 如果返回 JSON 或 404，说明 API 正常工作

3. **使用浏览器控制台测试 POST 请求**（见方法 1）

4. **使用 Postman 进行完整测试**（推荐，最方便）

## 📚 文件结构

```
src/
├── pages/api/
│   ├── templates/
│   │   └── pushFields.ts          # 上传字段模板 API
│   └── applicationData/
│       ├── [schoolId]/[userId].ts # 获取申请资料 API
│       └── save.ts                # 保存申请资料 API
└── modules/autofill/
    └── chrome-extension/
        ├── manifest.json
        ├── background.js          # 后台脚本（API 调用）
        ├── content.js             # 内容脚本（字段扫描）
        ├── popup.html             # Popup 界面
        ├── popup.js               # Popup 逻辑
        └── utils/
            ├── detectSchool.js    # URL 识别
            └── fillForm.js        # 自动填充
```

## 🎯 未来扩展

1. **批量填充** - 支持多表单同时填充
2. **模板共享** - 用户可分享映射规则
3. **AI 增强识别** - 使用 AI 分析表单结构
4. **多浏览器支持** - Firefox、Edge 扩展

## 📞 问题排查

### 插件无法识别学校

- 检查 URL 是否匹配 `SCHOOL_URL_PATTERNS`
- 可以手动在 Popup 中选择学校

### 自动填充失败

- 检查是否已登录
- 检查是否已保存申请数据
- 检查字段选择器是否正确

### API 请求失败

- 检查 CORS 配置
- 检查 JWT Token 是否有效
- 检查 API 地址配置

