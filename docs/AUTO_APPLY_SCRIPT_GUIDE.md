# 自动申请脚本录制指南

## 概述

自动申请功能使用 Playwright 自动化浏览器操作，为每个学校创建专门的脚本来自动填写申请表单。本指南将详细说明如何为新的学校录制和创建自动申请脚本。

## 系统架构

### 核心组件

1. **前端组件** (`src/components/schools/SchoolTable.tsx`)
   - 显示"自动申请"按钮
   - 调用 `/api/auto-apply` API

2. **API 端点** (`src/pages/api/auto-apply.ts`)
   - 接收学校ID和模板ID
   - 调用 `autoApplyController`

3. **控制器** (`src/modules/auto-apply/autoApplyController.ts`)
   - 验证请求
   - 从数据库获取模板和用户数据
   - 构建自动化负载

4. **服务层** (`src/modules/auto-apply/autoApplyService.ts`)
   - 管理浏览器实例
   - 注册和执行学校脚本
   - 处理错误和截图

5. **学校脚本** (`src/modules/auto-apply/schools/`)
   - 每个学校一个脚本文件
   - 定义具体的自动化流程

## 操作用例：为新学校创建自动申请脚本

### 用例场景

**用户故事**：管理员需要为"上海国际学校"添加自动申请功能，该学校的申请网址是 `https://shanghai-school.edu/apply`。

### 步骤 1：准备学校信息

1. **确认数据库中的学校ID**
   ```sql
   SELECT id, "schoolId", "schoolName" 
   FROM "SchoolFormTemplate" 
   WHERE "schoolName" LIKE '%上海国际学校%';
   ```
   
   假设查询结果为：
   - `schoolId`: `shanghai-international-school`
   - `id`: `template-xxx-xxx`

2. **确认申请URL**
   - 申请页面URL: `https://shanghai-school.edu/apply`
   - 登录页面URL（如果需要）: `https://shanghai-school.edu/login`

3. **分析申请表单结构**
   - 访问申请页面，记录所有表单字段
   - 确认是否需要登录
   - 记录字段的标签、类型、选择器

### 步骤 2：创建脚本文件

在 `src/modules/auto-apply/schools/` 目录下创建新文件：

**文件**: `src/modules/auto-apply/schools/shanghai-international-school.ts`

```typescript
import type { Locator, Page } from "playwright";
import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

// 申请页面URL
const APPLY_URL = "https://shanghai-school.edu/apply";
// 登录页面URL（如果需要）
const LOGIN_URL = "https://shanghai-school.edu/login";

export const shanghaiInternationalSchoolScript: SchoolAutomationScript = {
  // 必须与数据库中的 schoolId 完全匹配
  id: "shanghai-international-school",
  name: "上海国际学校",
  supportsLogin: true, // 如果需要登录，设置为 true
  description: "上海国际学校自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 导航到申请页面
      logger.info("导航到申请页面", { url: APPLY_URL });
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin) {
        logger.info("执行登录流程");
        const loggedIn = await loginHandler.maybeLogin(page, payload.userLogin);
        if (!loggedIn) {
          // 如果自动登录失败，可能需要手动处理
          logger.warn("自动登录失败，尝试手动登录");
          await utils.safeNavigate(page, LOGIN_URL);
          // 这里可以添加特定的登录逻辑
          await page.fill('input[name="email"]', payload.userLogin.email || '');
          await page.fill('input[name="password"]', payload.userLogin.password || '');
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle' });
        }
        await utils.waitForNetworkIdle(page);
      }
      
      // 步骤 3: 字段映射
      // 如果模板字段ID与页面字段标签不匹配，需要重新映射
      const overrides = remapTemplateFields(payload.template, {
        // 模板字段ID -> 页面标签映射
        english_first_name: { label: "First Name" },
        english_last_name: { label: "Last Name" },
        student_email: { label: "Email Address" },
        student_phone: { label: "Phone Number" },
        home_address: { label: "Home Address" },
        date_of_birth: { label: "Date of Birth" },
        // 添加更多映射...
      });
      
      // 步骤 4: 填写表单
      const fields = overrides.length ? overrides : payload.template.fields;
      logger.info("开始填写表单", { fieldCount: fields.length });
      await formFiller.fillFields(page, fields);
      
      // 步骤 5: 处理特殊字段（如果需要）
      // 例如：上传文件、选择日期等
      // await handleSpecialFields(page, payload);
      
      // 步骤 6: 提交表单
      const submitButton = await locateSubmitButton(page);
      if (submitButton) {
        logger.info("找到提交按钮，准备提交");
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30_000 }).catch(() => undefined),
          submitButton.click(),
        ]);
      } else {
        logger.warn("未找到提交按钮");
      }
      
      // 步骤 7: 等待页面加载完成
      await utils.waitForNetworkIdle(page);
      
      // 步骤 8: 验证提交结果（可选）
      const success = await verifySubmission(page);
      if (success) {
        logger.info("申请提交成功");
      } else {
        logger.warn("无法确认申请是否成功提交");
      }
      
      return {
        success: true,
        message: "上海国际学校自动申请已完成",
      };
    } catch (error) {
      logger.error("自动申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "shanghai-school-error"),
        utils.persistHtmlDump(page, payload.runId),
      ]);
      return {
        success: false,
        message: (error as Error).message,
        errors: [(error as Error).stack ?? String(error)],
        artifacts: {
          screenshotPath,
          rawHtmlPath: htmlPath,
        },
      };
    }
  },
};

// 辅助函数：定位提交按钮
async function locateSubmitButton(page: Page): Promise<Locator | null> {
  const candidates = [
    // 按优先级尝试不同的选择器
    page.getByRole("button", { name: /submit|apply|提交|确认/i }),
    page.locator('button[type="submit"]'),
    page.locator('input[type="submit"]'),
    page.locator('button:has-text("提交")'),
    page.locator('button:has-text("确认")'),
    page.locator('#submit-button'),
    page.locator('.submit-btn'),
  ];

  for (const locator of candidates) {
    if (await locator.count()) {
      return locator.first();
    }
  }
  return null;
}

// 辅助函数：验证提交结果
async function verifySubmission(page: Page): Promise<boolean> {
  // 检查页面是否包含成功消息
  const successIndicators = [
    /success|成功|已提交|已完成/i,
    /thank you|感谢|提交成功/i,
  ];
  
  const pageText = await page.textContent('body') || '';
  return successIndicators.some(pattern => pattern.test(pageText));
}
```

### 步骤 3：注册脚本

在 `src/modules/auto-apply/autoApplyService.ts` 中注册新脚本：

```typescript
import { shanghaiInternationalSchoolScript } from "./schools/shanghai-international-school";

const scriptRegistry: SchoolScriptMap = {
  [exampleSchoolScript.id]: exampleSchoolScript,
  [shanghaiInternationalSchoolScript.id]: shanghaiInternationalSchoolScript, // 添加这一行
};
```

### 步骤 4：测试脚本

#### 4.1 本地测试

1. **设置环境变量**
   ```bash
   # .env.local
   PLAYWRIGHT_HEADLESS=false  # 设置为 false 可以看到浏览器操作
   AUTO_APPLY_SCREENSHOTS=tmp/auto-apply
   ```

2. **运行测试**
   ```bash
   npm run dev
   ```
   
   然后在前端界面：
   - 登录系统
   - 进入"可申请学校"页面
   - 找到"上海国际学校"
   - 点击"自动申请"按钮

3. **观察执行过程**
   - 浏览器会自动打开（因为 `PLAYWRIGHT_HEADLESS=false`）
   - 观察每个步骤的执行
   - 检查是否有错误

#### 4.2 调试技巧

1. **查看日志**
   - 服务器控制台会输出详细的日志
   - 查找 `[auto-apply]` 开头的日志

2. **查看截图**
   - 错误时会自动截图
   - 截图保存在 `tmp/auto-apply/` 目录

3. **检查HTML转储**
   - 错误时会保存页面HTML
   - 用于分析页面结构

### 步骤 5：处理特殊情况

#### 5.1 需要登录的学校

如果学校需要登录，需要：

1. **在脚本中设置 `supportsLogin: true`**
2. **用户需要提供登录凭据**
   - 可以在用户配置中保存
   - 或者在调用API时传递

3. **实现自定义登录逻辑**（如果需要）
   ```typescript
   // 如果标准登录处理器无法处理，可以自定义
   await page.goto(LOGIN_URL);
   await page.fill('#username', payload.userLogin?.username || '');
   await page.fill('#password', payload.userLogin?.password || '');
   await page.click('#login-button');
   await page.waitForNavigation();
   ```

#### 5.2 需要上传文件的学校

```typescript
// 在 run 函数中添加文件上传逻辑
const fileInput = page.locator('input[type="file"]');
if (await fileInput.count()) {
  // 假设文件路径在 payload.metadata 中
  const filePath = payload.metadata?.resumePath;
  if (filePath) {
    await fileInput.setInputFiles(filePath);
  }
}
```

#### 5.3 需要处理验证码的学校

```typescript
// 如果遇到验证码，需要暂停等待用户输入
const captchaInput = page.locator('#captcha');
if (await captchaInput.count()) {
  logger.warn("检测到验证码，需要手动处理");
  // 等待用户手动输入验证码
  await page.waitForTimeout(60000); // 等待60秒
}
```

#### 5.4 多步骤表单

```typescript
// 处理多步骤表单
let currentStep = 1;
const totalSteps = 3;

while (currentStep <= totalSteps) {
  logger.info(`处理第 ${currentStep} 步`);
  
  // 填写当前步骤的字段
  const stepFields = getFieldsForStep(fields, currentStep);
  await formFiller.fillFields(page, stepFields);
  
  // 点击"下一步"按钮
  await page.click('button:has-text("下一步")');
  await page.waitForNavigation();
  
  currentStep++;
}
```

## 字段映射说明

### 自动字段匹配

`FormFiller` 会自动尝试匹配字段，按以下优先级：

1. **标签匹配** (`getByLabel`)
2. **占位符匹配** (`placeholder`)
3. **aria-label 匹配**
4. **选择器匹配** (`select`, `checkbox`, `radio`)
5. **AI建议**（如果配置了AI映射器）

### 手动字段映射

如果自动匹配失败，可以在脚本中使用 `remapTemplateFields`：

```typescript
const overrides = remapTemplateFields(payload.template, {
  // 模板字段ID -> 页面标签/选择器
  template_field_id: { 
    label: "页面上的标签文本",
    // 或者使用选择器
    selector: "#field-id",
    // 或者使用其他提示
    placeholder: "占位符文本"
  }
});
```

## 最佳实践

### 1. 错误处理

- 始终使用 try-catch 包裹主要逻辑
- 在错误时保存截图和HTML
- 提供有意义的错误消息

### 2. 等待策略

- 使用 `utils.waitForNetworkIdle()` 等待页面加载
- 使用 `page.waitForNavigation()` 等待导航完成
- 避免使用固定的 `waitForTimeout`，除非必要

### 3. 选择器策略

- 优先使用语义化选择器（`getByRole`, `getByLabel`）
- 避免使用易变的CSS选择器
- 使用数据属性（`data-testid`）如果可用

### 4. 日志记录

- 在关键步骤记录日志
- 包含有用的上下文信息
- 使用适当的日志级别（info, warn, error）

### 5. 测试

- 在非生产环境充分测试
- 测试各种边界情况
- 测试错误恢复

## 常见问题

### Q1: 脚本执行失败，如何调试？

**A**: 
1. 设置 `PLAYWRIGHT_HEADLESS=false` 观察浏览器操作
2. 查看服务器日志中的 `[auto-apply]` 日志
3. 检查 `tmp/auto-apply/` 目录中的截图和HTML文件
4. 在脚本中添加更多日志输出

### Q2: 字段无法自动匹配怎么办？

**A**: 
1. 使用 `remapTemplateFields` 手动映射字段
2. 检查页面HTML结构，确认字段的实际标签/选择器
3. 在脚本中添加自定义字段定位逻辑

### Q3: 如何处理动态加载的内容？

**A**: 
1. 使用 `page.waitForSelector()` 等待元素出现
2. 使用 `page.waitForLoadState('networkidle')` 等待网络请求完成
3. 在填写字段前检查元素是否存在

### Q4: 如何支持需要验证码的学校？

**A**: 
1. 检测验证码输入框
2. 暂停执行，等待用户手动输入
3. 或者集成验证码识别服务（需要额外配置）

### Q5: 脚本执行很慢怎么办？

**A**: 
1. 减少不必要的等待时间
2. 并行处理可以并行的操作
3. 优化选择器，避免慢速查询
4. 考虑使用 `headless: true` 模式（更快但无法观察）

## 完整示例：录制新学校脚本的流程

### 场景：为"北京国际学校"创建脚本

1. **准备工作**
   ```bash
   # 1. 确认学校ID
   # 假设 schoolId = "beijing-international-school"
   
   # 2. 访问申请页面，分析表单结构
   # URL: https://beijing-school.edu/apply
   ```

2. **创建脚本文件**
   ```bash
   # 创建文件
   touch src/modules/auto-apply/schools/beijing-international-school.ts
   ```

3. **编写脚本**
   - 参考上面的模板
   - 根据实际页面结构调整

4. **注册脚本**
   ```typescript
   // 在 autoApplyService.ts 中
   import { beijingInternationalSchoolScript } from "./schools/beijing-international-school";
   scriptRegistry[beijingInternationalSchoolScript.id] = beijingInternationalSchoolScript;
   ```

5. **测试**
   ```bash
   # 设置环境变量
   export PLAYWRIGHT_HEADLESS=false
   
   # 启动开发服务器
   npm run dev
   
   # 在前端测试自动申请功能
   ```

6. **部署**
   - 提交代码到版本控制
   - 部署到生产环境
   - 监控执行日志

## 总结

创建自动申请脚本的关键步骤：

1. ✅ 确认学校ID和申请URL
2. ✅ 分析表单结构
3. ✅ 创建脚本文件
4. ✅ 实现自动化逻辑
5. ✅ 注册脚本
6. ✅ 测试和调试
7. ✅ 部署和监控

每个学校的脚本都是独立的，可以根据具体需求定制。如果遇到问题，参考本文档的"常见问题"部分或查看示例脚本。

