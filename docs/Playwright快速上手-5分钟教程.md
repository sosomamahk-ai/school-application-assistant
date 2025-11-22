# Playwright 自动化脚本 - 5分钟快速上手

## 🚀 超快速开始（3步完成）

### 步骤 1：使用 Web 界面创建脚本（最简单）

1. **登录系统** → 访问 `http://localhost:3000`
2. **进入管理页面** → 点击"自动申请脚本管理"
3. **创建脚本** → 点击"创建新脚本"，填写信息，完成！

✅ **完成！** 脚本已自动创建并注册。

---

## 📝 手动创建脚本（如果需要自定义）

### 最简单的脚本模板

```typescript
import type { SchoolAutomationScript } from "../engine/types";

const APPLY_URL = "https://您的学校.edu/apply";

export const 您的学校Script: SchoolAutomationScript = {
  id: "您的学校ID",  // ⚠️ 必须与数据库中的 schoolId 完全一致
  name: "您的学校名称",
  supportsLogin: false,  // 如果需要登录改为 true
  description: "自动申请脚本",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 1. 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 2. 自动填写表单（系统会自动匹配字段）
      await formFiller.fillFields(page, payload.template.fields);
      
      // 3. 提交
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForNavigation();
      }
      
      return { success: true, message: "申请已提交" };
    } catch (error) {
      logger.error("申请失败", { error });
      return { success: false, message: (error as Error).message };
    }
  },
};
```

### 需要登录的版本

```typescript
async run(ctx) {
  const { utils, formFiller, loginHandler, payload, page, logger } = ctx;
  
  try {
    await utils.safeNavigate(page, APPLY_URL);
    await utils.waitForNetworkIdle(page);
    
    // 如果需要登录
    if (payload.userLogin) {
      await loginHandler.maybeLogin(page, payload.userLogin);
      await utils.waitForNetworkIdle(page);
    }
    
    await formFiller.fillFields(page, payload.template.fields);
    
    const submitBtn = page.getByRole("button", { name: /提交|submit/i });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForNavigation();
    }
    
    return { success: true, message: "申请已提交" };
  } catch (error) {
    logger.error("申请失败", { error });
    return { success: false, message: (error as Error).message };
  }
}
```

---

## 🧪 测试脚本

### 1. 设置环境变量

创建 `.env.local` 文件（项目根目录）：

```env
PLAYWRIGHT_HEADLESS=false
```

### 2. 启动服务器

```bash
npm run dev
```

### 3. 测试

1. 访问 `http://localhost:3000`
2. 登录系统
3. 进入"可申请学校"页面
4. 找到您的学校，点击"自动申请"
5. 观察浏览器自动操作 ✅

---

## 🔧 常见问题快速解决

### 字段无法匹配？

```typescript
import { remapTemplateFields } from "./common";

const overrides = remapTemplateFields(payload.template, {
  english_first_name: { label: "First Name" },
  student_email: { label: "Email Address" },
});

const fields = overrides.length ? overrides : payload.template.fields;
await formFiller.fillFields(page, fields);
```

### 需要等待页面加载？

```typescript
await utils.waitForNetworkIdle(page);
// 或
await page.waitForSelector('input[name="name"]');
```

### 找不到提交按钮？

```typescript
// 尝试多种方式
const submitBtn = 
  page.getByRole("button", { name: /提交|submit|确认|apply/i }) ||
  page.locator('button[type="submit"]') ||
  page.locator('input[type="submit"]');
```

---

## 📚 更多帮助

- **完整指南**：`docs/Playwright零基础完整指南.md`
- **示例脚本**：`src/modules/auto-apply/schools/example-school.ts`
- **常见问题**：查看完整指南的"常见问题解答"部分

---

## ✅ 检查清单

创建脚本前确认：

- [ ] 学校ID与数据库中的 `schoolId` 完全匹配
- [ ] 申请URL正确且可访问
- [ ] 脚本已注册到 `autoApplyService.ts`（如果手动创建）
- [ ] 已设置 `PLAYWRIGHT_HEADLESS=false` 用于测试
- [ ] 已测试基本流程（打开页面、填写字段、提交）

---

**需要帮助？** 查看完整指南或查看示例代码！

