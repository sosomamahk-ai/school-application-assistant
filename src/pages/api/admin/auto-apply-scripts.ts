import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticate } from '@/utils/auth';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const SCRIPTS_DIR = join(process.cwd(), 'src/modules/auto-apply/schools');
const SERVICE_FILE = join(process.cwd(), 'src/modules/auto-apply/autoApplyService.ts');

// 获取所有脚本
async function getScripts(): Promise<any[]> {
  try {
    if (!existsSync(SCRIPTS_DIR)) {
      return [];
    }

    const files = await readdir(SCRIPTS_DIR);
    const scriptFiles = files.filter(f => f.endsWith('.ts') && f !== 'common.ts' && f !== 'example-school.ts');
    
    const scripts = [];
    let serviceContent = '';
    
    try {
      serviceContent = await readFile(SERVICE_FILE, 'utf-8');
    } catch (error) {
      console.warn('Failed to read service file:', error);
    }
    
    for (const file of scriptFiles) {
      try {
        const filePath = join(SCRIPTS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        
        // 提取脚本信息
        const idMatch = content.match(/id:\s*["']([^"']+)["']/);
        const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
        const urlMatch = content.match(/APPLY_URL\s*=\s*["']([^"']+)["']/);
        const loginMatch = content.match(/supportsLogin:\s*(true|false)/);
        
        if (idMatch) {
          const schoolId = idMatch[1];
          const isRegistered = serviceContent ? serviceContent.includes(schoolId) : false;
          
          scripts.push({
            id: schoolId,
            schoolId,
            name: nameMatch ? nameMatch[1] : schoolId,
            applyUrl: urlMatch ? urlMatch[1] : '',
            supportsLogin: loginMatch ? loginMatch[1] === 'true' : false,
            description: '',
            filePath: filePath,
            isRegistered
          });
        }
      } catch (error) {
        console.error(`Failed to read script file ${file}:`, error);
        // 继续处理其他文件
      }
    }
    
    return scripts;
  } catch (error) {
    console.error('Failed to get scripts:', error);
    return [];
  }
}

// 创建新脚本
async function createScript(
  schoolId: string,
  schoolName: string,
  applyUrl: string,
  supportsLogin: boolean
): Promise<{ filePath: string }> {
  // 确保目录存在
  if (!existsSync(SCRIPTS_DIR)) {
    await mkdir(SCRIPTS_DIR, { recursive: true });
  }

  // 生成变量名（camelCase）
  const varName = schoolId
    .split(/[-_]/)
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('') + 'Script';

  // 生成文件名
  const fileName = schoolId.replace(/_/g, '-').toLowerCase() + '.ts';
  const filePath = join(SCRIPTS_DIR, fileName);

  // 检查文件是否已存在
  if (existsSync(filePath)) {
    throw new Error(`脚本文件已存在: ${fileName}`);
  }

  // 生成脚本内容
  const scriptContent = `import type { Locator, Page } from "playwright";

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
  supportsLogin: ${supportsLogin},
  description: "${schoolName}自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
    
    try {
      // 步骤 1: 导航到申请页面
      logger.info("导航到申请页面", { url: APPLY_URL });
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 步骤 2: 如果需要登录，先执行登录
      if (payload.userLogin && ${supportsLogin}) {
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
        message: "${schoolName}自动申请已完成",
      };
    } catch (error) {
      logger.error("自动申请失败", { error });
      const [screenshotPath, htmlPath] = await Promise.all([
        utils.takeScreenshot(page, payload.runId, "${schoolId}-error"),
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

  // 写入文件
  await writeFile(filePath, scriptContent, 'utf8');

  // 自动注册脚本到 service 文件
  try {
    let serviceContent = await readFile(SERVICE_FILE, 'utf-8');
    const fileNameWithoutExt = fileName.replace('.ts', '');
    
    // 检查是否已经导入
    const importPattern = new RegExp(`import.*${varName}.*from`, 'm');
    if (!importPattern.test(serviceContent)) {
      // 找到最后一个 import 语句的位置
      const importLines = serviceContent.split('\n');
      let lastImportIndex = -1;
      for (let i = importLines.length - 1; i >= 0; i--) {
        if (importLines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
          break;
        }
      }
      
      // 添加导入语句
      const importLine = `import { ${varName} } from "./schools/${fileNameWithoutExt}";`;
      if (lastImportIndex >= 0) {
        importLines.splice(lastImportIndex + 1, 0, importLine);
      } else {
        // 如果找不到 import，在文件开头添加
        importLines.unshift(importLine);
      }
      serviceContent = importLines.join('\n');
    }
    
    // 添加到注册表
    const registryPattern = /const scriptRegistry: SchoolScriptMap = \{([^}]+)\};/s;
    const match = serviceContent.match(registryPattern);
    if (match) {
      const registryContent = match[1];
      // 检查是否已经注册
      if (!registryContent.includes(`${varName}.id`)) {
        const newRegistryEntry = `  [${varName}.id]: ${varName},\n`;
        const updatedRegistry = `const scriptRegistry: SchoolScriptMap = {${registryContent}${newRegistryEntry}};`;
        serviceContent = serviceContent.replace(registryPattern, updatedRegistry);
        await writeFile(SERVICE_FILE, serviceContent, 'utf8');
      }
    }
  } catch (error) {
    console.error('Failed to auto-register script:', error);
    // 不抛出错误，因为脚本文件已经创建成功
  }

  return { filePath };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const userId = await authenticate(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 检查用户角色（只有管理员可以操作）
    // 这里可以添加角色检查逻辑

    if (req.method === 'GET') {
      try {
        const scripts = await getScripts();
        return res.status(200).json({ success: true, scripts });
      } catch (error) {
        console.error('Failed to get scripts:', error);
        return res.status(500).json({ error: 'Failed to get scripts' });
      }
    }

    if (req.method === 'POST') {
      try {
        const { schoolId, schoolName, applyUrl, supportsLogin } = req.body;

        if (!schoolId || !schoolName || !applyUrl) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await createScript(schoolId, schoolName, applyUrl, supportsLogin || false);
        return res.status(200).json({ 
          success: true, 
          message: 'Script created successfully',
          filePath: result.filePath
        });
      } catch (error) {
        console.error('Failed to create script:', error);
        return res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to create script' 
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API handler error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

