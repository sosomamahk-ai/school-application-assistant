/**
 * Cloudflare Workers OpenAI API 代理
 * 
 * 这个 Worker 用于代理 OpenAI API 请求，解决地区限制问题
 */

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
        message: 'This proxy only handles /v1/* paths',
        hint: 'Make sure your OPENAI_BASE_URL does not include /v1'
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
    
    // 转发所有原始请求头，除了 host 和 Cloudflare 特定头
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'host' && 
          lowerKey !== 'cf-ray' &&
          lowerKey !== 'cf-connecting-ip' &&
          lowerKey !== 'cf-visitor' &&
          lowerKey !== 'cf-request-id') {
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

