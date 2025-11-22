import type { Locator, Page } from "playwright";

import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

// 申请页面URL
const APPLY_URL = "https://www.dsc.edu.hk/admissions/applynow";
// 登录页面URL（如果需要）
const LOGIN_URL = "https://www.dsc.edu.hk/admissions/loginnow";

export const dscHkis2025Script: SchoolAutomationScript = {
  // 必须与数据库中的 schoolId 完全匹配
  id: "dsc-hkis-2025",
  name: "德思齐国际学校/DSC",
  supportsLogin: false,
  description: "德思齐国际学校/DSC自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 导航到申请页面
      logger.info("导航到申请页面", { url: APPLY_URL });
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin && false) {
        logger.info("执行登录流程");
        const loggedIn = await loginHandler.maybeLogin(page, payload.userLogin);
        if (!loggedIn) {
          logger.warn("自动登录失败，尝试手动登录");
          await utils.safeNavigate(page, LOGIN_URL);
          // TODO: 如果需要，添加特定的登录逻辑
          // await page.fill('input[name="email"]', payload.userLogin.email || '');
          // await page.fill('input[name="password"]', payload.userLogin.password || '');
          // await page.click('button[type="submit"]');
          // await page.waitForNavigation({ waitUntil: 'networkidle' });
        }
        await utils.waitForNetworkIdle(page);
      }
      
      // 步骤 3: 字段映射（如果需要）
      // 如果模板字段ID与页面字段标签不匹配，取消下面的注释并添加映射
      /*
      const overrides = remapTemplateFields(payload.template, {
        // 模板字段ID -> 页面标签映射
        // english_first_name: { label: "First Name" },
        // english_last_name: { label: "Last Name" },
        // student_email: { label: "Email Address" },
      });
      */
      
      // 步骤 4: 填写表单
      const fields = payload.template.fields;
      // 如果使用了字段映射，使用: const fields = overrides.length ? overrides : payload.template.fields;
      logger.info("开始填写表单", { fieldCount: fields.length });
      await formFiller.fillFields(page, fields);
      
      // 步骤 5: 处理特殊字段（如果需要）
      // TODO: 添加文件上传、日期选择等特殊处理
      // const fileInput = page.locator('input[type="file"]');
      // if (await fileInput.count()) {
      //   await fileInput.setInputFiles('/path/to/file.pdf');
      // }
      
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
        message: "德思齐国际学校/DSC自动申请已完成",
      };
    } catch (error) {
      logger.error("自动申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "dsc-hkis-2025-error"),
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
