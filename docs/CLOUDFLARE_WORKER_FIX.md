# Cloudflare Workers 代理连接问题修复指南

## 🔍 问题诊断

如果您遇到 "Connection error" 错误，可能是以下几个原因：

1. Cloudflare Workers 代码有问题
2. 代理 URL 配置不正确
3. 请求头没有正确转发
4. CORS 或网络问题

## ✅ 修复后的 Cloudflare Workers 代码

请使用以下**改进后的代码**替换您的 Cloudflare Worker：

```javascript
export default {
  async fetch(request, env) {
    // 处理 OPTIONS 预检请求（CORS）
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    
    // 只处理 /v1/* 路径
    if (!url.pathname.startsWith('/v1/')) {
      return new Response(JSON.stringify({ 
        error: 'Not Found',
        message: 'This proxy only handles /v1/* paths' 
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 构建 OpenAI API URL
    const targetUrl = `https://api.openai.com${url.pathname}${url.search}`;

    // 复制请求头
    const headers = new Headers();
    
    // 转发所有原始请求头，除了 host
    for (const [key, value] of request.headers.entries()) {
      if (key.toLowerCase() !== 'host' && 
          key.toLowerCase() !== 'cf-ray' &&
          key.toLowerCase() !== 'cf-connecting-ip') {
        headers.set(key, value);
      }
    }
    
    // 设置正确的 Host 头
    headers.set('Host', 'api.openai.com');
    
    // 确保 Content-Type 存在（如果需要）
    if (request.method === 'POST' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      // 创建请求到 OpenAI
      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
      });

      // 转发请求到 OpenAI，设置超时
      const response = await fetch(modifiedRequest, {
        cf: {
          timeout: 120, // 120 秒超时
        },
      });

      // 获取响应体
      const responseBody = await response.text();
      
      // 创建响应，添加 CORS 头
      const modifiedResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        },
      });

      return modifiedResponse;
    } catch (error) {
      // 错误处理
      console.error('Proxy error:', error);
      
      return new Response(JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        details: error.stack,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
```

## 🔧 部署步骤

### 1. 更新 Cloudflare Worker 代码

1. 访问 Cloudflare Workers 控制台：https://workers.cloudflare.com/
2. 选择您的 Worker（例如：`openai-proxy`）
3. 将上面的代码**完全替换**现有代码
4. 点击 **"Save and Deploy"**（保存并部署）

### 2. 验证 Worker 是否工作

在浏览器中访问您的 Worker URL（例如：`https://openai-proxy.your-subdomain.workers.dev/v1/models`）

如果看到 JSON 响应或错误消息，说明 Worker 正在运行。

### 3. 检查环境变量配置

在项目的 `.env` 文件中，确保配置正确：

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Cloudflare Workers 代理 URL（不要包含 /v1）
OPENAI_BASE_URL=https://openai-proxy.your-subdomain.workers.dev
```

**重要提示**：
- URL 应该以 `https://` 开头
- **不要**包含 `/v1` 路径
- 确保 Worker URL 是正确的

### 4. 测试代理连接

使用测试脚本测试代理：

```bash
npm run proxy:test
```

或者在终端中运行：

```bash
node test-proxy.js
```

### 5. 检查日志

1. 在 Cloudflare Workers 控制台中，查看 Worker 的日志
2. 在应用日志中，查看详细的错误信息

## 🔍 常见问题排查

### Q1: 仍然看到 "Connection error"

**检查清单**：

1. ✅ Worker 代码是否已更新并部署？
2. ✅ Worker URL 是否正确？
3. ✅ `OPENAI_BASE_URL` 环境变量是否正确配置？
4. ✅ 应用是否已重启（环境变量只在启动时加载）？

**调试步骤**：

1. **测试 Worker 是否可访问**：
   ```bash
   curl https://openai-proxy.your-subdomain.workers.dev/v1/models \
     -H "Authorization: Bearer sk-your-api-key"
   ```

2. **检查 Worker 日志**：
   - 在 Cloudflare Workers 控制台中查看日志
   - 查找错误消息

3. **验证环境变量**：
   ```bash
   # Windows PowerShell
   $env:OPENAI_BASE_URL
   
   # Mac/Linux
   echo $OPENAI_BASE_URL
   ```

4. **重启应用**：
   ```bash
   # 停止应用（Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

### Q2: Worker 返回 404 错误

**原因**：请求路径不正确

**解决**：确保：
- `OPENAI_BASE_URL` **不包含** `/v1`
- Worker 代码正确处理 `/v1/*` 路径
- 客户端代码会自动添加 `/v1` 路径

### Q3: Worker 返回 401 错误

**原因**：Authorization 头没有正确转发

**解决**：检查 Worker 代码是否包含：
```javascript
// 确保转发 Authorization 头
for (const [key, value] of request.headers.entries()) {
  if (key.toLowerCase() !== 'host') {
    headers.set(key, value);
  }
}
```

### Q4: Worker 超时

**原因**：请求时间过长

**解决**：在 Worker 代码中添加超时设置：
```javascript
const response = await fetch(modifiedRequest, {
  cf: {
    timeout: 120, // 增加超时时间
  },
});
```

## 📝 快速测试 Worker

创建一个简单的测试脚本来验证 Worker：

```javascript
// test-worker.js
const OPENAI_BASE_URL = 'https://openai-proxy.your-subdomain.workers.dev';
const OPENAI_API_KEY = 'sk-your-api-key';

async function testWorker() {
  try {
    console.log('Testing Cloudflare Worker...');
    console.log('URL:', `${OPENAI_BASE_URL}/v1/models`);
    
    const response = await fetch(`${OPENAI_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text.substring(0, 200));
    
    if (response.ok) {
      console.log('✅ Worker is working correctly!');
    } else {
      console.log('❌ Worker returned error status');
    }
  } catch (error) {
    console.error('❌ Error testing worker:', error.message);
  }
}

testWorker();
```

运行测试：
```bash
node test-worker.js
```

## 🔗 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [测试脚本](test-proxy.js)

## 💡 提示

如果仍然遇到问题，请检查：

1. Cloudflare Workers 日志中的错误消息
2. 应用日志中的详细错误信息
3. 网络连接是否正常
4. API Key 是否有效

如果问题仍然存在，请提供以下信息以便进一步诊断：

- Worker 日志
- 应用错误日志
- `OPENAI_BASE_URL` 配置
- Worker URL

祝您使用愉快！🎉

