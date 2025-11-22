# Playwright 自动化申请脚本 - 零基础完整指南

## 📚 目录

1. [什么是 Playwright？](#什么是-playwright)
2. [准备工作](#准备工作)
3. [第一步：理解自动化脚本的工作原理](#第一步理解自动化脚本的工作原理)
4. [第二步：创建您的第一个脚本](#第二步创建您的第一个脚本)
5. [第三步：测试脚本](#第三步测试脚本)
6. [第四步：调试和优化](#第四步调试和优化)
7. [常见场景处理](#常见场景处理)
8. [常见问题解答](#常见问题解答)

---

## 什么是 Playwright？

**Playwright** 是一个自动化工具，可以控制浏览器（如 Chrome、Firefox）自动完成操作，就像有人在操作一样。

### 它能做什么？

- ✅ 自动打开网页
- ✅ 自动填写表单
- ✅ 自动点击按钮
- ✅ 自动上传文件
- ✅ 自动提交申请

### 为什么用它？

想象一下，您需要申请 10 所学校，每所学校都要填写相同的个人信息（姓名、邮箱、电话等）。手动填写需要：
- ⏰ 花费大量时间
- 😫 容易出错
- 🔄 重复劳动

使用 Playwright 自动化脚本：
- ⚡ 几秒钟完成
- ✅ 准确无误
- 🎯 一次编写，多次使用

---

## 准备工作

### 1. 确认项目已安装 Playwright

您的项目已经包含了 Playwright！检查方法：

1. **打开终端**（见下方"如何打开终端"）
2. **进入项目目录**：
   ```bash
   cd C:\school-application-assistant
   ```
3. **检查是否已安装**：
   ```bash
   npm list playwright
   ```
   如果看到版本号（如 `playwright@1.56.1`），说明已安装 ✅

### 2. 安装 Playwright 浏览器（如果还没安装）

```bash
npx playwright install
```

这会下载 Chrome、Firefox 等浏览器，需要几分钟时间。

### 3. 准备学校信息

在创建脚本之前，您需要知道：

- **学校ID**：例如 `shanghai-international-school`
- **申请页面URL**：例如 `https://school.edu/apply`
- **是否需要登录**：是/否

**如何找到学校ID？**

方法一：使用 Web 界面（最简单）
1. 登录系统
2. 进入"自动申请脚本管理"页面
3. 查看学校列表，每个学校都有ID

方法二：查看数据库
```bash
npx prisma studio
```
浏览器会自动打开，点击 `SchoolFormTemplate` 表，查看 `schoolId` 列。

---

## 第一步：理解自动化脚本的工作原理

### 脚本的基本结构

每个自动化脚本就像一份"操作说明书"，告诉浏览器：

1. **去哪里**（打开哪个网页）
2. **做什么**（填写什么信息）
3. **怎么提交**（点击哪个按钮）

### 一个简单的例子

```typescript
// 1. 打开申请页面
await page.goto("https://school.edu/apply");

// 2. 填写姓名
await page.fill('input[name="name"]', "张三");

// 3. 填写邮箱
await page.fill('input[name="email"]', "zhangsan@example.com");

// 4. 点击提交按钮
await page.click('button:has-text("提交")');
```

### 系统提供的工具

您的项目已经提供了很多现成的工具，您不需要从零开始：

- **`formFiller.fillFields()`** - 自动填写表单（最常用！）
- **`loginHandler.maybeLogin()`** - 自动登录
- **`utils.safeNavigate()`** - 安全地打开网页
- **`utils.waitForNetworkIdle()`** - 等待页面加载完成

**您只需要：**
1. 告诉系统申请页面的URL
2. 告诉系统是否需要登录
3. 系统会自动填写表单！

---

## 第二步：创建您的第一个脚本

### 场景示例

假设您要为"上海国际学校"创建脚本：
- 学校ID：`shanghai-international-school`
- 申请URL：`https://shanghai-school.edu/apply`
- 不需要登录

### 步骤 1：创建脚本文件

#### 方法一：使用 Web 界面（推荐，最简单）

1. **登录系统**
   - 访问：`http://localhost:3000`
   - 使用管理员账号登录

2. **进入自动申请脚本管理页面**
   - 点击顶部导航栏的"管理"或"Admin"
   - 选择"自动申请脚本管理"
   - 或直接访问：`http://localhost:3000/admin/auto-apply-scripts`

3. **点击"创建新脚本"按钮**

4. **填写表单**
   - **选择学校**：从下拉列表中选择"上海国际学校"
   - **申请页面URL**：`https://shanghai-school.edu/apply`
   - **需要登录**：不勾选（如果不需要登录）

5. **点击"创建脚本"**
   - 系统会自动创建脚本文件并注册 ✅

#### 方法二：手动创建（高级用户）

1. **打开 VS Code**（或其他代码编辑器）

2. **创建新文件**
   - 路径：`src/modules/auto-apply/schools/shanghai-international-school.ts`
   - 文件名必须是：`学校ID.ts`

3. **复制模板代码**（见下方）

### 步骤 2：编写脚本代码

#### 最简单的脚本（不需要登录）

```typescript
import type { SchoolAutomationScript } from "../engine/types";

// 申请页面URL
const APPLY_URL = "https://shanghai-school.edu/apply";

export const shanghaiInternationalSchoolScript: SchoolAutomationScript = {
  // ⚠️ 重要：id 必须与数据库中的 schoolId 完全一致
  id: "shanghai-international-school",
  name: "上海国际学校",
  supportsLogin: false,  // 不需要登录
  description: "上海国际学校自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      logger.info("正在打开申请页面...");
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 自动填写表单
      // ⭐ 这是核心功能！系统会自动匹配字段并填写
      logger.info("开始填写表单...");
      await formFiller.fillFields(page, payload.template.fields);
      
      // 步骤 3: 提交表单
      logger.info("正在提交表单...");
      const submitBtn = page.getByRole("button", { name: /提交|submit|确认|apply/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });
      }
      
      // 步骤 4: 返回成功结果
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
    } catch (error) {
      // 如果出错，记录错误并返回失败结果
      logger.error("申请失败", { error });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  },
};
```

#### 需要登录的脚本

如果申请前需要先登录，修改如下：

```typescript
export const shanghaiInternationalSchoolScript: SchoolAutomationScript = {
  id: "shanghai-international-school",
  name: "上海国际学校",
  supportsLogin: true,  // ⚠️ 改为 true
  description: "上海国际学校自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin) {
        logger.info("正在登录...");
        await loginHandler.maybeLogin(page, payload.userLogin);
        await utils.waitForNetworkIdle(page);
      }
      
      // 步骤 3: 填写表单
      await formFiller.fillFields(page, payload.template.fields);
      
      // 步骤 4: 提交
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForNavigation();
      }
      
      return { success: true, message: "申请已提交" };
    } catch (error) {
      logger.error("申请失败", { error });
      return {
        success: false,
        message: (error as Error).message,
      };
    }
  },
};
```

### 步骤 3：注册脚本（如果手动创建）

如果使用方法二（手动创建），需要注册脚本：

1. **打开文件**：`src/modules/auto-apply/autoApplyService.ts`

2. **添加导入**（在文件顶部）：
   ```typescript
   import { shanghaiInternationalSchoolScript } from "./schools/shanghai-international-school";
   ```

3. **注册脚本**（找到 `scriptRegistry` 对象，添加）：
   ```typescript
   const scriptRegistry: SchoolScriptMap = {
     [exampleSchoolScript.id]: exampleSchoolScript,
     [shanghaiInternationalSchoolScript.id]: shanghaiInternationalSchoolScript,  // 添加这一行
   };
   ```

4. **保存文件**（按 `Ctrl + S`）

---

## 第三步：测试脚本

### 准备工作

#### 1. 设置环境变量（让浏览器显示出来，方便观察）

创建或编辑 `.env.local` 文件（在项目根目录）：

```env
PLAYWRIGHT_HEADLESS=false
AUTO_APPLY_SCREENSHOTS=tmp/auto-apply
```

**说明：**
- `PLAYWRIGHT_HEADLESS=false` - 让浏览器显示出来（可以看到操作过程）
- `AUTO_APPLY_SCREENSHOTS=tmp/auto-apply` - 错误时保存截图的位置

#### 2. 启动开发服务器

1. **打开终端**
2. **进入项目目录**：
   ```bash
   cd C:\school-application-assistant
   ```
3. **启动服务器**：
   ```bash
   npm run dev
   ```
4. **等待启动完成**（看到 `ready - started server on 0.0.0.0:3000`）

### 测试方法

#### 方法一：通过 Web 界面测试（推荐）

1. **打开浏览器**，访问：`http://localhost:3000`
2. **登录系统**
3. **进入"可申请学校"页面**
   - 点击导航栏的"可申请学校"
   - 或直接访问：`http://localhost:3000/schools`
4. **找到您的学校**（例如"上海国际学校"）
5. **点击"自动申请"按钮**
6. **观察浏览器操作**
   - 浏览器会自动打开（因为设置了 `PLAYWRIGHT_HEADLESS=false`）
   - 您可以看到：
     - 页面自动打开
     - 表单自动填写
     - 按钮自动点击
     - 提交完成

#### 方法二：查看日志

在终端中查看执行日志，查找 `[auto-apply]` 开头的消息：

```
[auto-apply] 正在打开申请页面...
[auto-apply] 开始填写表单...
[auto-apply] 正在提交表单...
```

### 如果测试失败

1. **查看错误信息**
   - 终端中的错误日志
   - 浏览器控制台（按 F12）

2. **查看截图**
   - 如果出错，截图会保存在：`tmp/auto-apply/` 目录
   - 可以查看截图了解出错时的页面状态

3. **检查常见问题**（见下方"常见问题解答"）

---

## 第四步：调试和优化

### 如何调试脚本

#### 1. 添加日志

在脚本中添加更多日志，了解执行过程：

```typescript
logger.info("当前步骤：打开申请页面", { url: APPLY_URL });
logger.info("当前步骤：填写表单", { fieldCount: payload.template.fields.length });
logger.info("当前步骤：提交表单");
```

#### 2. 使用浏览器开发者工具

1. **设置 `PLAYWRIGHT_HEADLESS=false`**（在 `.env.local` 中）
2. **运行脚本**
3. **在浏览器中按 F12** 打开开发者工具
4. **查看 Console 标签**，查看页面错误
5. **查看 Network 标签**，查看网络请求

#### 3. 查看页面HTML

如果字段无法匹配，可以查看页面HTML结构：

```typescript
// 在脚本中添加
const html = await page.content();
console.log(html);  // 打印页面HTML
```

### 优化技巧

#### 1. 字段无法自动匹配时

如果某些字段无法自动匹配，可以手动指定映射：

```typescript
import { remapTemplateFields } from "./common";

// 在 run 函数中，填写表单之前添加：
const overrides = remapTemplateFields(payload.template, {
  // 您的字段ID -> 页面上的标签
  english_first_name: { label: "First Name" },
  english_last_name: { label: "Last Name" },
  student_email: { label: "Email Address" },
  student_phone: { label: "Phone Number" },
});

const fields = overrides.length ? overrides : payload.template.fields;
await formFiller.fillFields(page, fields);
```

#### 2. 等待页面加载

如果页面加载较慢，可以增加等待时间：

```typescript
// 等待页面加载完成
await utils.waitForNetworkIdle(page);

// 或者等待特定元素出现
await page.waitForSelector('input[name="name"]', { timeout: 10000 });
```

#### 3. 处理动态内容

如果页面有动态加载的内容：

```typescript
// 等待元素出现
await page.waitForSelector('.form-container');

// 等待网络请求完成
await page.waitForLoadState('networkidle');
```

---

## 常见场景处理

### 场景 1：多步骤表单

如果表单分多页，需要逐步填写：

```typescript
// 第一步
await formFiller.fillFields(page, step1Fields);
await page.click('button:has-text("下一步")');
await page.waitForNavigation();

// 第二步
await formFiller.fillFields(page, step2Fields);
await page.click('button:has-text("下一步")');
await page.waitForNavigation();

// 最后提交
await page.click('button:has-text("提交")');
```

### 场景 2：上传文件

如果需要上传文件：

```typescript
// 假设文件路径在 payload.metadata 中
const fileInput = page.locator('input[type="file"]');
if (await fileInput.count() > 0) {
  const filePath = payload.metadata?.resumePath;
  if (filePath) {
    await fileInput.setInputFiles(filePath);
  }
}
```

### 场景 3：选择日期

如果需要选择日期：

```typescript
// 方法一：直接填写日期
await page.fill('input[type="date"]', '2024-01-01');

// 方法二：使用日期选择器
await page.click('input[type="date"]');
await page.click('button:has-text("确定")');
```

### 场景 4：下拉框选择

如果需要选择下拉框：

```typescript
// 方法一：通过文本选择
await page.selectOption('select[name="grade"]', { label: 'Grade 10' });

// 方法二：通过值选择
await page.selectOption('select[name="grade"]', 'grade-10');
```

### 场景 5：处理验证码

如果遇到验证码，需要暂停等待用户输入：

```typescript
const captchaInput = page.locator('#captcha');
if (await captchaInput.count() > 0) {
  logger.warn("检测到验证码，请手动输入");
  // 等待用户手动输入验证码（60秒）
  await page.waitForTimeout(60000);
}
```

### 场景 6：处理弹窗/对话框

如果提交后出现确认对话框：

```typescript
// 等待对话框出现并确认
page.on('dialog', async dialog => {
  logger.info("检测到对话框", { message: dialog.message() });
  await dialog.accept();  // 点击"确定"
});
```

---

## 常见问题解答

### Q1: 如何打开终端？

**Windows:**
- 方法一：在 VS Code 中，按 `Ctrl + ~`（Ctrl键 + 波浪号键）
- 方法二：按 `Win + X`，选择"Windows PowerShell"
- 方法三：在项目文件夹中，按住 `Shift` 键，右键点击空白处，选择"在此处打开PowerShell窗口"

**Mac:**
- 方法一：在 VS Code 中，按 `Ctrl + ~`
- 方法二：按 `Cmd + 空格键`，搜索"Terminal"，按回车

### Q2: 运行 `npm run dev` 报错？

**可能的原因：**
1. **没有安装依赖**
   ```bash
   npm install
   ```

2. **Node.js 版本太低**
   ```bash
   node --version
   ```
   需要 Node.js 18 或更高版本

3. **端口被占用**
   - 关闭其他占用 3000 端口的程序
   - 或修改端口：`npm run dev -- -p 3001`

### Q3: 脚本执行失败，字段没有填写？

**可能的原因：**
1. **字段无法自动匹配**
   - 使用 `remapTemplateFields` 手动映射字段（见上方"优化技巧"）

2. **页面加载太慢**
   - 增加等待时间：`await utils.waitForNetworkIdle(page);`

3. **字段选择器错误**
   - 查看页面HTML，确认字段的实际标签/选择器
   - 使用浏览器开发者工具（F12）检查元素

### Q4: 不知道学校ID是什么？

**方法一：使用 Web 界面**
- 登录系统 → 进入"自动申请脚本管理" → 查看学校列表

**方法二：查看数据库**
```bash
npx prisma studio
```
浏览器会自动打开，点击 `SchoolFormTemplate` 表，查看 `schoolId` 列。

### Q5: 脚本文件在哪里？

**路径：** `src/modules/auto-apply/schools/`

**文件名格式：** `学校ID.ts`

例如：`src/modules/auto-apply/schools/shanghai-international-school.ts`

### Q6: 如何知道字段是否匹配成功？

**方法一：查看日志**
- 终端中会显示字段匹配的信息
- 如果匹配失败，会显示错误信息

**方法二：观察浏览器**
- 设置 `PLAYWRIGHT_HEADLESS=false`
- 运行脚本，观察字段是否被填写

### Q7: 浏览器没有显示出来？

**检查 `.env.local` 文件：**
```env
PLAYWRIGHT_HEADLESS=false
```

**如果还是不行：**
1. 确保文件在项目根目录
2. 重启开发服务器（`npm run dev`）

### Q8: 如何测试特定学校的脚本？

**方法一：通过 Web 界面**
1. 登录系统
2. 进入"可申请学校"页面
3. 找到目标学校
4. 点击"自动申请"按钮

**方法二：直接调用 API**
```bash
curl -X POST http://localhost:3000/api/auto-apply \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "shanghai-international-school",
    "templateId": "your-template-id"
  }'
```

### Q9: 脚本执行很慢怎么办？

**优化方法：**
1. **减少不必要的等待**
   - 只在必要时使用 `waitForTimeout`
   - 优先使用 `waitForSelector` 或 `waitForNetworkIdle`

2. **并行处理**
   - 如果多个操作可以并行，使用 `Promise.all()`

3. **使用 headless 模式**（生产环境）
   ```env
   PLAYWRIGHT_HEADLESS=true
   ```

### Q10: 如何处理需要登录的学校？

1. **在脚本中设置 `supportsLogin: true`**
2. **用户需要提供登录凭据**
   - 可以在用户配置中保存
   - 或在调用API时传递

3. **使用登录处理器**
   ```typescript
   if (payload.userLogin) {
     await loginHandler.maybeLogin(page, payload.userLogin);
   }
   ```

---

## 总结

创建 Playwright 自动化申请脚本的完整流程：

1. ✅ **准备工作** - 确认 Playwright 已安装，准备学校信息
2. ✅ **创建脚本** - 使用 Web 界面（推荐）或手动创建
3. ✅ **编写代码** - 定义申请URL、填写表单、提交
4. ✅ **注册脚本** - 在 `autoApplyService.ts` 中注册（如果手动创建）
5. ✅ **测试脚本** - 设置环境变量、启动服务器、测试
6. ✅ **调试优化** - 添加日志、处理特殊情况、优化性能

**关键点：**
- 学校ID必须与数据库中的完全一致
- 系统会自动匹配字段，无需手动映射（大多数情况）
- 测试时设置 `PLAYWRIGHT_HEADLESS=false` 可以看到浏览器操作
- 遇到问题查看日志和截图

**下一步：**
- 尝试为您的第一个学校创建脚本
- 如果遇到问题，参考本文档的"常见问题解答"
- 查看示例脚本：`src/modules/auto-apply/schools/example-school.ts`

祝您使用愉快！🎉

