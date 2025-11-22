/**
 * OpenAI API 代理服务器
 * 
 * 使用方法：
 * 1. 安装依赖：npm install express http-proxy-middleware cors
 * 2. 启动服务器：node proxy-server.js
 * 3. 配置环境变量：OPENAI_BASE_URL=http://localhost:3001
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// 启用 CORS
app.use(cors());

// 日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 创建代理中间件
const proxyMiddleware = createProxyMiddleware({
  target: 'https://api.openai.com',
  changeOrigin: true,
  pathRewrite: {
    '^/v1': '/v1', // 保持路径不变
  },
  onProxyReq: (proxyReq, req, res) => {
    // 记录代理请求
    console.log(`[Proxy] Forwarding ${req.method} ${req.url} to OpenAI API`);
    
    // 确保 Authorization 头被正确转发
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
      console.log('[Proxy] Authorization header forwarded');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // 添加 CORS 头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    
    console.log(`[Proxy] Response status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: err.message,
      details: err.stack 
    });
  },
  logLevel: 'debug',
});

// 代理所有 /v1/* 请求
app.use('/v1', proxyMiddleware);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'OpenAI Proxy Server is running',
    timestamp: new Date().toISOString()
  });
});

// 根路径信息
app.get('/', (req, res) => {
  res.json({
    service: 'OpenAI API Proxy',
    version: '1.0.0',
    endpoints: {
      proxy: '/v1/*',
      health: '/health'
    },
    usage: 'Set OPENAI_BASE_URL=http://localhost:3001 in your .env file'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

app.listen(port, () => {
  console.log('='.repeat(50));
  console.log('🚀 OpenAI Proxy Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on http://localhost:${port}`);
  console.log(`🔗 Proxy endpoint: http://localhost:${port}/v1/*`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log('='.repeat(50));
  console.log('\n📝 Next steps:');
  console.log('1. Set OPENAI_BASE_URL=http://localhost:3001 in your .env file');
  console.log('2. Restart your application');
  console.log('3. Test the proxy connection');
  console.log('\n');
});

