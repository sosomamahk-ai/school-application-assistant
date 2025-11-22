# Cloudflare Workers 部署修复指南

## 🔍 问题诊断结果

根据自动诊断，发现 Worker 无法访问（DNS 解析失败）。这通常意味着：

1. Worker 可能未正确部署
2. Worker 域名可能不正确
3. 网络连接问题

## ✅ 完整修复步骤

### 步骤 1: 验证 Worker 是否存在

1. **访问 Cloudflare Workers 控制台**
   - 打开：https://workers.cloudflare.com/
   - 登录您的账户

2. **检查 Worker 列表**
   - 查找名为 `openai-proxy` 的 Worker
   - 如果不存在，需要创建新的 Worker

### 步骤 2: 创建或更新 Worker

#### 如果 Worker 不存在：

1. **创建新 Worker**
   - 点击 **"Create Application"** 或 **"Create Worker"**
   - 输入名称：`openai-proxy`
   - 选择模板：**"HTTP Handler"** 或 **"Hello World"**
   - 点击 **"Create"** 或 **"Deploy"**

2. **复制代码**
   - 打开项目根目录的 `cloudflare-worker-code.js` 文件
   - 复制**所有代码**（从 `export default` 开始到文件结束）

3. **粘贴代码**
   - 在 Worker 编辑器中，**删除所有现有代码**
   - 粘贴复制的代码
   - 点击 **"Save and Deploy"**

4. **获取 Worker URL**
   - 部署成功后，您会看到 Worker URL
   - 格式类似：`https://openai-proxy.your-subdomain.workers.dev`
   - **重要**：记住这个 URL，不要包含 `/v1` 路径

#### 如果 Worker 已存在：

1. **编辑现有 Worker**
   - 在 Worker 列表中点击 `openai-proxy`
   - 点击 **"Edit Code"** 或 **"Quick Edit"**

2. **更新代码**
   - 删除所有现有代码
   - 从 `cloudflare-worker-code.js` 复制新代码
   - 粘贴到编辑器
   - 点击 **"Save and Deploy"**

### 步骤 3: 验证 Worker 部署

1. **检查部署状态**
   - 在 Worker 页面，确认状态为 **"Active"** 或 **"Deployed"**

2. **测试 Worker**
   - 在浏览器中访问：`https://openai-proxy.sosomamahk.workers.dev/v1/models`
   - 应该看到 JSON 响应（可能是 401 错误，这是正常的，说明 Worker 工作正常）

3. **查看日志**
   - 在 Worker 页面，点击 **"Logs"** 或 **"View Logs"**
   - 查看是否有错误消息

### 步骤 4: 更新环境变量

在项目的 `.env` 文件中，确保配置正确：

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Cloudflare Workers 代理 URL
# 重要：不要包含 /v1 路径
OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
```

**检查清单**：
- ✅ URL 以 `https://` 开头
- ✅ URL **不包含** `/v1` 路径
- ✅ URL 以 `.workers.dev` 结尾
- ✅ API Key 正确设置

### 步骤 5: 测试配置

运行诊断脚本：

```bash
npm run diagnose:proxy
```

或者：

```bash
node scripts/diagnose-proxy.js
```

如果所有测试通过，说明配置正确。

### 步骤 6: 重启应用

**重要**：环境变量只在应用启动时加载，必须重启应用：

```bash
# 停止应用（Ctrl+C）
# 然后重新启动
npm run dev
```

## 🔧 常见问题解决

### Q1: Worker URL 无法访问

**可能原因**：
- Worker 未部署
- 域名拼写错误
- Cloudflare 账户问题

**解决方法**：
1. 确认 Worker 在 Cloudflare 控制台中显示为 "Active"
2. 检查 URL 拼写是否正确
3. 尝试在浏览器中直接访问 Worker URL

### Q2: Worker 返回 404

**可能原因**：
- 路径配置错误
- `OPENAI_BASE_URL` 包含了 `/v1`

**解决方法**：
- 确保 `OPENAI_BASE_URL` **不包含** `/v1`
- 代码会自动添加 `/v1` 路径

### Q3: Worker 返回 500 错误

**可能原因**：
- Worker 代码有错误
- OpenAI API 连接问题

**解决方法**：
1. 检查 Worker 日志
2. 确认代码已正确复制
3. 重新部署 Worker

### Q4: 仍然看到连接错误

**可能原因**：
- 应用未重启
- 环境变量未加载
- 网络问题

**解决方法**：
1. **确保应用已重启**
2. 运行 `npm run diagnose:proxy` 检查配置
3. 查看应用日志中的详细错误信息

## 📝 快速检查清单

在尝试扫描之前，确保：

- [ ] Worker 在 Cloudflare 控制台中显示为 "Active"
- [ ] Worker URL 可以访问（在浏览器中测试）
- [ ] `.env` 文件中的 `OPENAI_BASE_URL` 正确配置
- [ ] `OPENAI_BASE_URL` **不包含** `/v1` 路径
- [ ] `OPENAI_API_KEY` 已设置
- [ ] 运行 `npm run diagnose:proxy` 所有测试通过
- [ ] 应用已重启

## 🚀 快速部署命令（使用 Wrangler CLI）

如果您安装了 Wrangler CLI，可以使用命令行部署：

```bash
# 安装 Wrangler（如果还没有）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 Worker 项目（如果还没有）
wrangler init openai-proxy

# 编辑 src/index.ts，粘贴 cloudflare-worker-code.js 的代码

# 部署
wrangler deploy
```

## 💡 下一步

配置完成后：

1. 运行诊断：`npm run diagnose:proxy`
2. 如果测试通过，重启应用
3. 尝试扫描模板
4. 如果仍有问题，查看应用日志和 Worker 日志

## 🔗 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Worker 代码文件](../cloudflare-worker-code.js)
- [诊断脚本](../scripts/diagnose-proxy.js)

祝您使用愉快！🎉

