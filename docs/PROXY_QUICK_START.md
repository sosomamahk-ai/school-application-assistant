# 🚀 代理配置快速开始指南

## 最简单的方法：使用本地代理服务器

### 步骤 1：安装代理服务器依赖

```bash
npm install express http-proxy-middleware cors
```

### 步骤 2：启动代理服务器

```bash
npm run proxy:start
```

或者：

```bash
node proxy-server.js
```

您应该看到：

```
==================================================
🚀 OpenAI Proxy Server Started
==================================================
📡 Server running on http://localhost:3001
🔗 Proxy endpoint: http://localhost:3001/v1/*
💚 Health check: http://localhost:3001/health
==================================================
```

**保持这个终端窗口打开！** 代理服务器需要一直运行。

### 步骤 3：配置环境变量

在项目的 `.env` 文件中添加或修改：

```env
# 您的 OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# 本地代理服务器（如果代理服务器在同一台机器上）
OPENAI_BASE_URL=http://localhost:3001

# 或者如果代理服务器在其他机器上，使用机器的 IP 或域名
# OPENAI_BASE_URL=http://192.168.1.100:3001
# 或
# OPENAI_BASE_URL=https://your-proxy-domain.com
```

**重要提示**：
- `OPENAI_BASE_URL` **不要**包含 `/v1` 路径
- 确保代理服务器正在运行
- 如果代理服务器在不同的端口，修改端口号

### 步骤 4：测试代理配置

在**新的终端窗口**中运行：

```bash
npm run proxy:test
```

或者：

```bash
node test-proxy.js
```

如果看到 ✅ 成功消息，说明代理配置正确！

### 步骤 5：重启应用

如果应用正在运行，先停止它（Ctrl+C），然后重新启动：

```bash
npm run dev
```

### 步骤 6：测试扫描功能

现在尝试扫描模板：
1. 打开浏览器，访问模板管理页面
2. 点击"扫描识别模版"部分
3. 输入一个 URL 或上传文件
4. 点击扫描按钮

如果不再看到 `403 Country, region, or territory not supported` 错误，说明配置成功！🎉

---

## 📋 配置检查清单

在测试之前，确保：

- [ ] 代理服务器正在运行（`npm run proxy:start`）
- [ ] `.env` 文件中设置了 `OPENAI_API_KEY`
- [ ] `.env` 文件中设置了 `OPENAI_BASE_URL=http://localhost:3001`
- [ ] 测试脚本运行成功（`npm run proxy:test`）
- [ ] 应用已重启（`npm run dev`）

---

## 🔍 验证代理是否工作

### 方法 1：检查代理服务器日志

在运行代理服务器的终端窗口中，您应该看到类似这样的日志：

```
[2024-01-01T12:00:00.000Z] POST /v1/chat/completions
[Proxy] Forwarding POST /v1/chat/completions to OpenAI API
[Proxy] Response status: 200
```

如果看到这些日志，说明请求正在通过代理转发。

### 方法 2：测试健康检查端点

在浏览器中访问：

```
http://localhost:3001/health
```

应该看到：

```json
{
  "status": "ok",
  "message": "OpenAI Proxy Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 方法 3：运行测试脚本

```bash
npm run proxy:test
```

应该看到成功消息。

---

## ⚠️ 常见问题

### Q: 代理服务器无法启动

**A:** 检查端口 3001 是否被占用：

```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```

如果端口被占用，您可以：
1. 停止占用端口的程序
2. 或者修改代理服务器的端口（编辑 `proxy-server.js` 中的 `port` 变量）

### Q: 测试脚本显示连接失败

**A:** 检查：
1. 代理服务器是否正在运行
2. `OPENAI_BASE_URL` 是否正确
3. 防火墙是否阻止了连接

### Q: 仍然看到地区限制错误

**A:** 
1. 确保 `.env` 文件已正确配置
2. 确保应用已重启（环境变量只在启动时加载）
3. 检查代理服务器日志，确认请求正在转发
4. 验证代理服务器可以访问 OpenAI API（代理服务器本身需要在支持 OpenAI 的地区）

### Q: 如何更改代理端口？

**A:** 编辑 `proxy-server.js` 文件，修改：

```javascript
const port = process.env.PORT || 3001;  // 改成您想要的端口
```

然后更新 `.env` 文件中的 `OPENAI_BASE_URL`。

---

## 🌐 使用 Cloudflare Workers 代理（推荐用于生产环境）

如果您不想在本地运行代理服务器，可以使用 Cloudflare Workers（免费）。

### 步骤：

1. **访问 Cloudflare Workers**
   - 前往：https://workers.cloudflare.com/
   - 注册/登录（免费）

2. **创建 Worker**
   - 点击 "Create a Service"
   - 命名为 `openai-proxy`
   - 点击 "Create"

3. **复制以下代码到 Worker**：

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (!url.pathname.startsWith('/v1/')) {
      return new Response('Not Found', { status: 404 });
    }

    const targetUrl = `https://api.openai.com${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.set('host', 'api.openai.com');

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    return modifiedResponse;
  },
};
```

4. **保存并部署**
   - 点击 "Save and Deploy"
   - 复制 Worker URL（例如：`https://openai-proxy.your-subdomain.workers.dev`）

5. **配置环境变量**

   在 `.env` 文件中：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://openai-proxy.your-subdomain.workers.dev
```

6. **重启应用并测试**

---

## 📚 更多信息

- **详细配置指南**：查看 `docs/OPENAI_PROXY_SETUP.md`
- **故障排除**：查看 `docs/OPENAI_REGION_FIX.md`
- **问题反馈**：如果遇到问题，请检查错误日志

---

## ✅ 成功！

如果一切配置正确，您现在应该可以：
- ✅ 扫描 URL 模板
- ✅ 扫描 PDF 文件
- ✅ 扫描 DOCX 文件
- ✅ 不再看到地区限制错误

祝您使用愉快！🎉

