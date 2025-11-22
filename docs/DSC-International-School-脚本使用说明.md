# DSC International School 自动化申请脚本使用说明

## 📋 概述

本文档说明如何使用为 **DSC International School (德思齐国际学校)** 创建的 Playwright 自动化申请脚本。

**申请页面：** https://www.dsc.edu.hk/admissions/applynow  
**是否需要登录：** 否（不需要登录即可提交申请）

---

## ✅ 已完成的工作

1. ✅ **创建脚本文件**
   - 文件位置：`src/modules/auto-apply/schools/dsc-international-school.ts`
   - 脚本ID：`dsc-hkis-2025`（与数据库中的 schoolId 一致）

2. ✅ **注册脚本到系统**
   - 已在 `src/modules/auto-apply/autoApplyService.ts` 中注册
   - 脚本已可用

---

## 🔧 使用前准备

### 1. 确认数据库中的学校ID

**重要：** 脚本中的 `id` 必须与数据库中的 `schoolId` 完全一致！

**当前配置：**
- 数据库中的 `schoolId`：`dsc-hkis-2025`
- 脚本中的 `id`：`dsc-hkis-2025` ✅（已匹配）

**如何检查：**

方法一：使用 Web 界面
1. 登录系统
2. 进入"自动申请脚本管理"页面
3. 查看学校列表，确认是否有 `dsc-hkis-2025`

方法二：查看数据库
```bash
npx prisma studio
```
然后查看 `SchoolFormTemplate` 表，找到 DSC International School 的 `schoolId`。

**如果数据库中的 `schoolId` 不同：**

需要修改脚本文件中的 `id`：
```typescript
// 在 src/modules/auto-apply/schools/dsc-international-school.ts 中
export const dscInternationalSchoolScript: SchoolAutomationScript = {
  id: "实际的-schoolId",  // ⚠️ 修改这里
  // ...
};
```

### 2. 准备测试环境

创建或编辑 `.env.local` 文件（项目根目录）：

```env
PLAYWRIGHT_HEADLESS=false
AUTO_APPLY_SCREENSHOTS=tmp/auto-apply
```

**说明：**
- `PLAYWRIGHT_HEADLESS=false` - 让浏览器显示出来（可以看到操作过程）
- `AUTO_APPLY_SCREENSHOTS=tmp/auto-apply` - 错误时保存截图的位置

---

## 🚀 测试脚本

### 步骤 1：启动开发服务器

```bash
npm run dev
```

### 步骤 2：通过 Web 界面测试

1. **打开浏览器**，访问：`http://localhost:3000`
2. **登录系统**
3. **进入"可申请学校"页面**
   - 点击导航栏的"可申请学校"
   - 或直接访问：`http://localhost:3000/schools`
4. **找到 DSC International School**
5. **点击"自动申请"按钮**
6. **观察浏览器操作**
   - 浏览器会自动打开（因为设置了 `PLAYWRIGHT_HEADLESS=false`）
   - 您可以看到：
     - 页面自动打开申请页面
     - 表单自动填写
     - 按钮自动点击
     - 提交完成

### 步骤 3：查看结果

**成功时：**
- 页面会显示成功消息
- 终端日志会显示：`[auto-apply] DSC International School 申请已成功提交！`

**失败时：**
- 查看终端日志中的错误信息
- 查看截图：`tmp/auto-apply/` 目录
- 查看HTML转储：`tmp/auto-apply/` 目录

---

## 📝 脚本功能说明

### 主要功能

1. **自动打开申请页面**
   - URL: https://www.dsc.edu.hk/admissions/applynow
   - 等待页面完全加载（包括 Finalsite CMS 的动态内容）

2. **自动填写表单**
   - 系统会自动匹配字段（通过标签、占位符等）
   - 如果自动匹配失败，可以手动添加字段映射（见下方"字段映射"部分）

3. **自动提交表单**
   - 尝试多种方式找到提交按钮
   - 支持多种按钮文本（Submit、Apply、提交、确认等）

4. **验证提交结果**
   - 检查页面是否包含成功消息
   - 检查URL是否跳转到确认页面

### 字段映射

脚本默认使用自动字段匹配。如果某些字段无法自动匹配，可以取消注释并修改以下代码：

```typescript
// 在 src/modules/auto-apply/schools/dsc-international-school.ts 中
const overrides = remapTemplateFields(payload.template, {
  english_first_name: { label: "First Name" },
  english_last_name: { label: "Last Name" },
  student_email: { label: "Email" },
  student_phone: { label: "Phone" },
  home_address: { label: "Address" },
  date_of_birth: { label: "Date of Birth" },
});
const fields = overrides.length ? overrides : payload.template.fields;
await formFiller.fillFields(page, fields);
```

**如何确定字段标签：**

1. 打开申请页面：https://www.dsc.edu.hk/admissions/applynow
2. 按 F12 打开开发者工具
3. 检查表单字段的 HTML 结构
4. 查看字段的 `label`、`placeholder`、`name` 等属性
5. 根据实际标签修改映射关系

---

## ⚠️ 注意事项

### 1. 文件上传

根据 DSC International School 的申请要求，需要上传以下文件：
- 孩子的有效签证和入境标签/香港永久身份证副本
- 孩子的护照副本（如果持有其他国家护照）
- 父母的护照副本
- 孩子的出生证明副本
- 最近2年的学校报告或成绩单副本（英文）
- 出勤证明信（申请幼儿教育）
- 学生推荐表
- 一张护照尺寸照片（邮寄到招生办公室）
- 心理教育评估副本（如有）

**当前脚本暂未处理文件上传功能。** 如果需要上传文件：

1. 确保文件路径在 `payload.metadata` 中
2. 取消注释脚本中的文件上传代码
3. 根据实际页面结构调整文件上传逻辑

### 2. 物理文件

注意：一张护照尺寸照片需要**邮寄**到招生办公室，无法通过在线方式提交。

### 3. 页面加载时间

DSC 网站使用 Finalsite CMS，可能需要较长时间加载。脚本已包含额外的等待时间，但如果遇到超时，可以增加等待时间：

```typescript
await page.waitForLoadState("networkidle", { timeout: 60000 }); // 增加到60秒
```

### 4. 表单验证

某些字段可能有必填验证。确保模板数据中包含所有必填字段。

---

## 🐛 常见问题

### Q1: 脚本执行失败，提示"无法找到提交按钮"

**可能原因：**
1. 页面结构发生变化
2. 提交按钮的选择器不匹配

**解决方法：**
1. 设置 `PLAYWRIGHT_HEADLESS=false`，观察页面
2. 查看截图：`tmp/auto-apply/` 目录
3. 手动检查页面，找到提交按钮的实际选择器
4. 修改 `locateSubmitButton` 函数，添加新的选择器

### Q2: 字段无法自动匹配

**解决方法：**
1. 查看终端日志，了解哪些字段匹配失败
2. 使用浏览器开发者工具检查字段的实际标签
3. 添加字段映射（见上方"字段映射"部分）

### Q3: 页面加载超时

**解决方法：**
增加等待时间：
```typescript
await page.waitForLoadState("networkidle", { timeout: 60000 });
```

### Q4: 学校ID不匹配

**当前配置：**
- 脚本中的 `id`：`dsc-hkis-2025`
- 请确认数据库中的 `schoolId` 也是 `dsc-hkis-2025`

**如果不同，解决方法：**
1. 确认数据库中的实际 `schoolId`
2. 修改脚本文件中的 `id` 字段
3. 确保与数据库中的值完全一致

---

## 📚 相关文档

- [Playwright零基础完整指南.md](./Playwright零基础完整指南.md) - 完整的 Playwright 使用指南
- [Playwright快速上手-5分钟教程.md](./Playwright快速上手-5分钟教程.md) - 快速参考
- [Playwright脚本完整示例.md](./Playwright脚本完整示例.md) - 更多脚本示例

---

## 🔄 下一步：处理需要登录和注册的申请

完成这个简单脚本后，您可以：

1. **测试并优化当前脚本**
   - 确保基本功能正常工作
   - 处理字段映射问题
   - 添加文件上传功能（如果需要）

2. **创建需要登录的脚本**
   - 参考示例：`docs/Playwright脚本完整示例.md` - 示例 2
   - 设置 `supportsLogin: true`
   - 使用 `loginHandler.maybeLogin()` 处理登录

3. **创建需要注册的脚本**
   - 先处理注册流程
   - 然后处理登录
   - 最后处理申请提交

---

## ✅ 检查清单

使用脚本前确认：

- [ ] 数据库中存在 DSC International School 的记录（schoolId: `dsc-hkis-2025`）
- [ ] 脚本中的 `id` 与数据库中的 `schoolId` 完全一致（当前：`dsc-hkis-2025` ✅）
- [ ] 已设置 `.env.local` 文件（`PLAYWRIGHT_HEADLESS=false`）
- [ ] 已启动开发服务器（`npm run dev`）
- [ ] 已测试基本流程（打开页面、填写字段、提交）
- [ ] 已查看日志，确认没有错误

---

**祝您使用愉快！** 🎉

如有问题，请查看相关文档或检查终端日志。

