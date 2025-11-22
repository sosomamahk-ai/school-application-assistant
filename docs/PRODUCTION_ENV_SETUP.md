# 🚀 生产环境环境变量配置指南

## ⚠️ 问题诊断

如果生产环境出现 `OpenAI API key not configured` 错误，说明环境变量在生产环境中未正确设置。

## ✅ 解决方案

### 对于 Vercel 部署

1. **登录 Vercel Dashboard**
   - 访问 [vercel.com](https://vercel.com)
   - 选择您的项目

2. **添加环境变量**
   - 点击项目设置 → **Settings** → **Environment Variables**
   - 添加以下环境变量：

   | 变量名 | 值 | 环境 |
   |--------|-----|------|
   | `OPENAI_API_KEY` | `sk-proj-...` | ✅ Production<br>✅ Preview<br>✅ Development |
   | `OPENAI_BASE_URL` | `https://openai-proxy.sosomamahk.workers.dev` | ✅ Production<br>✅ Preview<br>✅ Development |
   | `DATABASE_URL` | `postgresql://...` | ✅ Production<br>✅ Preview |
   | `JWT_SECRET` | `your-secret` | ✅ Production<br>✅ Preview<br>✅ Development |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | ✅ Production<br>✅ Preview |

3. **重新部署**
   - 添加环境变量后，点击 **Deployments**
   - 找到最新的部署，点击 **...** → **Redeploy**
   - 等待部署完成（2-3 分钟）

4. **验证环境变量**
   - 部署完成后，访问您的应用
   - 尝试扫描功能
   - 如果仍然报错，查看 Vercel 日志

### 对于其他平台

#### Railway

1. **在项目设置中添加环境变量**
   - 选择项目 → **Variables**
   - 添加所需的环境变量

2. **重新部署**

#### Docker/自托管

1. **在 `.env` 文件中配置**
   ```env
   OPENAI_API_KEY=sk-proj-...
   OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. **确保环境变量在容器中可用**
   ```bash
   docker run -e OPENAI_API_KEY=sk-proj-... your-image
   ```

## 🔍 验证环境变量

### 方法 1: 检查应用日志

在生产环境的应用日志中，应该看到：

```
[OpenAI Config] Initializing OpenAI client...
[OpenAI Config] API Key: sk-proj-...
[OpenAI Config] Base URL: https://openai-proxy.sosomamahk.workers.dev
[OpenAI Config] Has valid API key: true
[OpenAI Config] OpenAI client initialized successfully
```

如果没有看到这些日志，说明环境变量未正确加载。

### 方法 2: 使用 API 端点检查（开发中）

可以创建一个调试端点来检查环境变量状态：

```typescript
// src/pages/api/debug/env.ts
export default async function handler(req, res) {
  // Only in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  res.json({
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    baseURL: process.env.OPENAI_BASE_URL || 'not set',
    nodeEnv: process.env.NODE_ENV,
  });
}
```

## 📝 常见问题

### Q: 为什么环境变量设置后仍然报错？

**A: 必须重新部署应用才能加载新的环境变量。**

- Vercel：添加环境变量后，点击 "Redeploy"
- Docker：重启容器
- 自托管：重启应用服务

### Q: 如何确认环境变量已加载？

**A: 查看应用启动日志，应该看到 `[OpenAI Config]` 相关的日志。**

如果没有看到，说明：
1. 环境变量未设置
2. 环境变量名称不正确
3. 应用未重启

### Q: 生产环境可以访问，但功能不工作？

**A: 可能是环境变量未设置或格式不正确。**

检查：
1. 环境变量名称是否正确（大小写敏感）
2. 环境变量值是否正确（没有多余的空格或引号）
3. 是否选择了正确的环境（Production/Preview/Development）

## 🚨 重要提示

### ⚠️ 安全注意事项

1. **不要将 API Key 提交到 Git**
   - `.env` 文件应在 `.gitignore` 中
   - 使用平台的环境变量功能

2. **不要在前端代码中暴露 API Key**
   - API Key 只应在服务器端使用
   - 使用 `NEXT_PUBLIC_` 前缀的变量会在前端暴露

3. **定期轮换 API Key**
   - 如果怀疑泄露，立即生成新的 API Key
   - 更新环境变量并重新部署

## ✅ 验证清单

在部署到生产环境之前，确保：

- [ ] `OPENAI_API_KEY` 已设置（Production 环境）
- [ ] `OPENAI_BASE_URL` 已设置（如果需要代理）
- [ ] `DATABASE_URL` 已设置（Production 环境）
- [ ] `JWT_SECRET` 已设置（Production 环境）
- [ ] `NEXT_PUBLIC_APP_URL` 已设置（Production 环境）
- [ ] 应用已重新部署
- [ ] 查看启动日志确认环境变量已加载
- [ ] 测试扫描功能确认一切正常

---

祝您部署顺利！🎉

