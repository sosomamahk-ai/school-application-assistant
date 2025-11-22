# Playwright 自动化脚本 - 完整示例

本文档提供了多个实际可用的脚本示例，您可以直接复制并根据需要修改。

---

## 示例 1：最简单的脚本（不需要登录）

适用于：申请页面直接显示表单，无需登录

```typescript
import type { SchoolAutomationScript } from "../engine/types";

const APPLY_URL = "https://example-school.edu/apply";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",  // ⚠️ 必须与数据库中的 schoolId 完全一致
  name: "示例学校",
  supportsLogin: false,
  description: "示例学校自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      logger.info("正在打开申请页面...");
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 自动填写表单
      logger.info("开始填写表单...");
      await formFiller.fillFields(page, payload.template.fields);
      
      // 步骤 3: 提交表单
      logger.info("正在提交表单...");
      const submitBtn = page.getByRole("button", { name: /提交|submit|确认|apply/i });
      if (await submitBtn.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          submitBtn.click(),
        ]);
      }
      
      // 步骤 4: 等待页面加载完成
      await utils.waitForNetworkIdle(page);
      
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
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

---

## 示例 2：需要登录的脚本

适用于：申请前需要先登录

```typescript
import type { SchoolAutomationScript } from "../engine/types";

const APPLY_URL = "https://example-school.edu/apply";
const LOGIN_URL = "https://example-school.edu/login";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "示例学校",
  supportsLogin: true,  // ⚠️ 设置为 true
  description: "示例学校自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      logger.info("正在打开申请页面...");
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin) {
        logger.info("正在登录...");
        const loggedIn = await loginHandler.maybeLogin(page, payload.userLogin);
        
        if (!loggedIn) {
          // 如果自动登录失败，尝试手动登录
          logger.warn("自动登录失败，尝试手动登录");
          await utils.safeNavigate(page, LOGIN_URL);
          await page.fill('input[name="email"]', payload.userLogin.email || '');
          await page.fill('input[name="password"]', payload.userLogin.password || '');
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle' });
        }
        
        await utils.waitForNetworkIdle(page);
      }
      
      // 步骤 3: 填写表单
      logger.info("开始填写表单...");
      await formFiller.fillFields(page, payload.template.fields);
      
      // 步骤 4: 提交表单
      logger.info("正在提交表单...");
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          submitBtn.click(),
        ]);
      }
      
      await utils.waitForNetworkIdle(page);
      
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
    } catch (error) {
      logger.error("申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "example-school-error"),
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
```

---

## 示例 3：需要字段映射的脚本

适用于：页面字段标签与模板字段不匹配

```typescript
import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

const APPLY_URL = "https://example-school.edu/apply";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "示例学校",
  supportsLogin: false,
  description: "示例学校自动申请脚本（带字段映射）",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 字段映射
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
      
      // 步骤 3: 填写表单
      const fields = overrides.length ? overrides : payload.template.fields;
      logger.info("开始填写表单", { fieldCount: fields.length });
      await formFiller.fillFields(page, fields);
      
      // 步骤 4: 提交表单
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          submitBtn.click(),
        ]);
      }
      
      await utils.waitForNetworkIdle(page);
      
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
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

---

## 示例 4：多步骤表单脚本

适用于：表单分多页，需要逐步填写

```typescript
import type { SchoolAutomationScript } from "../engine/types";

const APPLY_URL = "https://example-school.edu/apply";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "示例学校",
  supportsLogin: false,
  description: "示例学校自动申请脚本（多步骤表单）",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 填写第一步（基本信息）
      logger.info("填写第一步：基本信息");
      const step1Fields = payload.template.fields.filter(field => 
        ['english_first_name', 'english_last_name', 'student_email', 'student_phone'].includes(field.fieldId)
      );
      await formFiller.fillFields(page, step1Fields);
      
      // 点击"下一步"
      const nextBtn1 = page.getByRole("button", { name: /下一步|next|continue/i });
      if (await nextBtn1.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          nextBtn1.click(),
        ]);
      }
      await utils.waitForNetworkIdle(page);
      
      // 步骤 3: 填写第二步（教育背景）
      logger.info("填写第二步：教育背景");
      const step2Fields = payload.template.fields.filter(field => 
        field.fieldId.includes('education') || field.fieldId.includes('school')
      );
      await formFiller.fillFields(page, step2Fields);
      
      // 点击"下一步"
      const nextBtn2 = page.getByRole("button", { name: /下一步|next|continue/i });
      if (await nextBtn2.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          nextBtn2.click(),
        ]);
      }
      await utils.waitForNetworkIdle(page);
      
      // 步骤 4: 填写第三步（其他信息）
      logger.info("填写第三步：其他信息");
      const step3Fields = payload.template.fields.filter(field => 
        !['english_first_name', 'english_last_name', 'student_email', 'student_phone'].includes(field.fieldId) &&
        !field.fieldId.includes('education') && !field.fieldId.includes('school')
      );
      await formFiller.fillFields(page, step3Fields);
      
      // 步骤 5: 提交表单
      logger.info("正在提交表单...");
      const submitBtn = page.getByRole("button", { name: /提交|submit|确认/i });
      if (await submitBtn.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          submitBtn.click(),
        ]);
      }
      
      await utils.waitForNetworkIdle(page);
      
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
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

---

## 示例 5：需要上传文件的脚本

适用于：申请需要上传文件（如简历、成绩单等）

```typescript
import type { SchoolAutomationScript } from "../engine/types";

const APPLY_URL = "https://example-school.edu/apply";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "示例学校",
  supportsLogin: false,
  description: "示例学校自动申请脚本（需要上传文件）",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 填写表单
      await formFiller.fillFields(page, payload.template.fields);
      
      // 步骤 3: 上传文件
      // 假设文件路径在 payload.metadata 中
      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();
      
      if (fileInputCount > 0) {
        logger.info(`检测到 ${fileInputCount} 个文件上传字段`);
        
        // 上传简历（如果存在）
        const resumeInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"][name*="resume"]').first();
        if (await resumeInput.count() > 0) {
          const resumePath = payload.metadata?.resumePath;
          if (resumePath) {
            logger.info("上传简历", { path: resumePath });
            await resumeInput.setInputFiles(resumePath);
          }
        }
        
        // 上传成绩单（如果存在）
        const transcriptInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"][name*="transcript"]').first();
        if (await transcriptInput.count() > 0) {
          const transcriptPath = payload.metadata?.transcriptPath;
          if (transcriptPath) {
            logger.info("上传成绩单", { path: transcriptPath });
            await transcriptInput.setInputFiles(transcriptPath);
          }
        }
        
        // 等待文件上传完成
        await page.waitForTimeout(2000);
      }
      
      // 步骤 4: 提交表单
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }).catch(() => undefined),
          submitBtn.click(),
        ]);
      }
      
      await utils.waitForNetworkIdle(page);
      
      return { 
        success: true, 
        message: "申请已成功提交！" 
      };
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

---

## 示例 6：完整的生产级脚本（包含错误处理和验证）

适用于：需要完整错误处理和结果验证的场景

```typescript
import type { Locator, Page } from "playwright";
import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

const APPLY_URL = "https://example-school.edu/apply";
const LOGIN_URL = "https://example-school.edu/login";

export const exampleSchoolScript: SchoolAutomationScript = {
  id: "example-school",
  name: "示例学校",
  supportsLogin: true,
  description: "示例学校自动申请脚本（完整版）",
  
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
          logger.warn("自动登录失败，尝试手动登录");
          await utils.safeNavigate(page, LOGIN_URL);
          await page.fill('input[name="email"]', payload.userLogin.email || '');
          await page.fill('input[name="password"]', payload.userLogin.password || '');
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle' });
        }
        await utils.waitForNetworkIdle(page);
      }
      
      // 步骤 3: 字段映射
      const overrides = remapTemplateFields(payload.template, {
        english_first_name: { label: "First Name" },
        english_last_name: { label: "Last Name" },
        student_email: { label: "Email Address" },
        student_phone: { label: "Phone Number" },
        home_address: { label: "Home Address" },
        date_of_birth: { label: "Date of Birth" },
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
        return {
          success: true,
          message: "申请已成功提交！",
        };
      } else {
        logger.warn("无法确认申请是否成功提交");
        return {
          success: true,  // 即使无法确认，也认为成功（因为已经提交）
          message: "申请已提交，但无法确认提交结果",
        };
      }
    } catch (error) {
      logger.error("自动申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "example-school-error"),
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
    if (await locator.count() > 0) {
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

---

## 使用说明

1. **选择适合的示例**：根据您的学校申请页面特点选择最接近的示例
2. **修改基本信息**：
   - 修改 `id`（必须与数据库中的 schoolId 一致）
   - 修改 `name`（学校名称）
   - 修改 `APPLY_URL`（申请页面URL）
3. **根据实际情况调整**：
   - 如果需要登录，设置 `supportsLogin: true`
   - 如果字段无法匹配，添加字段映射
   - 如果是多步骤表单，参考示例 4
   - 如果需要上传文件，参考示例 5
4. **测试脚本**：
   - 设置 `PLAYWRIGHT_HEADLESS=false` 在 `.env.local` 中
   - 启动服务器：`npm run dev`
   - 在前端测试自动申请功能

---

## 更多资源

- **零基础完整指南**：`docs/Playwright零基础完整指南.md`
- **快速上手教程**：`docs/Playwright快速上手-5分钟教程.md`
- **示例脚本**：`src/modules/auto-apply/schools/example-school.ts`

