# 🔧 修复环境变量和启动问题

## ✅ 已完成的修复

1. **改进了 OpenAI API Key 验证**：
   - 添加了更严格的验证逻辑
   - 检查 API Key 是否存在、不是 mock 值、且长度大于 0
   - 添加了详细的日志记录

2. **修复了变量使用顺序**：
   - 确保 `hasValidApiKey` 在定义后才使用

3. **清理了端口占用**：
   - 停止了占用端口 3000 的进程

## 🔍 问题诊断

### 问题 1: `npm run dev` 卡住

**可能原因**：
- 端口被占用
- 编译错误
- 依赖问题

**解决方案**：
1. 停止所有 Node.js 进程
2. 检查端口占用
3. 重新启动应用

### 问题 2: OpenAI API Key 未配置

**错误信息**：
```
Failed to generate template using AI: OpenAI API key not configured. 
Please set OPENAI_API_KEY environment variable.
```

**可能原因**：
1. `.env` 文件格式不正确（值被引号包围）
2. 应用未重启，环境变量未加载
3. 环境变量名称不正确

**解决方案**：
1. 检查 `.env` 文件格式
2. 确保环境变量格式正确（不要用引号包围值，或者确保引号被正确处理）
3. 重启应用

## 📝 .env 文件格式

### ✅ 正确格式

```env
# 不带引号（推荐）
OPENAI_API_KEY=sk-proj-abc123...

# 或者带引号（如果值中包含特殊字符）
OPENAI_API_KEY="sk-proj-abc123..."

# 代理配置
OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
```

### ❌ 错误格式

```env
# 引号不一致
OPENAI_API_KEY='sk-proj-abc123...'

# 多余的空格
OPENAI_API_KEY = sk-proj-abc123...

# 多行（不允许）
OPENAI_API_KEY=sk-proj-abc123
...继续
```

## 🚀 启动步骤

### 1. 检查 .env 文件

```bash
# 查看 OPENAI 相关配置
Get-Content .env | Select-String -Pattern "OPENAI"
```

应该看到：
```
OPENAI_API_KEY=sk-proj-...
OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
```

### 2. 停止所有 Node.js 进程

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### 3. 检查端口占用

```powershell
netstat -ano | findstr :3000
```

如果端口被占用，停止占用端口的进程。

### 4. 启动应用

```bash
npm run dev
```

### 5. 查看启动日志

应用启动时，应该看到：

```
[OpenAI Config] Initializing OpenAI client...
[OpenAI Config] API Key: sk-proj-...
[OpenAI Config] Base URL: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Using proxy: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Requests will go to: https://openai-proxy.sosomamahk.workers.dev/v1/*
[OpenAI Config] Raw OPENAI_API_KEY from env: SET (xxx chars)
[OpenAI Config] Has valid API key: true
[OpenAI Config] OpenAI client initialized successfully
[OpenAI Config] Proxy configured: https://openai-proxy.sosomamahk.workers.dev
```

## 🔍 验证配置

### 方法 1: 查看应用日志

启动应用后，查看终端日志，确认 OpenAI 配置已加载。

### 方法 2: 测试扫描功能

1. 访问 `http://localhost:3000/admin/templates`
2. 尝试扫描一个模板（URL 或文件）
3. 如果扫描成功，说明配置正确

### 方法 3: 运行测试脚本

```bash
npm run test:openai
```

## 💡 常见问题

### Q: 为什么修改了 .env 文件后仍然报错？

A: **必须重启应用才能加载新的环境变量**。环境变量只在应用启动时加载。

### Q: 如何确认环境变量已加载？

A: 查看应用启动日志，应该看到 `[OpenAI Config]` 相关的日志。如果没有看到，说明：
1. 环境变量未正确设置
2. 应用未重启
3. 日志级别设置问题

### Q: 为什么应用启动后看不到 OpenAI 配置日志？

A: 因为 Next.js 使用懒编译，API 路由只在首次使用时编译。尝试：
1. 访问模板管理页面
2. 或者尝试扫描一个模板

这样会触发 API 路由编译，日志就会显示。

## ✅ 完成检查清单

- [ ] `.env` 文件存在且格式正确
- [ ] `OPENAI_API_KEY` 已设置且不是 mock 值
- [ ] `OPENAI_BASE_URL` 已设置（如果使用代理）
- [ ] 所有 Node.js 进程已停止
- [ ] 端口 3000 未被占用
- [ ] 应用已重新启动
- [ ] 启动日志显示 OpenAI 配置已加载
- [ ] 扫描功能可以正常工作

---

祝您使用愉快！🎉

