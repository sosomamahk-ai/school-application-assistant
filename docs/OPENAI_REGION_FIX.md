# OpenAI API 地区限制解决方案

## 问题描述

如果遇到以下错误：
```
403 Country, region, or territory not supported
```

这意味着您的国家/地区不支持直接访问 OpenAI API。

## 解决方案

### 方案 1：使用代理服务（推荐）

使用支持 OpenAI API 的代理服务来绕过地区限制。

#### 步骤：

1. **选择代理服务**
   - 选择一个支持 OpenAI API 的代理服务提供商
   - 常见选项：Cloudflare Workers、Vercel Edge Functions、自建代理

2. **配置环境变量**

   在 `.env` 文件中添加：
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   OPENAI_BASE_URL=https://your-proxy-url.com/v1
   ```

   或者：
   ```env
   OPENAI_PROXY_URL=https://your-proxy-url.com/v1
   ```

3. **代理服务示例（Cloudflare Workers）**

   创建一个 Cloudflare Worker，代码如下：

   ```javascript
   export default {
     async fetch(request) {
       // 只允许 POST 请求
       if (request.method !== 'POST') {
         return new Response('Method not allowed', { status: 405 });
       }

       // 转发到 OpenAI API
       const url = new URL(request.url);
       url.hostname = 'api.openai.com';
       url.protocol = 'https:';

       const modifiedRequest = new Request(url.toString(), {
         method: request.method,
         headers: request.headers,
         body: request.body,
       });

       return fetch(modifiedRequest);
     },
   };
   ```

4. **测试配置**

   重启应用后，错误消息应该会改变，如果代理配置正确，应该可以正常工作。

### 方案 2：使用 Azure OpenAI Service

如果您的地区支持 Azure OpenAI，可以使用 Azure OpenAI 替代：

1. **在 Azure 上创建 OpenAI 资源**
2. **配置环境变量**：
   ```env
   OPENAI_API_KEY=your-azure-openai-key
   OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
   ```

### 方案 3：使用 VPN

如果只是临时使用，可以使用 VPN 连接到支持 OpenAI 的地区：

1. 连接到支持 OpenAI 的 VPN（如美国、欧洲等）
2. 重启应用
3. 确保 VPN 在服务端运行（如果在服务器上部署）

### 方案 4：使用自建代理服务器

如果您有自己的服务器，可以自建代理：

#### 使用 Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name your-proxy-domain.com;

    location /v1/ {
        proxy_pass https://api.openai.com/v1/;
        proxy_set_header Host api.openai.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
        
        # 添加 CORS 头（如果需要）
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type';
    }
}
```

然后在 `.env` 中配置：
```env
OPENAI_BASE_URL=https://your-proxy-domain.com
```

## 验证配置

配置完成后，重启应用并测试扫描功能。如果配置正确，应该可以正常工作。

如果仍有问题，检查：
1. 代理 URL 是否正确
2. 代理服务是否正常运行
3. API Key 是否有效
4. 网络连接是否正常

## 常见问题

### Q: 如何检查代理是否工作？

A: 可以尝试直接访问代理 URL，或者在应用日志中查看错误信息。

### Q: 使用代理安全吗？

A: 使用代理会经过第三方服务，确保选择可信的代理提供商，或者自建代理。

### Q: 代理会影响性能吗？

A: 可能会有轻微的延迟，但通常可以接受。

## 相关链接

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Cloudflare Workers](https://workers.cloudflare.com/)

