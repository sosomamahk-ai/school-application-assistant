# SQL Editor 新手操作指南

## 📚 什么是 SQL Editor？

SQL Editor（SQL编辑器）是一个让你可以**直接向数据库发送命令**的工具，就像是和数据库"对话"的地方。

你的学校申请助手系统把数据（比如学校模板、用户信息等）都存储在数据库中。当你想添加一个新的学校模板时，就需要用SQL Editor向数据库"说"：**"请添加这个学校模板"**。

---

## 🎯 第一步：找到 SQL Editor

### 如果你使用的是 Supabase：

1. **打开浏览器**，访问 [https://supabase.com](https://supabase.com)

2. **登录**你的账号

3. **选择你的项目**（应该叫类似 "school-application-assistant" 的名字）

4. 在左侧菜单栏找到并点击 **"SQL Editor"**（带有一个 `</>` 图标）
   ```
   🏠 Home
   📊 Table Editor
   🔍 Database
   💾 Storage
   </>  SQL Editor  ← 点这里！
   ```

5. 你会看到一个**大的白色文本框**，这就是SQL Editor！

---

## 🎯 第二步：准备你的 SQL 代码

### 1. 打开 CUSTOMIZATION_GUIDE.md 文件

在VS Code或你的编辑器中，打开 `CUSTOMIZATION_GUIDE.md` 文件。

### 2. 找到你想要的示例

比如你现在看到的 **清华大学示例**（从第260行开始）：

```sql
INSERT INTO "SchoolFormTemplate" ("id", "schoolId", "schoolName", "program", "description", "fieldsData", "isActive", "createdAt", "updatedAt")
VALUES (
  'tsinghua-undergrad-2024',
  'tsinghua-university',
  '清华大学',
  ...
);
```

### 3. 复制整段代码

**重要提示**：
- 从 `INSERT INTO` 开始
- 一直复制到最后的 `);` 结束
- 包括所有的括号、逗号、引号

**如何选择整段代码**：
1. 把鼠标光标放在 `INSERT` 的 `I` 前面
2. 按住鼠标左键不放
3. 向下滚动到最后一个 `);`
4. 松开鼠标，代码就被选中了
5. 按 `Ctrl+C` (Windows) 或 `Cmd+C` (Mac) 复制

---

## 🎯 第三步：修改代码（重要！）

在把代码粘贴到SQL Editor之前，你需要**修改一些信息**，让它适合你的需求。

### 需要修改的部分：

#### 1. ID（唯一标识符）
```sql
'tsinghua-undergrad-2024',  ← 改成你自己的ID，比如 'fudan-undergrad-2024'
```
**注意**：每个学校模板的ID必须不一样！

#### 2. schoolId（学校代码）
```sql
'tsinghua-university',  ← 改成你要添加的学校代码，比如 'fudan-university'
```

#### 3. schoolName（学校名称）
```sql
'清华大学',  ← 改成你要添加的学校名称，比如 '复旦大学'
```

#### 4. program（项目名称）
```sql
'2024年本科招生',  ← 改成你的项目名称
```

#### 5. description（描述）
```sql
'清华大学本科生综合评价招生申请',  ← 改成你的描述
```

### 示例：修改后的代码

```sql
INSERT INTO "SchoolFormTemplate" ("id", "schoolId", "schoolName", "program", "description", "fieldsData", "isActive", "createdAt", "updatedAt")
VALUES (
  'fudan-undergrad-2024',           ← 改了
  'fudan-university',                ← 改了
  '复旦大学',                        ← 改了
  '2024年本科招生',                  ← 改了
  '复旦大学本科生综合评价招生申请',  ← 改了
  jsonb_build_array(
    ... (字段配置保持不变或根据需要修改)
  ),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

---

## 🎯 第四步：在 SQL Editor 中运行代码

### 1. 粘贴代码

- 在 Supabase SQL Editor 的**大文本框**中点击
- 按 `Ctrl+V` (Windows) 或 `Cmd+V` (Mac) 粘贴代码
- 你应该能看到完整的SQL语句

### 2. 检查代码

**在运行之前，请检查**：
- ✅ 所有的引号都是成对的 `'...'`
- ✅ 所有的括号都是成对的 `(...)`
- ✅ 最后有 `);` 结束
- ✅ 没有多余的逗号在最后

### 3. 运行代码

找到**右下角或右上角**的按钮：
- Supabase: 点击 **"Run"** 或 **"RUN"** 按钮（通常是蓝色的）
- 或者按快捷键：`Ctrl+Enter` (Windows) 或 `Cmd+Enter` (Mac)

### 4. 查看结果

**成功的提示**：
```
Success. No rows returned
```
或者
```
✓ Successfully completed (0.05s)
```

**如果出错**：
- 会显示红色的错误信息
- 通常是因为：
  - 缺少引号或括号
  - ID重复（数据库里已经有这个ID了）
  - 拼写错误

---

## 🎯 第五步：验证学校模板已添加

### 方法1：在应用中查看

1. 回到你的应用（学校申请助手网站）
2. 刷新页面（按 `F5` 或点击浏览器的刷新按钮）
3. 进入**仪表板**或**选择学校**页面
4. 你应该能看到新添加的学校！

### 方法2：在 Supabase Table Editor 中查看

1. 在 Supabase 左侧菜单点击 **"Table Editor"**
2. 选择 **"SchoolFormTemplate"** 表
3. 你应该能看到新添加的一行数据

---

## 📋 完整操作流程总结

```
1. 登录 Supabase
   ↓
2. 打开 SQL Editor
   ↓
3. 从 CUSTOMIZATION_GUIDE.md 复制 SQL 代码
   ↓
4. 修改代码中的学校信息
   ↓
5. 粘贴到 SQL Editor
   ↓
6. 点击 "Run" 运行
   ↓
7. 看到 "Success" 提示
   ↓
8. 刷新应用查看新学校
```

---

## 🛠️ 常见问题

### Q1: 我不知道我的数据库在哪里？

**回答**：查看你的项目根目录下的 `.env.local` 文件，找到 `DATABASE_URL` 这一行。如果里面包含 `supabase.co`，说明你用的是 Supabase。

### Q2: 运行SQL后显示 "duplicate key value"？

**回答**：这说明你的 `id` 或 `schoolId` 已经存在了。请修改成一个新的、不重复的值。

### Q3: 我想修改已经添加的学校模板怎么办？

**回答**：用 `UPDATE` 语句而不是 `INSERT`。示例：

```sql
UPDATE "SchoolFormTemplate"
SET "schoolName" = '新的学校名称',
    "description" = '新的描述'
WHERE "id" = 'your-school-id';
```

### Q4: 我想删除一个学校模板？

**回答**：用 `DELETE` 语句：

```sql
DELETE FROM "SchoolFormTemplate"
WHERE "id" = 'your-school-id';
```

### Q5: JSON 格式看起来很复杂，怎么办？

**回答**：
- 不要担心！保持示例中的格式
- 只修改 `'...'` 引号里面的中文内容
- 不要删除逗号、括号、大括号
- 如果不确定，先用示例的原样，之后再慢慢调整

---

## 🎨 字段配置详解（进阶）

当你熟悉基本操作后，可以修改 `fieldsData` 中的字段配置。

### 字段结构示例：

```json
{
  "id": "student_name",        ← 字段的唯一ID
  "label": "学生姓名",          ← 显示的标签
  "type": "text",              ← 字段类型（文本框）
  "required": true,            ← 是否必填
  "aiFillRule": "basicInfo.fullName"  ← AI自动填充规则
}
```

### 支持的字段类型：

| type | 说明 | 示例用途 |
|------|------|---------|
| `text` | 单行文本框 | 姓名、学校名称 |
| `email` | 邮箱输入框 | 联系邮箱 |
| `tel` | 电话输入框 | 手机号码 |
| `date` | 日期选择器 | 生日、毕业日期 |
| `textarea` | 多行文本框 | 个人陈述、研究计划 |
| `select` | 下拉选择框 | 性别、学历 |
| `section` | 分组标题 | 把相关字段分组 |

---

## 💡 小贴士

1. **先用简单的例子练习**：比如先添加一个只有几个字段的学校模板
2. **保存你的SQL代码**：在记事本里保存一份，方便以后修改
3. **一次只添加一个**：不要同时运行多个 INSERT 语句
4. **遇到错误不要慌**：仔细阅读错误信息，通常能找到问题所在

---

## 🆘 需要更多帮助？

如果你在操作过程中遇到任何问题，可以：
1. 截图错误信息
2. 告诉我你在哪一步遇到问题
3. 我会给你更具体的帮助！

---

**祝你成功添加学校模板！** 🎉

