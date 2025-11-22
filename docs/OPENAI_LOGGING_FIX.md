# 🔍 OpenAI 配置日志说明

## ✅ 已完成

1. **移除了日志限制**：现在在服务器端总是会输出 OpenAI 配置日志
2. **添加了直接导入**：在扫描 API 中添加了对 `@/lib/openai` 的直接导入

## 📝 日志何时显示

### 方法 1：首次编译 API 路由时

当 Next.js 首次编译 `/api/template/scan` 路由时，会加载 `src/lib/openai.ts` 并显示日志。

**触发方式**：
- 访问模板管理页面：`http://localhost:3000/admin/templates`
- 或者直接访问 API 路由（会触发编译）

### 方法 2：首次调用扫描 API 时

当首次调用 `/api/template/scan` 时，会加载并初始化 OpenAI 配置。

**触发方式**：
- 尝试扫描一个模板（URL 或文件）
- 这会触发 API 路由编译并显示配置日志

## 🔍 如何查看日志

### 查看启动时的日志

应用启动后，当访问 `/admin/templates` 页面时，Next.js 会编译相关的 API 路由。此时应该看到：

```
[OpenAI Config] Initializing OpenAI client...
[OpenAI Config] API Key: sk-proj-...
[OpenAI Config] Base URL: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Using proxy: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Requests will go to: https://openai-proxy.sosomamahk.workers.dev/v1/*
[OpenAI Config] OpenAI client initialized successfully
[OpenAI Config] Proxy configured: https://openai-proxy.sosomamahk.workers.dev
```

### 查看扫描时的日志

当您尝试扫描模板时，会看到更详细的日志：

```
[Template Scan API] Request received. Method: POST
[Template Scan API] Authenticating user...
[Template Scan API] User authenticated: ...
[LLM Template] Starting template generation from url. Content length: ...
[LLM Template] Sending request to OpenAI (model: gpt-4o-mini)...
[LLM Template] Request URL: https://openai-proxy.sosomamahk.workers.dev/v1/chat/completions
[LLM Template] Base URL: https://openai-proxy.sosomamahk.workers.dev
```

## 🚀 立即查看日志

### 步骤 1：确保应用正在运行

```bash
npm run dev
```

### 步骤 2：访问模板管理页面

在浏览器中访问：`http://localhost:3000/admin/templates`

这会在终端中触发 API 路由编译，应该看到 OpenAI 配置日志。

### 步骤 3：尝试扫描模板

1. 在模板管理页面，找到"扫描识别模版"部分
2. 输入一个 URL（例如：`https://www.dsc.edu.hk/admissions/applynow`）
3. 点击扫描按钮

这会在终端中显示详细的日志，包括 OpenAI 配置和请求详情。

## 💡 提示

### 如果仍然看不到日志

1. **检查应用是否重启**：如果修改了 `.env` 文件，必须重启应用
2. **检查日志位置**：日志应该显示在运行 `npm run dev` 的终端窗口中
3. **检查 API 路由是否被编译**：尝试直接访问 API 路由触发编译
4. **查看浏览器控制台**：某些日志可能显示在浏览器控制台中（但 OpenAI 配置日志应该在服务器端）

### 验证配置是否已加载

即使看不到启动日志，您也可以：
1. 尝试扫描一个模板
2. 如果扫描成功，说明配置已正确加载
3. 如果扫描失败，查看错误日志中的详细错误信息

## ✅ 验证配置

### 快速测试

运行测试脚本：

```bash
npm run test:openai
```

这会直接测试 OpenAI 客户端的配置和连接，并显示详细的日志。

---

祝您使用愉快！🎉

