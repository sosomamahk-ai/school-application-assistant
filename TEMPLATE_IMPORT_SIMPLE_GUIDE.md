# 📥 模板导入超简单指南

## 🎯 两种导入方法

---

## 方法1️⃣：通过 Supabase SQL Editor（最简单！）

### 第1步：访问 Supabase

1. 打开 [https://supabase.com](https://supabase.com)
2. 登录您的账户
3. 选择您的项目（school application assistant 项目）

### 第2步：打开 SQL Editor

1. 点击左侧菜单的 **"SQL Editor"**
2. 点击 **"+ New query"**（新建查询）

### 第3步：复制 SQL 脚本

1. 打开项目中的文件：
   ```
   template-examples/import-via-sql.sql
   ```

2. **复制全部内容**

### 第4步：执行 SQL

1. 将复制的 SQL 粘贴到 SQL Editor
2. 点击右下角的 **"Run"**（运行）按钮
3. 等待几秒钟
4. ✅ 看到成功消息！

### 第5步：验证导入

在 SQL Editor 中运行以下查询：

```sql
SELECT "schoolId", "schoolName", "program", "isActive" 
FROM "SchoolFormTemplate";
```

您应该看到：
- 清华大学 - 2024年本科招生
- 北京大学 - 2024年研究生招生

### ✅ 完成！

现在访问您的应用：
```
https://school-application-assistant.vercel.app/dashboard
```

点击"开始新申请"，您会看到新导入的学校！

---

## 方法2️⃣：通过 Vercel 应用管理后台

### 第1步：访问管理后台

**正确地址**：
```
https://school-application-assistant.vercel.app/admin/templates
```

⚠️ **注意**：不是 `sosomama.com`，而是您的 **Vercel 应用域名**！

### 第2步：登录

使用您的注册账号登录（如果还没登录）

### 第3步：点击"导入模板"

在管理后台页面，点击右上角的 **"导入模板"** 按钮

### 第4步：准备 JSON

**选项A：上传 JSON 文件**
1. 找到 `template-examples/tsinghua-university.json`
2. 点击"选择文件"
3. 选择该文件
4. 点击"导入"

**选项B：粘贴 JSON 内容**
1. 打开 `template-examples/tsinghua-university.json`
2. 复制全部内容
3. 粘贴到文本框
4. 点击"导入"

### 第5步：重复导入北大模板

使用同样的方法导入：
```
template-examples/peking-university.json
```

### ✅ 完成！

---

## 📋 完整操作截图指南

### Supabase SQL 导入（推荐）

#### 步骤1：访问 Supabase
```
https://supabase.com → 登录 → 选择项目
```

#### 步骤2：打开 SQL Editor
```
左侧菜单 → SQL Editor → + New query
```

#### 步骤3：粘贴并运行 SQL
```
粘贴 import-via-sql.sql 的内容 → 点击 Run
```

#### 步骤4：验证结果
```sql
SELECT * FROM "SchoolFormTemplate";
```

---

## ❓ 常见问题

### Q1: 找不到管理后台页面（404）

**A**: 
- ❌ 错误：`https://sosomama.com/admin/templates`（WordPress 网站）
- ✅ 正确：`https://school-application-assistant.vercel.app/admin/templates`（Vercel 应用）

管理后台在 **Next.js 应用**中，不在 WordPress 网站中。

### Q2: 如何找到我的 Vercel 应用地址？

**A**: 
1. 访问 [https://vercel.com](https://vercel.com)
2. 登录
3. 找到 `school-application-assistant` 项目
4. 查看 "Domains" 部分
5. 默认域名是：`school-application-assistant.vercel.app`

### Q3: Supabase SQL 导入失败？

**A**: 检查以下几点：
1. 确保您选择了正确的项目
2. 确保 `SchoolFormTemplate` 表已存在
3. 检查 SQL 语法是否完整复制

如果表不存在，先运行数据库迁移：
```bash
cd C:\school-application-assistant
npx prisma migrate deploy
```

### Q4: 导入后在哪里看到模板？

**A**: 
1. **在管理后台**：
   ```
   https://school-application-assistant.vercel.app/admin/templates
   ```

2. **在用户界面**：
   ```
   https://school-application-assistant.vercel.app/dashboard
   → 点击"开始新申请"
   → 看到学校列表
   ```

### Q5: WordPress 网站如何访问这些功能？

**A**: 
WordPress 网站通过 **iframe** 嵌入 Vercel 应用：

```php
// 在 WordPress 中使用 shortcode
[school_app]
```

这会显示完整的 Vercel 应用，用户可以在里面：
- 注册/登录
- 查看学校列表（包括新导入的模板）
- 创建申请
- 使用所有功能

---

## 🔗 访问路径总结

### Next.js 应用（Vercel）

| 功能 | 路径 |
|------|------|
| 首页 | `https://school-application-assistant.vercel.app/` |
| 注册 | `https://school-application-assistant.vercel.app/auth/register` |
| 登录 | `https://school-application-assistant.vercel.app/auth/login` |
| 仪表板 | `https://school-application-assistant.vercel.app/dashboard` |
| **管理后台** | `https://school-application-assistant.vercel.app/admin/templates` |
| 学校列表 | `https://school-application-assistant.vercel.app/schools` |

### WordPress 网站（sosomama.com）

| 功能 | 方式 |
|------|------|
| 嵌入应用 | 使用 shortcode: `[school_app]` |
| 访问位置 | WordPress 页面/文章中 |
| 显示内容 | 完整的 Next.js 应用（通过 iframe） |

---

## 🎯 推荐工作流程

### 步骤1：在 Vercel 应用中管理模板

```
1. 访问 https://school-application-assistant.vercel.app/admin/templates
2. 导入/编辑/管理学校模板
3. 测试模板功能
```

### 步骤2：在 WordPress 中嵌入应用

```
1. WordPress 后台 → 页面/文章
2. 添加 shortcode: [school_app]
3. 用户可以在 WordPress 页面中使用完整功能
```

### 步骤3：用户使用流程

```
1. 访问 WordPress 页面（包含 [school_app] shortcode）
2. 在嵌入的应用中注册/登录
3. 看到所有导入的学校模板
4. 创建申请、使用 AI 功能
5. 导出申请表
```

---

## 🚀 现在就试试！

### 最快的导入方法（3分钟）：

1. **打开 Supabase**
   ```
   https://supabase.com → 您的项目 → SQL Editor
   ```

2. **复制 SQL**
   ```
   打开 template-examples/import-via-sql.sql
   复制全部内容
   ```

3. **运行 SQL**
   ```
   粘贴到 SQL Editor → 点击 Run
   ```

4. **验证结果**
   ```
   访问 https://school-application-assistant.vercel.app/dashboard
   点击"开始新申请"
   看到清华大学和北京大学！
   ```

5. **✅ 完成！**

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 您使用的是哪种导入方法？
2. 具体的错误信息是什么？
3. 在哪一步遇到了困难？

我会立即帮您解决！😊

