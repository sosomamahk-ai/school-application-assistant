# OpenAI API 代理配置详细指南

## 📋 目录

1. [快速配置（推荐方案）](#快速配置推荐方案)
2. [使用现有代理服务](#使用现有代理服务)
3. [自建代理服务器](#自建代理服务器)
4. [验证配置](#验证配置)
5. [常见问题](#常见问题)

---

## 🚀 快速配置（推荐方案）

### 方案 A：使用免费的 Cloudflare Workers 代理（推荐）

这是最简单且免费的方法。

#### 步骤 1：创建 Cloudflare Workers

1. **注册/登录 Cloudflare**
   - 访问：https://workers.cloudflare.com/
   - 注册或登录账户（免费）

2. **创建新的 Worker**
   - 点击 "Create a Service"
   - 命名（例如：`openai-proxy`）
   - 点击 "Create"

3. **复制以下代码到 Worker**

   ```javascript
   export default {
     async fetch(request, env) {
       // 只允许 POST 请求到 /v1/*
       const url = new URL(request.url);
       
       if (!url.pathname.startsWith('/v1/')) {
         return new Response('Not Found', { status: 404 });
       }

       // 构建 OpenAI API URL
       const targetUrl = `https://api.openai.com${url.pathname}${url.search}`;

       // 复制请求头，移除 Host 头
       const headers = new Headers(request.headers);
       headers.delete('host');
       headers.set('host', 'api.openai.com');

       // 创建新的请求
       const modifiedRequest = new Request(targetUrl, {
         method: request.method,
         headers: headers,
         body: request.body,
       });

       // 转发请求到 OpenAI
       const response = await fetch(modifiedRequest);
      
       // 创建响应，添加 CORS 头（如果需要）
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
   - 记住您的 Worker URL（例如：`https://openai-proxy.your-subdomain.workers.dev`）

#### 步骤 2：配置环境变量

在项目的 `.env` 文件中添加：

```env
# OpenAI API Key（您的实际 API Key）
OPENAI_API_KEY=sk-your-actual-api-key-here

# Cloudflare Workers 代理 URL（使用您刚才创建的 Worker URL）
OPENAI_BASE_URL=https://openai-proxy.your-subdomain.workers.dev
```

**重要提示**：
- 将 `your-subdomain` 替换为您的 Cloudflare 子域名
- 确保 URL 以 `https://` 开头，**不要**包含 `/v1` 路径

#### 步骤 3：重启应用

```bash
# 如果正在运行，先停止
# 然后重新启动
npm run dev
```

---

### 方案 B：使用自建的简单代理服务器

如果您有自己的服务器，可以快速搭建一个代理。

#### 方法 1：使用 Node.js + Express（推荐）

1. **创建代理服务器文件**

   创建文件 `proxy-server.js`：

   ```javascript
   const express = require('express');
   const { createProxyMiddleware } = require('http-proxy-middleware');
   const cors = require('cors');

   const app = express();
   const port = process.env.PORT || 3001;

   // 启用 CORS
   app.use(cors());

   // 创建代理中间件
   const proxyMiddleware = createProxyMiddleware({
     target: 'https://api.openai.com',
     changeOrigin: true,
     pathRewrite: {
       '^/v1': '/v1', // 保持路径不变
     },
     onProxyReq: (proxyReq, req, res) => {
       // 转发所有请求头
       console.log(`Proxying ${req.method} ${req.url} to OpenAI`);
     },
     onProxyRes: (proxyRes, req, res) => {
       // 添加 CORS 头
       proxyRes.headers['Access-Control-Allow-Origin'] = '*';
     },
     onError: (err, req, res) => {
       console.error('Proxy error:', err);
       res.status(500).json({ error: 'Proxy error', message: err.message });
     },
   });

   // 代理所有 /v1/* 请求
   app.use('/v1', proxyMiddleware);

   // 健康检查
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', message: 'OpenAI Proxy is running' });
   });

   app.listen(port, () => {
     console.log(`OpenAI Proxy Server running on http://localhost:${port}`);
     console.log(`Proxy endpoint: http://localhost:${port}/v1/*`);
   });
   ```

2. **安装依赖**

   ```bash
   npm install express http-proxy-middleware cors
   ```

3. **启动代理服务器**

   ```bash
   node proxy-server.js
   ```

4. **配置环境变量**

   在项目的 `.env` 文件中：

   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   OPENAI_BASE_URL=http://localhost:3001
   ```

   如果在远程服务器上，使用服务器 IP 或域名：

   ```env
   OPENAI_BASE_URL=https://your-proxy-domain.com
   ```

#### 方法 2：使用 Nginx 反向代理

如果您的服务器有 Nginx，可以配置反向代理：

1. **编辑 Nginx 配置**

   ```nginx
   server {
       listen 80;
       server_name your-proxy-domain.com;

       location /v1/ {
           proxy_pass https://api.openai.com/v1/;
           proxy_set_header Host api.openai.com;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # 转发 Authorization 头
           proxy_set_header Authorization $http_authorization;
           
           # 超时设置
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
           
           # CORS 头（如果需要）
           add_header Access-Control-Allow-Origin * always;
           add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
           add_header Access-Control-Allow-Headers 'Authorization, Content-Type' always;
           
           if ($request_method = 'OPTIONS') {
               return 204;
           }
       }
   }
   ```

2. **配置 SSL（可选但推荐）**

   使用 Let's Encrypt 配置 HTTPS：

   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-proxy-domain.com
   ```

3. **重启 Nginx**

   ```bash
   sudo nginx -t  # 测试配置
   sudo systemctl reload nginx
   ```

4. **配置环境变量**

   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   OPENAI_BASE_URL=https://your-proxy-domain.com
   ```

---

## 🔧 使用现有代理服务

### 方案 C：使用第三方代理服务

一些服务提供商提供 OpenAI API 代理服务，您可以直接使用：

#### 1. 查找代理服务

搜索 "OpenAI API proxy" 或 "OpenAI API 代理" 找到可用的服务。

#### 2. 配置环境变量

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://proxy-service-provider.com
```

**注意**：确保使用可信的服务提供商。

---

## ✅ 验证配置

### 方法 1：检查环境变量

确保环境变量已正确设置：

```bash
# 检查 .env 文件
cat .env | grep OPENAI

# 应该看到：
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://...
```

### 方法 2：测试代理连接

创建一个测试脚本 `test-proxy.js`：

```javascript
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

async function test() {
  try {
    console.log('Testing OpenAI API with proxy...');
    console.log('Base URL:', process.env.OPENAI_BASE_URL);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "Hello, proxy works!"' }],
      max_tokens: 10,
    });

    console.log('✅ Success! Proxy is working!');
    console.log('Response:', completion.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Country, region, or territory')) {
      console.error('⚠️  Still seeing region restriction. Check your proxy configuration.');
    }
  }
}

test();
```

运行测试：

```bash
node test-proxy.js
```

### 方法 3：在应用中测试

1. 重启应用：
   ```bash
   npm run dev
   ```

2. 访问模板扫描页面，尝试扫描一个 URL

3. 检查日志，应该不再看到地区限制错误

---

## 🔍 常见问题

### Q1: 如何检查代理是否工作？

**A:** 查看应用日志，如果看到类似这样的日志，说明正在使用代理：
```
[LLM Template] Sending request to OpenAI (model: gpt-4o-mini)...
```

如果不再看到 `403 Country, region, or territory not supported` 错误，说明代理工作正常。

### Q2: 代理 URL 应该包含 `/v1` 吗？

**A:** **不要**包含 `/v1` 在 `OPENAI_BASE_URL` 中。

正确：
```env
OPENAI_BASE_URL=https://proxy.example.com
```

错误：
```env
OPENAI_BASE_URL=https://proxy.example.com/v1  # ❌ 不要这样做
```

代码会自动添加 `/v1` 路径。

### Q3: 使用代理会影响性能吗？

**A:** 可能会有轻微的延迟（通常 < 100ms），但影响很小。Cloudflare Workers 通常很快。

### Q4: 代理安全吗？

**A:** 
- **使用自己的代理**：完全安全，API Key 只发送到您自己的服务器
- **使用 Cloudflare Workers**：相对安全，但建议使用自己的 Worker
- **使用第三方代理服务**：需要谨慎，确保服务提供商可信

### Q5: 可以在本地测试吗？

**A:** 可以！您可以：
1. 在本地运行代理服务器（使用方案 B 的方法 1）
2. 配置 `OPENAI_BASE_URL=http://localhost:3001`
3. 测试应用功能

### Q6: 如何调试代理问题？

**A:** 
1. 检查代理服务器日志
2. 使用测试脚本测试代理连接
3. 检查网络连接和防火墙设置
4. 验证环境变量是否正确加载

### Q7: 是否可以使用 VPN 代替代理？

**A:** 可以，但：
- VPN 需要在**服务器端**运行（如果应用部署在服务器上）
- 如果只是本地开发，在本地运行 VPN 也可以
- 使用代理更灵活，不影响其他网络流量

---

## 📝 配置检查清单

在尝试扫描模板之前，确保：

- [ ] `OPENAI_API_KEY` 已设置（您的实际 API Key）
- [ ] `OPENAI_BASE_URL` 已设置（代理 URL）
- [ ] 代理服务器正在运行（如果使用自建代理）
- [ ] 代理 URL 可以访问（测试连接）
- [ ] 应用已重启（加载新的环境变量）
- [ ] 测试脚本运行成功

---

## 🎯 推荐方案总结

**对于快速开始（推荐）**：
1. 使用 Cloudflare Workers（免费，快速，不需要服务器）
2. 配置 `OPENAI_BASE_URL` 环境变量
3. 重启应用

**对于生产环境**：
1. 自建代理服务器（Node.js + Express 或 Nginx）
2. 配置 SSL 证书（HTTPS）
3. 添加监控和日志

**对于本地开发**：
1. 使用本地代理服务器
2. 或直接使用 VPN

---

## 🔗 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Nginx 反向代理文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

---

## 💡 下一步

配置完成后：
1. 测试扫描功能
2. 检查日志确认代理工作正常
3. 如果还有问题，查看错误日志并对照本文档排查

祝您使用愉快！🎉

