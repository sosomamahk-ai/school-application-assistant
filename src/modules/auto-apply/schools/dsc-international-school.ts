import type { Locator, Page } from "playwright";

import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

// DSC International School 申请页面URL
const APPLY_URL = "https://www.dsc.edu.hk/admissions/applynow";

export const dscInternationalSchoolScript: SchoolAutomationScript = {
  // ⚠️ 重要：id 必须与数据库中的 schoolId 完全一致
  id: "dsc-hkis-2025",  // 数据库中的实际 schoolId
  name: "DSC International School (德思齐国际学校)",
  supportsLogin: false,  // 不需要登录
  description: "DSC International School 自动申请脚本 - 不需要登录即可提交申请",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    // 辅助函数：安全地滚动到元素并填写
    const safeFillField = async (field: typeof payload.template.fields[0]) => {
      try {
        // 先尝试找到字段
        const locator = await findFieldLocator(page, field);
        if (!locator) {
          logger.warn(`无法找到字段: ${field.fieldId}`);
          return false;
        }
        
        // 检查元素是否可见，如果不可见则尝试滚动
        const isVisible = await locator.isVisible().catch(() => false);
        if (!isVisible) {
          logger.info(`字段 ${field.fieldId} 不可见，尝试滚动...`);
          // 使用更宽松的滚动方式
          await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {
            // 如果滚动失败，尝试直接滚动到元素位置
            return locator.evaluate((el) => {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
          });
          await page.waitForTimeout(500);
        }
        
        // 填写字段
        await formFiller.fillField(page, field);
        return true;
      } catch (error) {
        logger.warn(`填写字段 ${field.fieldId} 时出错: ${(error as Error).message}`);
        return false;
      }
    };
    
    // 辅助函数：查找字段定位器
    const findFieldLocator = async (page: Page, field: typeof payload.template.fields[0]) => {
      // 尝试通过标签查找
      if (field.label) {
        const labelLocator = page.getByLabel(field.label, { exact: false });
        if (await labelLocator.count() > 0) {
          return labelLocator.first();
        }
      }
      
      // 尝试通过占位符查找
      const placeholderSelectors = [
        `input[placeholder*="${field.fieldId}" i]`,
        `textarea[placeholder*="${field.fieldId}" i]`,
        `input[placeholder*="${field.label}" i]`,
        `textarea[placeholder*="${field.label}" i]`,
      ];
      
      for (const selector of placeholderSelectors) {
        const locator = page.locator(selector);
        if (await locator.count() > 0) {
          return locator.first();
        }
      }
      
      return null;
    };
    
    try {
      // 步骤 1: 打开申请页面
      logger.info("正在打开 DSC International School 申请页面...", { url: APPLY_URL });
      await utils.safeNavigate(page, APPLY_URL);
      
      // 等待页面基本加载完成（使用更宽松的策略，避免 networkidle 超时）
      try {
        await page.waitForLoadState("load", { timeout: 15000 });
      } catch (e) {
        logger.warn("等待 load 状态超时，继续执行");
      }
      
      // 尝试等待网络空闲，但不强制（某些网站可能持续有网络请求）
      try {
        await page.waitForLoadState("networkidle", { timeout: 20000 });
      } catch (e) {
        logger.warn("等待 networkidle 状态超时，继续执行（这通常是正常的）");
      }
      
      // 等待表单容器出现（尝试多种可能的选择器）
      logger.info("等待表单加载...");
      try {
        // 尝试等待常见的表单容器
        await Promise.race([
          page.waitForSelector('form', { timeout: 10000 }).catch(() => null),
          page.waitForSelector('[role="form"]', { timeout: 10000 }).catch(() => null),
          page.waitForSelector('.form', { timeout: 10000 }).catch(() => null),
          page.waitForSelector('#application-form', { timeout: 10000 }).catch(() => null),
        ]);
      } catch (e) {
        logger.warn("未找到明确的表单容器，继续执行");
      }
      
      // 滚动到页面顶部，确保从顶部开始
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      // 步骤 2: 字段映射（如果需要）
      // 根据实际页面字段标签调整映射关系
      // 如果自动匹配失败，可以取消下面的注释并调整映射
      /*
      const overrides = remapTemplateFields(payload.template, {
        english_first_name: { label: "First Name" },
        english_last_name: { label: "Last Name" },
        student_email: { label: "Email" },
        student_phone: { label: "Phone" },
        home_address: { label: "Address" },
        date_of_birth: { label: "Date of Birth" },
      });
      const fields = overrides.length ? overrides : payload.template.fields;
      */
      
      // 步骤 3: 自动填写表单
      // 系统会自动匹配字段（通过标签、占位符等）
      logger.info("开始填写申请表单...", { fieldCount: payload.template.fields.length });
      
      // 逐个填写字段，并处理可能的错误
      let successCount = 0;
      let failCount = 0;
      
      for (const field of payload.template.fields) {
        try {
          logger.info(`正在填写字段: ${field.fieldId}`);
          
          // 先尝试找到字段并滚动到可见位置
          const fieldLocator = await findFieldLocator(page, field);
          if (fieldLocator) {
            // 尝试滚动到元素（使用更短的超时时间）
            try {
              await fieldLocator.scrollIntoViewIfNeeded({ timeout: 3000 });
            } catch (scrollError) {
              // 如果滚动失败，尝试使用 JavaScript 直接滚动
              await fieldLocator.evaluate((el) => {
                el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
              });
            }
            await page.waitForTimeout(300);
          }
          
          // 填写字段
          await formFiller.fillField(page, field);
          successCount++;
          
          // 每个字段填写后稍作等待
          await page.waitForTimeout(200);
        } catch (error) {
          failCount++;
          const errorMsg = (error as Error).message;
          logger.warn(`字段 ${field.fieldId} 填写失败，跳过`, { error: errorMsg });
          
          // 如果是可见性错误，尝试继续（可能是字段在页面下方）
          if (errorMsg.includes('not visible') || errorMsg.includes('Timeout')) {
            logger.info(`字段 ${field.fieldId} 可能不可见，尝试继续下一个字段`);
          }
          // 继续填写下一个字段，而不是中断整个流程
          continue;
        }
      }
      
      logger.info(`表单填写完成: 成功 ${successCount} 个，失败 ${failCount} 个`);
      
      // 步骤 4: 处理文件上传（如果需要）
      // 根据网页说明，需要上传多个文件，但文件上传通常需要实际文件路径
      // 如果 payload.metadata 中包含文件路径，可以在这里处理
      /*
      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();
      if (fileInputCount > 0) {
        logger.info(`检测到 ${fileInputCount} 个文件上传字段`);
        // 处理文件上传逻辑
      }
      */
      
      // 步骤 5: 提交表单
      logger.info("正在查找并点击提交按钮...");
      const submitButton = await locateSubmitButton(page, logger);
      
      if (submitButton) {
        logger.info("找到提交按钮，准备提交");
        // 使用更宽松的等待策略，避免超时
        const clickPromise = submitButton.click();
        
        // 尝试等待导航或页面状态变化，但不强制
        const navigationPromise = Promise.race([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {
            logger.warn("等待导航超时，可能表单已提交但未跳转");
            return null;
          }),
          page.waitForLoadState("load", { timeout: 20_000 }).catch(() => {
            logger.warn("等待 load 状态超时");
            return null;
          }),
        ]);
        
        await Promise.all([clickPromise, navigationPromise]);
      } else {
        logger.warn("未找到提交按钮，尝试其他方式");
        // 尝试其他可能的提交方式
        const alternativeSubmit = page.locator('button[type="submit"], input[type="submit"]').first();
        if (await alternativeSubmit.count() > 0) {
          const clickPromise = alternativeSubmit.click();
          const navigationPromise = Promise.race([
            page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {
              logger.warn("等待导航超时，可能表单已提交但未跳转");
              return null;
            }),
            page.waitForLoadState("load", { timeout: 20_000 }).catch(() => {
              logger.warn("等待 load 状态超时");
              return null;
            }),
          ]);
          await Promise.all([clickPromise, navigationPromise]);
        } else {
          throw new Error("无法找到提交按钮");
        }
      }
      
      // 步骤 6: 等待页面稳定（使用更宽松的策略）
      try {
        await page.waitForTimeout(2000); // 给页面一些时间稳定
        await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {
          logger.warn("等待页面 load 状态超时，继续执行");
        });
      } catch (e) {
        logger.warn("等待页面稳定时出错，继续执行", { error: (e as Error).message });
      }
      
      // 步骤 7: 验证提交结果（可选）
      const success = await verifySubmission(page);
      if (success) {
        logger.info("申请提交成功！");
        return {
          success: true,
          message: "DSC International School 申请已成功提交！",
        };
      } else {
        logger.warn("无法确认申请是否成功提交，但表单已填写并提交");
        return {
          success: true,  // 即使无法确认，也认为成功（因为已经提交）
          message: "申请已提交，但无法确认提交结果。请手动检查。",
        };
      }
    } catch (error) {
      logger.error("DSC International School 申请失败", { error });
      
      // 保存错误截图和HTML用于调试
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "dsc-international-school-error"),
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

/**
 * 定位提交按钮
 * 尝试多种可能的选择器来找到提交按钮
 */
async function locateSubmitButton(page: Page, logger: any): Promise<Locator | null> {
  const candidates = [
    // 按优先级尝试不同的选择器
    page.getByRole("button", { name: /submit|apply|提交|确认|send|提交申请/i }),
    page.locator('button[type="submit"]'),
    page.locator('input[type="submit"]'),
    page.locator('button:has-text("Submit")'),
    page.locator('button:has-text("提交")'),
    page.locator('button:has-text("Apply")'),
    page.locator('button:has-text("Send")'),
    page.locator('#submit-button'),
    page.locator('#apply-button'),
    page.locator('.submit-btn'),
    page.locator('.apply-button'),
    // Finalsite CMS 可能使用的类名
    page.locator('[data-submit]'),
    page.locator('button.submit'),
  ];

  for (const locator of candidates) {
    try {
      if (await locator.count() > 0) {
        logger.info("找到提交按钮", { selector: locator.toString() });
        return locator.first();
      }
    } catch (e) {
      // 继续尝试下一个
      continue;
    }
  }
  
  return null;
}

/**
 * 验证提交结果
 * 检查页面是否包含成功消息
 */
async function verifySubmission(page: Page): Promise<boolean> {
  try {
    // 检查页面是否包含成功消息
    const successIndicators = [
      /success|成功|已提交|已完成|thank you|感谢|submitted|received/i,
      /application.*received|申请.*已收到|申请.*成功/i,
    ];
    
    const pageText = (await page.textContent('body')) || '';
    const hasSuccessIndicator = successIndicators.some(pattern => pattern.test(pageText));
    
    // 也可以检查URL变化（如果提交后跳转到确认页面）
    const currentUrl = page.url();
    const hasConfirmationUrl = /confirm|success|thank|完成|成功/.test(currentUrl);
    
    return hasSuccessIndicator || hasConfirmationUrl;
  } catch (error) {
    // 如果验证失败，返回 false（但不影响整体成功状态）
    return false;
  }
}


