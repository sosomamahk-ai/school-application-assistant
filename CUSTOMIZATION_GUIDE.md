# 学校申请助手定制指南

## 📋 目录
1. [中文化配置](#中文化配置)
2. [学校模板配置](#学校模板配置)
3. [不同申请方式的处理](#不同申请方式的处理)
4. [字段映射规则](#字段映射规则)

---

## 🌐 中文化配置

### 方法1：使用翻译配置文件（推荐）

已创建：`src/config/translations.ts`

修改此文件中的任何文案即可更改应用显示的文字。

### 方法2：直接修改页面文件

需要修改的主要文件：
- `src/pages/index.tsx` - 首页
- `src/pages/auth/login.tsx` - 登录页
- `src/pages/auth/register.tsx` - 注册页
- `src/pages/dashboard.tsx` - 仪表板
- `src/pages/profile/index.tsx` - 个人资料页

---

## 🎓 学校模板配置

### 学校模板数据结构

每个学校模板包含以下字段：

```typescript
{
  id: string;              // 唯一标识符
  schoolId: string;        // 学校代码
  schoolName: string;      // 学校名称（中文）
  program: string;         // 项目名称
  description: string;     // 描述
  fieldsData: JSON;        // 表单字段配置
  isActive: boolean;       // 是否启用
}
```

### 字段类型支持

| 字段类型 | 用途 | 示例 |
|---------|------|------|
| `section` | 分组 | 基本信息、教育背景 |
| `text` | 单行文本 | 姓名、学校名称 |
| `email` | 邮箱 | 联系邮箱 |
| `tel` | 电话 | 联系电话 |
| `date` | 日期 | 生日、毕业日期 |
| `textarea` | 多行文本 | 个人陈述、研究计划 |
| `select` | 下拉选择 | 学历、专业类别 |

### 添加新学校模板示例

```sql
INSERT INTO "SchoolFormTemplate" (
  "id", 
  "schoolId", 
  "schoolName", 
  "program", 
  "description", 
  "fieldsData", 
  "isActive", 
  "createdAt", 
  "updatedAt"
)
VALUES (
  'fudan-undergrad',
  'fudan-university',
  '复旦大学',
  '本科招生',
  '复旦大学本科生综合评价招生',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'basic',
      'label', '基本信息',
      'type', 'section',
      'fields', jsonb_build_array(
        jsonb_build_object(
          'id', 'name',
          'label', '姓名',
          'type', 'text',
          'required', true,
          'aiFillRule', 'basicInfo.fullName'
        )
      )
    ),
    jsonb_build_object(
      'id', 'essay',
      'label', '个人陈述',
      'type', 'textarea',
      'required', true,
      'maxLength', 1000,
      'helpText', '请阐述您选择复旦大学的原因'
    )
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

---

## 📝 不同申请方式的处理

### 类型1：在线申请表（当前支持）

**适用场景**：学校提供在线申请系统

**工作流程**：
1. 用户在我们的系统中填写信息
2. AI 帮助生成内容
3. 用户复制填写到学校网站

**优点**：
- ✅ 可以使用 AI 辅助
- ✅ 保存申请进度
- ✅ 多次修改

### 类型2：PDF 表单填写

**适用场景**：学校提供 PDF 申请表

**解决方案A：生成填写指南**

在学校模板中添加 `applicationType` 字段：

```sql
UPDATE "SchoolFormTemplate" 
SET "fieldsData" = jsonb_set(
  "fieldsData", 
  '{applicationType}', 
  '"pdf"'
)
WHERE "schoolId" = 'your-school-id';
```

**解决方案B：导出为 PDF**

添加 "导出为 PDF" 功能：
1. 用户在系统中完成填写
2. 点击"导出 PDF"按钮
3. 生成预填充的 PDF 文件
4. 用户下载打印提交

### 类型3：学校官网注册申请

**适用场景**：需要在学校网站注册账号填写

**工作流程**：
1. 在我们的系统中准备所有内容
2. 使用 AI 生成优化的答案
3. 提供"申请检查清单"
4. 用户逐项复制到学校网站

**配置示例**：

```sql
INSERT INTO "SchoolFormTemplate" (
  "id",
  "schoolId",
  "schoolName",
  "program",
  "description",
  "fieldsData",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'external-application',
  'external-school',
  '某大学（需在官网申请）',
  '本科招生',
  '请在准备好所有材料后，访问学校官网完成申请',
  jsonb_build_object(
    'applicationType', 'external',
    'externalUrl', 'https://school-website.com/apply',
    'instructions', '1. 先在本系统准备材料\n2. 访问学校官网注册\n3. 复制填写内容',
    'fields', jsonb_build_array(
      jsonb_build_object(
        'id', 'personal_statement',
        'label', '个人陈述',
        'type', 'textarea',
        'required', true,
        'helpText', '准备好后复制到学校申请系统'
      )
    )
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

---

## 🔗 字段自动映射规则

### 配置 aiFillRule

在字段配置中添加 `aiFillRule` 来启用自动填充：

```json
{
  "id": "student_name",
  "label": "学生姓名",
  "type": "text",
  "required": true,
  "aiFillRule": "basicInfo.fullName"
}
```

### 支持的映射路径

#### 基本信息
- `basicInfo.fullName` - 全名
- `basicInfo.email` - 邮箱
- `basicInfo.phone` - 电话
- `basicInfo.birthday` - 生日
- `basicInfo.nationality` - 国籍

#### 教育背景（数组，使用索引访问）
- `education[0].school` - 第一段教育的学校
- `education[0].major` - 第一段教育的专业
- `education[0].degree` - 第一段教育的学位
- `education[0].startDate` - 开始日期
- `education[0].endDate` - 结束日期
- `education[0].gpa` - GPA

#### 工作/实习经历
- `experiences[0].company` - 第一份工作的公司
- `experiences[0].position` - 职位
- `experiences[0].description` - 工作描述
- `experiences[0].startDate` - 开始日期
- `experiences[0].endDate` - 结束日期

#### 文书/Essay
- `essays.personalStatement` - 个人陈述
- `essays.whyThisSchool` - 为什么选择这所学校
- `essays.careerGoals` - 职业目标

---

## 🎯 实际应用示例

### 示例1：清华大学本科申请

**申请方式**：在线申请系统

**配置**：
```sql
INSERT INTO "SchoolFormTemplate" ("id", "schoolId", "schoolName", "program", "description", "fieldsData", "isActive", "createdAt", "updatedAt")
VALUES (
  'tsinghua-undergrad-2024',
  'tsinghua-university',
  '清华大学',
  '2024年本科招生',
  '清华大学本科生综合评价招生申请',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'personal',
      'label', '个人信息',
      'type', 'section',
      'fields', jsonb_build_array(
        jsonb_build_object('id', 'name', 'label', '姓名', 'type', 'text', 'required', true, 'aiFillRule', 'basicInfo.fullName'),
        jsonb_build_object('id', 'id_card', 'label', '身份证号', 'type', 'text', 'required', true),
        jsonb_build_object('id', 'gender', 'label', '性别', 'type', 'select', 'required', true, 'options', jsonb_build_array('男', '女')),
        jsonb_build_object('id', 'birthday', 'label', '出生日期', 'type', 'date', 'required', true, 'aiFillRule', 'basicInfo.birthday'),
        jsonb_build_object('id', 'phone', 'label', '手机号码', 'type', 'tel', 'required', true, 'aiFillRule', 'basicInfo.phone')
      )
    ),
    jsonb_build_object(
      'id', 'education',
      'label', '教育背景',
      'type', 'section',
      'fields', jsonb_build_array(
        jsonb_build_object('id', 'high_school', 'label', '就读中学', 'type', 'text', 'required', true, 'aiFillRule', 'education[0].school'),
        jsonb_build_object('id', 'class', 'label', '班级', 'type', 'text', 'required', true),
        jsonb_build_object('id', 'rank', 'label', '年级排名', 'type', 'text', 'required', false),
        jsonb_build_object('id', 'gpa', 'label', '平均成绩', 'type', 'text', 'required', true)
      )
    ),
    jsonb_build_object(
      'id', 'major_choice',
      'label', '专业志愿',
      'type', 'section',
      'fields', jsonb_build_array(
        jsonb_build_object('id', 'first_major', 'label', '第一志愿', 'type', 'text', 'required', true),
        jsonb_build_object('id', 'second_major', 'label', '第二志愿', 'type', 'text', 'required', false),
        jsonb_build_object('id', 'major_reason', 'label', '专业选择理由', 'type', 'textarea', 'required', true, 'maxLength', 500)
      )
    ),
    jsonb_build_object(
      'id', 'personal_statement',
      'label', '个人陈述',
      'type', 'textarea',
      'required', true,
      'maxLength', 800,
      'helpText', '请结合自身经历，阐述你的学习动机、个人特长和未来规划（800字以内）'
    ),
    jsonb_build_object(
      'id', 'awards',
      'label', '获奖情况',
      'type', 'textarea',
      'required', false,
      'maxLength', 500,
      'helpText', '请列举高中期间获得的主要奖项和荣誉'
    )
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

### 示例2：需要外部网站申请的学校

**申请方式**：在学校官网注册申请

**配置**：
```sql
INSERT INTO "SchoolFormTemplate" ("id", "schoolId", "schoolName", "program", "description", "fieldsData", "isActive", "createdAt", "updatedAt")
VALUES (
  'external-university',
  'some-university',
  '某重点大学',
  '本科招生',
  '请先在本系统准备材料，然后访问学校官网完成申请',
  jsonb_build_object(
    'applicationType', 'external',
    'externalUrl', 'https://university-apply-website.edu.cn',
    'instructions', '申请步骤：\n1. 在本系统完成所有内容准备\n2. 访问学校官网注册账号\n3. 按照学校要求上传材料\n4. 复制本系统生成的内容到学校申请表',
    'fields', jsonb_build_array(
      jsonb_build_object(
        'id', 'personal_statement',
        'label', '个人陈述（准备用于上传）',
        'type', 'textarea',
        'required', true,
        'maxLength', 1000,
        'helpText', '准备好后导出或复制到学校申请系统'
      ),
      jsonb_build_object(
        'id', 'recommendation_draft',
        'label', '推荐信要点（供推荐人参考）',
        'type', 'textarea',
        'required', false,
        'maxLength', 500
      )
    )
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

---

## 🚀 快速开始

### 1. 添加您的第一个学校模板

1. 访问 Supabase SQL Editor
2. 复制上面的示例 SQL
3. 修改学校信息和字段
4. 运行 SQL
5. 刷新应用即可看到新学校

### 2. 测试字段映射

1. 完善个人资料页面
2. 创建新申请
3. 点击"自动填充"
4. 检查字段是否正确填充

### 3. 优化 AI 提示

修改 `src/utils/aiHelper.ts` 中的 prompt 模板来优化 AI 生成内容的质量。

---

## 📞 需要帮助？

如果需要添加特定学校的模板或有任何问题，请随时询问！

