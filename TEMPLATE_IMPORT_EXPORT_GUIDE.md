# 学校模板导入导出完整指南

## 📋 目录
1. [快速开始](#快速开始)
2. [访问管理后台](#访问管理后台)
3. [使用模板示例](#使用模板示例)
4. [导入学校模板](#导入学校模板)
5. [创建自定义模板](#创建自定义模板)
6. [导出申请表](#导出申请表)
7. [字段映射规则](#字段映射规则)
8. [常见问题](#常见问题)

---

## 🚀 快速开始

### 最简单的方式：使用预设模板

我已经为您准备了两个示例模板：

1. **清华大学本科申请** (`template-examples/tsinghua-university.json`)
2. **北京大学研究生申请** (`template-examples/peking-university.json`)

**使用方法**：
1. 打开模板文件
2. 复制 JSON 内容
3. 在管理后台点击"导入模板"
4. 粘贴并导入
5. 完成！

---

## 🔐 访问管理后台

### 方法1：直接访问 URL

部署后访问：
```
https://school-application-assistant.vercel.app/admin/templates
```

### 方法2：从仪表板进入

1. 登录应用
2. 访问 Dashboard
3. 点击"管理模板"链接（需要添加）

---

## 📥 导入学校模板

### 步骤1：准备模板 JSON 文件

#### 模板格式说明

```json
{
  "schoolId": "唯一标识符（英文）",
  "schoolName": "学校中文名称",
  "program": "项目名称",
  "description": "简短描述",
  "isActive": true,
  "fieldsData": [
    {
      "id": "字段ID",
      "label": "字段显示名称",
      "type": "字段类型",
      "required": true/false,
      "aiFillRule": "自动填充规则（可选）",
      "helpText": "帮助文本（可选）",
      "maxLength": 最大长度（可选）
    }
  ]
}
```

#### 支持的字段类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `section` | 分组/章节 | 将多个字段分组 |
| `text` | 单行文本 | 姓名、学校名称等 |
| `email` | 邮箱 | 联系邮箱 |
| `tel` | 电话 | 联系电话 |
| `date` | 日期 | 生日、毕业日期 |
| `textarea` | 多行文本 | 个人陈述、研究计划 |
| `select` | 下拉选择 | 性别、学历等 |
| `number` | 数字 | GPA、分数 |

### 步骤2：在管理后台导入

1. **访问管理后台**：
   ```
   https://your-domain/admin/templates
   ```

2. **点击"导入模板"按钮**

3. **选择导入方式**：
   - **方式A**：上传 JSON 文件
   - **方式B**：直接粘贴 JSON 内容

4. **点击"导入"**

5. **验证导入结果**

---

## 📝 创建自定义模板

### 方法1：复制并修改示例模板

#### 步骤：

1. **打开示例模板文件**
   - `template-examples/tsinghua-university.json`
   - `template-examples/peking-university.json`

2. **复制内容到文本编辑器**

3. **修改以下字段**：
   - `schoolId`: 改为您的学校唯一ID
   - `schoolName`: 改为学校名称
   - `program`: 改为项目名称
   - `description`: 改为描述
   - `fieldsData`: 根据实际申请表修改字段

4. **保存为 JSON 文件**

5. **在管理后台导入**

---

### 方法2：从学校 PDF 申请表创建模板

#### 示例：将 PDF 表单转换为模板

假设您有一份学校的 PDF 申请表，包含以下字段：

```
1. 姓名
2. 性别
3. 出生日期
4. 联系方式
5. 个人陈述（500字）
6. 推荐信
```

**对应的 JSON 模板**：

```json
{
  "schoolId": "your-school-id",
  "schoolName": "某某大学",
  "program": "本科招生",
  "description": "某某大学2024年本科申请",
  "isActive": true,
  "fieldsData": [
    {
      "id": "basic_info",
      "label": "基本信息",
      "type": "section",
      "fields": [
        {
          "id": "name",
          "label": "姓名",
          "type": "text",
          "required": true,
          "aiFillRule": "basicInfo.fullName"
        },
        {
          "id": "gender",
          "label": "性别",
          "type": "select",
          "required": true,
          "options": ["男", "女"]
        },
        {
          "id": "birthday",
          "label": "出生日期",
          "type": "date",
          "required": true,
          "aiFillRule": "basicInfo.birthday"
        },
        {
          "id": "phone",
          "label": "联系方式",
          "type": "tel",
          "required": true,
          "aiFillRule": "basicInfo.phone"
        }
      ]
    },
    {
      "id": "personal_statement",
      "label": "个人陈述",
      "type": "textarea",
      "required": true,
      "maxLength": 500,
      "helpText": "请阐述您的申请理由（500字以内）"
    }
  ]
}
```

---

## 📤 导出申请表

### 支持的导出格式

| 格式 | 适用场景 | 使用方法 |
|------|---------|----------|
| **JSON** | 数据备份、系统迁移 | 点击"导出JSON" |
| **TXT** | 简单查看、打印 | 点击"导出TXT" |
| **HTML** | 美观打印、邮件发送 | 点击"导出HTML" |
| **PDF** | 正式提交 | 浏览器打印HTML为PDF |

### 导出步骤

1. **进入申请详情页**
   - Dashboard → 选择申请 → 查看

2. **点击"导出"按钮**

3. **选择导出格式**：
   - JSON - 包含所有数据的结构化格式
   - TXT - 纯文本，便于复制
   - HTML - 美观的网页格式，可打印

4. **下载文件**

---

### HTML 转 PDF（推荐用于正式提交）

1. **导出为 HTML 格式**

2. **在浏览器中打开 HTML 文件**

3. **按 Ctrl+P（打印）**

4. **选择"另存为 PDF"**

5. **保存 PDF 文件**

✅ 生成的 PDF 格式规范、美观，适合正式提交！

---

## 🔗 字段映射规则（aiFillRule）

### 什么是字段映射？

字段映射告诉系统如何从用户的个人资料中**自动填充**申请表字段。

### 映射路径说明

#### 基本信息映射

| aiFillRule | 对应字段 | 示例 |
|------------|---------|------|
| `basicInfo.fullName` | 用户全名 | "张三" |
| `basicInfo.email` | 邮箱 | "zhangsan@email.com" |
| `basicInfo.phone` | 电话 | "13800138000" |
| `basicInfo.birthday` | 生日 | "2000-01-01" |
| `basicInfo.nationality` | 国籍 | "中国" |

#### 教育背景映射（数组访问）

| aiFillRule | 说明 |
|------------|------|
| `education[0].school` | 最近的学校 |
| `education[0].major` | 最近的专业 |
| `education[0].degree` | 最近的学位 |
| `education[0].gpa` | 最近的 GPA |
| `education[0].startDate` | 开始日期 |
| `education[0].endDate` | 结束日期 |
| `education[1].school` | 第二段教育经历的学校 |

#### 工作/实习经历映射

| aiFillRule | 说明 |
|------------|------|
| `experiences[0].company` | 最近的公司 |
| `experiences[0].position` | 职位 |
| `experiences[0].description` | 工作描述 |
| `experiences[0].startDate` | 开始日期 |
| `experiences[0].endDate` | 结束日期 |

#### Essay/文书映射

| aiFillRule | 说明 |
|------------|------|
| `essays.personalStatement` | 个人陈述 |
| `essays.whyThisSchool` | 为什么选择这所学校 |
| `essays.careerGoals` | 职业目标 |

### 映射示例

```json
{
  "id": "applicant_name",
  "label": "申请人姓名",
  "type": "text",
  "required": true,
  "aiFillRule": "basicInfo.fullName"
}
```

当用户点击"自动填充"时，系统会：
1. 读取用户资料中的 `basicInfo.fullName`
2. 自动填入"申请人姓名"字段
3. 用户可以再手动修改

---

## 🎯 实际应用场景

### 场景1：在线申请表（系统内完成）

**适用**：学校提供在线申请系统，或接受电子版提交

**流程**：
1. 在系统中导入学校模板
2. 用户填写申请（使用 AI 辅助）
3. 导出为 PDF/HTML
4. 提交给学校

---

### 场景2：PDF 表单（半自动）

**适用**：学校提供 PDF 表单需要手填

**流程**：
1. 在系统中导入学校模板（镜像 PDF 字段）
2. 用户在系统中填写（使用 AI 生成内容）
3. 导出为 TXT 或 HTML（方便查看）
4. 用户按照导出内容手动填写 PDF

**优势**：
- ✅ AI 帮助优化内容
- ✅ 保存所有申请记录
- ✅ 可以多次修改

---

### 场景3：学校官网申请（辅助工具）

**适用**：必须在学校官网注册并填写

**流程**：
1. 在系统中导入学校模板（包含所有问题）
2. 用户在系统中准备所有答案（AI 辅助优化）
3. 导出为 HTML 或 TXT
4. 用户边看导出文件，边在学校网站填写

**优势**：
- ✅ 内容提前准备好
- ✅ AI 优化质量更高
- ✅ 不用担心学校网站超时

---

## 📋 模板字段配置最佳实践

### 1. 使用分组（section）组织字段

```json
{
  "id": "education_section",
  "label": "教育背景",
  "type": "section",
  "fields": [
    { "id": "school", "label": "学校", "type": "text" },
    { "id": "major", "label": "专业", "type": "text" }
  ]
}
```

### 2. 添加帮助文本

```json
{
  "id": "gpa",
  "label": "GPA",
  "type": "text",
  "helpText": "请填写4.0制的GPA，保留两位小数"
}
```

### 3. 设置字段验证

```json
{
  "id": "essay",
  "label": "个人陈述",
  "type": "textarea",
  "required": true,
  "maxLength": 800,
  "helpText": "不超过800字"
}
```

### 4. 配置自动填充

```json
{
  "id": "student_name",
  "label": "学生姓名",
  "type": "text",
  "required": true,
  "aiFillRule": "basicInfo.fullName"
}
```

---

## 🔄 从 Excel 创建模板

如果您有学校的 Excel 申请表，可以按照以下步骤转换：

### 步骤1：分析 Excel 表格结构

例如 Excel 包含：

| 字段名 | 类型 | 是否必填 | 说明 |
|--------|------|---------|------|
| 姓名 | 文本 | 是 | |
| 性别 | 选择 | 是 | 男/女 |
| 个人陈述 | 长文本 | 是 | 不超过500字 |

### 步骤2：转换为 JSON 格式

```json
{
  "schoolId": "school-name-2024",
  "schoolName": "学校名称",
  "program": "招生项目",
  "description": "申请表描述",
  "isActive": true,
  "fieldsData": [
    {
      "id": "name",
      "label": "姓名",
      "type": "text",
      "required": true,
      "aiFillRule": "basicInfo.fullName"
    },
    {
      "id": "gender",
      "label": "性别",
      "type": "select",
      "required": true,
      "options": ["男", "女"]
    },
    {
      "id": "personal_statement",
      "label": "个人陈述",
      "type": "textarea",
      "required": true,
      "maxLength": 500
    }
  ]
}
```

### 步骤3：保存并导入

1. 保存为 `.json` 文件
2. 在管理后台导入
3. 完成！

---

## 📤 导出功能详解

### 1. 导出单个申请

**在申请详情页**：

```javascript
// 添加导出按钮到应用界面
<button onClick={() => exportApplication('html')}>
  导出为 HTML
</button>
<button onClick={() => exportApplication('txt')}>
  导出为 TXT
</button>
<button onClick={() => exportApplication('json')}>
  导出为 JSON
</button>
```

**API 调用**：
```
GET /api/applications/[applicationId]/export?format=html
GET /api/applications/[applicationId]/export?format=txt
GET /api/applications/[applicationId]/export?format=json
```

### 2. 导出格式对比

#### JSON 格式
```json
{
  "school": "清华大学",
  "program": "本科招生",
  "applicant": {
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "formData": {
    "name": "张三",
    "essay": "..."
  }
}
```

**适用**：数据备份、系统迁移

#### TXT 格式
```
==========================================
学校申请表
==========================================

学校: 清华大学
项目: 本科招生

申请人信息:
姓名: 张三
邮箱: zhangsan@example.com

【基本信息】
========================================

姓名:
张三

个人陈述:
...
```

**适用**：简单查看、复制粘贴

#### HTML 格式
- 美观的网页格式
- 包含样式
- 可打印为 PDF
- 适合正式提交

---

## 🎯 实际使用流程

### 完整流程示例：清华大学本科申请

#### 第1步：导入清华模板

1. 打开 `template-examples/tsinghua-university.json`
2. 复制内容
3. 在管理后台点击"导入模板"
4. 粘贴并导入

#### 第2步：用户填写申请

1. 用户登录系统
2. 完善个人资料（只需填一次）
3. 选择"清华大学"创建申请
4. 点击"自动填充" - 基本信息自动填入
5. 使用 AI 生成个人陈述
6. 使用 AI 获取改进建议
7. 完成并保存

#### 第3步：导出提交

1. 点击"导出为 HTML"
2. 在浏览器中打开 HTML 文件
3. 按 Ctrl+P 打印
4. 选择"另存为 PDF"
5. 得到规范的 PDF 文件
6. 按学校要求提交（上传或邮寄）

---

## 🔧 高级功能：批量导入

### 导入多个模板

创建一个包含多个模板的 JSON 数组：

```json
[
  {
    "schoolId": "school1",
    "schoolName": "学校1",
    ...
  },
  {
    "schoolId": "school2",
    "schoolName": "学校2",
    ...
  }
]
```

在管理后台导入时，系统会自动创建所有模板。

---

## ❓ 常见问题

### Q1: 如何修改已导入的模板？

**A**: 
1. 在管理后台找到模板
2. 点击"编辑"按钮
3. 修改字段
4. 保存

或者：
1. 导出为 JSON
2. 修改 JSON 文件
3. 重新导入（会覆盖）

### Q2: 如何确保字段自动填充正常工作？

**A**: 
1. 在字段配置中添加 `aiFillRule`
2. 确保规则路径正确（参考映射表）
3. 用户必须先完善个人资料
4. 点击"自动填充"按钮测试

### Q3: 导出的 HTML 如何转成 PDF？

**A**:
1. 在浏览器中打开导出的 HTML 文件
2. 按 Ctrl+P（或右键 → 打印）
3. 目标打印机选择"另存为 PDF"或"Microsoft Print to PDF"
4. 点击"保存"
5. 选择保存位置

### Q4: 可以导入 Excel 文件吗？

**A**: 
目前需要先将 Excel 转换为 JSON 格式。

**快速转换方法**：
1. 在 Excel 中整理好字段列表
2. 使用在线工具转换（如 https://www.convertcsv.com/excel-to-json.htm）
3. 或按照模板手动创建 JSON

### Q5: 如何处理学校官网的申请表？

**A**:
1. 镜像学校官网的所有问题，创建模板
2. 用户在系统中填写并使用 AI 优化
3. 导出为 TXT 或 HTML
4. 用户访问学校官网
5. 复制系统中的答案粘贴到学校网站

---

## 📞 需要帮助？

如果您需要：
- ✅ 为特定学校创建模板
- ✅ 转换 Excel/PDF 为 JSON 模板
- ✅ 添加特殊字段类型
- ✅ 自定义导出格式

随时询问，我会帮您实现！

