# 🚀 快速修复连接错误

## ✅ 重要提示

**浏览器可以访问 Worker**，说明：
- ✅ Worker 已成功部署
- ✅ Worker 正常工作
- ✅ 配置正确

**本地测试失败（DNS 解析失败）**，可能是：
- ⚠️ 本地 DNS 问题
- ⚠️ Node.js 网络配置问题

**但应用在生产环境中可能仍然可用！**

## 🎯 立即解决方案

### 步骤 1：确认配置已正确

运行配置更新脚本：

```bash
npm run update:openai-config
```

确保输出显示：
```
OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
OPENAI_API_KEY=sk-proj-...
```

### 步骤 2：重启应用（最重要！）

**环境变量只在应用启动时加载，必须重启应用！**

1. **停止当前应用**（如果正在运行）：
   - 按 `Ctrl+C` 停止

2. **重新启动应用**：
   ```bash
   npm run dev
   ```

3. **等待应用完全启动**

### 步骤 3：测试扫描功能

1. 打开浏览器，访问模板管理页面
2. 点击"扫描识别模版"部分
3. 输入 URL：`https://www.dsc.edu.hk/admissions/applynow`
4. 点击扫描按钮

**如果不再看到连接错误，说明一切正常！**

## 🔍 如果仍然报错

### 检查应用日志

查看应用启动日志，应该看到：

```
[OpenAI Config] Initializing OpenAI client...
[OpenAI Config] API Key: sk-proj-...
[OpenAI Config] Base URL: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Using proxy: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Requests will go to: https://openai-proxy.sosomamahk.workers.dev/v1/*
[OpenAI Config] OpenAI client initialized successfully
```

如果没有看到这些日志，说明应用未重启或环境变量未加载。

### 查看扫描时的日志

当您尝试扫描时，应该看到：

```
[Template Scan API] Content extraction completed. Generating template with LLM...
[LLM Template] Starting template generation from url. Content length: ...
[LLM Template] Sending request to OpenAI (model: gpt-4o-mini)...
[LLM Template] Request URL: https://openai-proxy.sosomamahk.workers.dev/v1/chat/completions
[LLM Template] Base URL: https://openai-proxy.sosomamahk.workers.dev
```

如果看到这些日志，说明配置正确，正在尝试连接。

如果仍然看到连接错误，可能是：
1. 应用未重启（环境变量未加载）
2. Worker 无法从服务器端访问（但浏览器可以访问）
3. 网络配置问题

## 💡 重要提示

### 本地测试失败 ≠ 应用无法工作

- ✅ Worker 已部署（浏览器可以访问）
- ✅ 配置正确（环境变量已设置）
- ⚠️ 本地 DNS 解析失败（可能是本地网络问题）

**即使本地测试失败，应用在生产环境中可能仍然可用！**

### 应用未重启 = 配置未加载

**最重要**：环境变量只在应用启动时加载。如果修改了 `.env` 文件，必须重启应用！

```bash
# 停止应用（Ctrl+C）
npm run dev
```

## ✅ 验证清单

在尝试扫描之前：

- [x] Worker 已部署（浏览器测试通过 ✅）
- [x] 环境变量已配置（OPENAI_BASE_URL 已设置 ✅）
- [x] DNS 缓存已刷新（已完成 ✅）
- [ ] 应用已重启（**最重要**！）
- [ ] 查看应用启动日志确认配置已加载

## 🚀 下一步

1. **停止当前应用**（如果正在运行）
2. **重新启动应用**（`npm run dev`）
3. **查看启动日志**确认配置已加载
4. **测试扫描功能**

如果应用已重启但仍然报错，请查看应用日志中的详细错误信息。

---

祝您使用愉快！🎉

