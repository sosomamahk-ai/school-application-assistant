# 自动申请功能 - 快速开始

## 快速操作示例

### 示例：为"上海国际学校"添加自动申请功能

#### 第一步：确认学校信息

1. 登录系统，进入"可申请学校"页面
2. 找到"上海国际学校"，记录：
   - **学校ID** (schoolId): `shanghai-international-school`
   - **申请URL**: `https://shanghai-school.edu/apply`
   - **是否需要登录**: 是/否

#### 第二步：创建脚本文件

在项目根目录运行：

```bash
# 使用模板创建新脚本
node scripts/create-school-script.js shanghai-international-school
```

或者手动创建文件：`src/modules/auto-apply/schools/shanghai-international-school.ts`

#### 第三步：填写脚本内容

```typescript
import type { SchoolAutomationScript } from "../engine/types";
import { remapTemplateFields } from "./common";

const APPLY_URL = "https://shanghai-school.edu/apply";

export const shanghaiInternationalSchoolScript: SchoolAutomationScript = {
  id: "shanghai-international-school", // 必须与数据库中的 schoolId 匹配
  name: "上海国际学校",
  supportsLogin: false, // 如果需要登录改为 true
  description: "上海国际学校自动申请",
  
  async run(ctx) {
    const { utils, formFiller, payload, page, logger } = ctx;
    
    try {
      // 1. 打开申请页面
      await utils.safeNavigate(page, APPLY_URL);
      await utils.waitForNetworkIdle(page);
      
      // 2. 填写表单（自动匹配字段）
      await formFiller.fillFields(page, payload.template.fields);
      
      // 3. 提交
      const submitBtn = page.getByRole("button", { name: /提交|submit/i });
      if (await submitBtn.count()) {
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

#### 第四步：注册脚本

在 `src/modules/auto-apply/autoApplyService.ts` 中添加：

```typescript
import { shanghaiInternationalSchoolScript } from "./schools/shanghai-international-school";

const scriptRegistry: SchoolScriptMap = {
  // ... 其他脚本
  [shanghaiInternationalSchoolScript.id]: shanghaiInternationalSchoolScript,
};
```

#### 第五步：测试

1. 设置环境变量（`.env.local`）：
   ```
   PLAYWRIGHT_HEADLESS=false
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 在前端测试：
   - 登录系统
   - 进入"可申请学校"
   - 找到"上海国际学校"
   - 点击"自动申请"按钮
   - 观察浏览器自动操作

## 常见场景处理

### 场景1：字段无法自动匹配

**问题**：模板字段ID是 `english_first_name`，但页面上是"First Name"

**解决**：使用字段映射

```typescript
const overrides = remapTemplateFields(payload.template, {
  english_first_name: { label: "First Name" },
  english_last_name: { label: "Last Name" },
});

const fields = overrides.length ? overrides : payload.template.fields;
await formFiller.fillFields(page, fields);
```

### 场景2：需要登录

**问题**：申请前需要先登录

**解决**：

```typescript
export const schoolScript: SchoolAutomationScript = {
  id: "school-id",
  supportsLogin: true, // 设置为 true
  async run(ctx) {
    const { loginHandler, payload, page } = ctx;
    
    // 自动登录（如果提供了登录信息）
    if (payload.userLogin) {
      await loginHandler.maybeLogin(page, payload.userLogin);
    }
    
    // ... 继续申请流程
  },
};
```

### 场景3：多步骤表单

**问题**：表单分多页，需要逐步填写

**解决**：

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

### 场景4：特殊字段类型

**问题**：需要上传文件、选择日期等

**解决**：

```typescript
// 上传文件
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles('/path/to/file.pdf');

// 选择日期
await page.fill('input[type="date"]', '2024-01-01');

// 选择下拉框
await page.selectOption('select[name="grade"]', 'Grade 10');
```

## 调试技巧

### 1. 查看浏览器操作

设置 `PLAYWRIGHT_HEADLESS=false`，可以看到浏览器自动操作过程。

### 2. 查看日志

服务器控制台会输出详细日志，查找 `[auto-apply]` 开头的消息。

### 3. 查看错误截图

如果出错，会在 `tmp/auto-apply/` 目录保存截图和HTML文件。

### 4. 添加调试日志

```typescript
logger.info("当前步骤", { 
  url: page.url(),
  fieldCount: fields.length 
});
```

## 检查清单

创建新脚本前，确认：

- [ ] 学校ID与数据库中的 `schoolId` 完全匹配
- [ ] 申请URL正确且可访问
- [ ] 脚本已注册到 `autoApplyService.ts`
- [ ] 已测试基本流程（打开页面、填写字段、提交）
- [ ] 已处理错误情况
- [ ] 已添加必要的日志

## 获取帮助

如果遇到问题：

1. 查看完整文档：`docs/AUTO_APPLY_SCRIPT_GUIDE.md`
2. 参考示例脚本：`src/modules/auto-apply/schools/example-school.ts`
3. 检查服务器日志和错误截图

