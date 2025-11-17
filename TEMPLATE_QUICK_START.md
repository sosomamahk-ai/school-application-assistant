# 模板管理快速开始 🚀

## 📖 3分钟快速上手

### 第1步：访问管理后台

部署后访问：
```
https://your-domain/admin/templates
```

或从 Dashboard 点击 **"管理模板"** 按钮。

### 第2步：导入示例模板

我们提供了两个现成的模板：

#### 选项A：清华大学本科申请

1. 打开 `template-examples/tsinghua-university.json`
2. 复制全部内容
3. 在管理后台点击 **"导入模板"**
4. 粘贴 JSON 内容
5. 点击 **"导入"**
6. ✅ 完成！

#### 选项B：北京大学研究生申请

1. 打开 `template-examples/peking-university.json`
2. 复制全部内容  
3. 在管理后台点击 **"导入模板"**
4. 粘贴 JSON 内容
5. 点击 **"导入"**
6. ✅ 完成！

### 第3步：测试模板

1. 回到 Dashboard
2. 点击 **"开始新申请"**
3. 选择刚导入的学校
4. 点击 **"自动填充"** - 信息自动填入！
5. 点击 **"使用 AI 生成"** - AI 帮你写文书！

---

## 🎯 快速创建自己的学校模板

### 方法：复制并修改示例

```bash
# 1. 复制示例文件
cp template-examples/tsinghua-university.json my-school.json

# 2. 编辑文件
# 修改以下字段：
# - schoolId: 改为你的学校唯一ID（英文）
# - schoolName: 改为学校中文名称
# - program: 改为项目名称
# - fieldsData: 根据实际申请表修改字段

# 3. 在管理后台导入
```

### 最简单的模板示例

```json
{
  "schoolId": "my-school-2024",
  "schoolName": "我的学校",
  "program": "本科招生",
  "description": "2024年招生申请",
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
      "id": "essay",
      "label": "个人陈述",
      "type": "textarea",
      "required": true,
      "maxLength": 800,
      "helpText": "请阐述您的申请理由（800字以内）"
    }
  ]
}
```

保存为 JSON，然后导入即可！

---

## 📤 导出申请表

### 在申请详情页：

```
GET /api/applications/[applicationId]/export?format=html
GET /api/applications/[applicationId]/export?format=txt
GET /api/applications/[applicationId]/export?format=json
```

### 支持的格式：

- **JSON** - 数据备份
- **TXT** - 纯文本，方便复制
- **HTML** - 美观格式，可打印为 PDF

### HTML 转 PDF（推荐）：

1. 导出为 HTML
2. 浏览器打开
3. Ctrl+P（打印）
4. 选择 "另存为 PDF"
5. 完成！

---

## 🔗 字段自动填充（Mapping）

### 在字段中添加 `aiFillRule`：

```json
{
  "id": "student_name",
  "label": "学生姓名",
  "type": "text",
  "required": true,
  "aiFillRule": "basicInfo.fullName"
}
```

### 常用映射规则：

| aiFillRule | 含义 |
|------------|------|
| `basicInfo.fullName` | 用户姓名 |
| `basicInfo.email` | 邮箱 |
| `basicInfo.phone` | 电话 |
| `basicInfo.birthday` | 生日 |
| `education[0].school` | 最近的学校 |
| `education[0].major` | 最近的专业 |
| `education[0].gpa` | GPA |
| `experiences[0].company` | 最近的公司 |

---

## 📚 详细文档

- **完整指南**: [TEMPLATE_IMPORT_EXPORT_GUIDE.md](./TEMPLATE_IMPORT_EXPORT_GUIDE.md)
- **定制指南**: [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md)

---

## 💡 实际使用场景

### 场景1：学校提供在线申请

✅ 在系统中完成 → 导出 PDF → 提交

### 场景2：学校提供 PDF 表单

✅ 在系统中准备内容（AI 辅助） → 导出 TXT → 手动填 PDF

### 场景3：必须在学校官网申请

✅ 在系统中准备所有答案（AI 优化） → 导出 HTML → 复制到学校网站

---

## 🎉 就这么简单！

现在您可以：

- ✅ 快速导入学校模板
- ✅ 自动填充申请信息
- ✅ 使用 AI 生成文书
- ✅ 导出规范的申请表
- ✅ 管理多个学校申请

有问题随时询问！ 😊

