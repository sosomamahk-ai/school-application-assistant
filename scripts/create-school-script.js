#!/usr/bin/env node

/**
 * 脚本生成工具：为新学校创建自动申请脚本模板
 * 
 * 使用方法：
 *   node scripts/create-school-script.js <school-id> [school-name] [apply-url]
 * 
 * 示例：
 *   node scripts/create-school-script.js shanghai-international-school "上海国际学校" "https://shanghai-school.edu/apply"
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const schoolId = process.argv[2];
const schoolName = process.argv[3] || 'New School';
const applyUrl = process.argv[4] || 'https://example.edu/apply';

if (!schoolId) {
  console.error('错误: 请提供学校ID');
  console.log('\n使用方法:');
  console.log('  node scripts/create-school-script.js <school-id> [school-name] [apply-url]');
  console.log('\n示例:');
  console.log('  node scripts/create-school-script.js shanghai-international-school "上海国际学校" "https://shanghai-school.edu/apply"');
  process.exit(1);
}

// 生成文件名（kebab-case）
const fileName = schoolId.replace(/_/g, '-').toLowerCase();
const filePath = path.join(__dirname, '../src/modules/auto-apply/schools', `${fileName}.ts`);

// 生成变量名（camelCase）
const varName = schoolId
  .split(/[-_]/)
  .map((word, index) => 
    index === 0 
      ? word.toLowerCase() 
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  )
  .join('') + 'Script';

// 脚本模板
const scriptTemplate = `import type { Locator, Page } from "playwright";

import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

// 申请页面URL
const APPLY_URL = "${applyUrl}";
// 登录页面URL（如果需要）
const LOGIN_URL = "${applyUrl.replace('/apply', '/login')}";

export const ${varName}: SchoolAutomationScript = {
  // 必须与数据库中的 schoolId 完全匹配
  id: "${schoolId}",
  name: "${schoolName}",
  supportsLogin: false, // 如果需要登录，设置为 true
  description: "${schoolName}自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 导航到申请页面
      logger.info("导航到申请页面", { url: APPLY_URL });
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin && ctx.supportsLogin) {
        logger.info("执行登录流程");
        const loggedIn = await loginHandler.maybeLogin(page, payload.userLogin);
        if (!loggedIn) {
          logger.warn("自动登录失败，尝试手动登录");
          await utils.safeNavigate(page, LOGIN_URL);
          // TODO: 添加特定的登录逻辑
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
        // student_phone: { label: "Phone Number" },
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
        message: "${schoolName}自动申请已完成",
      };
    } catch (error) {
      logger.error("自动申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "${fileName}-error"),
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
`;

// 检查文件是否已存在
if (fs.existsSync(filePath)) {
  console.error(`错误: 文件已存在: ${filePath}`);
  console.log('如果确定要覆盖，请先删除该文件。');
  process.exit(1);
}

// 确保目录存在
const dir = path.dirname(filePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 写入文件
fs.writeFileSync(filePath, scriptTemplate, 'utf8');

console.log('✅ 脚本文件已创建:');
console.log(`   ${filePath}`);
console.log('\n📝 下一步:');
console.log('1. 编辑脚本文件，根据实际页面调整:');
console.log('   - 申请URL');
console.log('   - 登录逻辑（如果需要）');
console.log('   - 字段映射（如果自动匹配失败）');
console.log('   - 特殊字段处理');
console.log('\n2. 在 src/modules/auto-apply/autoApplyService.ts 中注册脚本:');
console.log(`   import { ${varName} } from "./schools/${fileName}";`);
console.log(`   scriptRegistry[${varName}.id] = ${varName};`);
console.log('\n3. 测试脚本:');
console.log('   - 设置 PLAYWRIGHT_HEADLESS=false');
console.log('   - 启动开发服务器');
console.log('   - 在前端测试自动申请功能');
console.log('\n📚 更多信息请查看: docs/AUTO_APPLY_SCRIPT_GUIDE.md');

