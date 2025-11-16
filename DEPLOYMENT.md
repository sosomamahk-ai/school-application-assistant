# 部署指南 (Deployment Guide)

本文档提供了将 School Application Assistant 部署到生产环境的详细步骤。

## 📋 准备清单

在部署之前，请确保您已准备好：

- [ ] PostgreSQL 数据库实例
- [ ] OpenAI API Key
- [ ] 域名（可选）
- [ ] 选择的托管平台账户

## 🌐 部署平台选项

### 1. Vercel（推荐）

Vercel 是 Next.js 的官方托管平台，提供最佳的开发体验。

#### 步骤：

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 导入您的 GitHub 仓库
   - 选择项目根目录

3. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：
   ```
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=sk-...
   JWT_SECRET=your-secure-random-string
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

4. **部署**
   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy"
   - 等待构建完成

5. **运行数据库迁移**
   
   首次部署后，需要运行数据库迁移：
   ```bash
   # 本地连接到生产数据库
   DATABASE_URL="your-production-db-url" npx prisma migrate deploy
   
   # 运行种子数据（可选）
   DATABASE_URL="your-production-db-url" npx ts-node prisma/seed.ts
   ```

#### 自动部署
- 推送到 `main` 分支会自动触发部署
- 每个 Pull Request 都会创建预览部署

---

### 2. Railway

Railway 提供简单的全栈应用部署，包含数据库。

#### 步骤：

1. **访问 Railway**
   - 前往 [railway.app](https://railway.app)
   - 注册/登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 授权并选择仓库

3. **添加 PostgreSQL**
   - 在项目中点击 "New"
   - 选择 "Database" → "PostgreSQL"
   - Railway 会自动设置 `DATABASE_URL`

4. **配置环境变量**
   ```
   OPENAI_API_KEY=sk-...
   JWT_SECRET=your-secure-random-string
   NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
   ```

5. **部署**
   - Railway 会自动构建和部署
   - 查看部署日志确认成功

---

### 3. AWS (EC2 + RDS)

适合需要更多控制和自定义的企业级部署。

#### 架构：
- EC2 实例运行 Next.js 应用
- RDS PostgreSQL 数据库
- S3（可选）用于静态资源
- CloudFront（可选）用于 CDN

#### 步骤概览：

1. **创建 RDS PostgreSQL 实例**
   - 选择合适的实例类型
   - 配置安全组允许 EC2 访问
   - 记录连接信息

2. **创建 EC2 实例**
   ```bash
   # 选择 Ubuntu 或 Amazon Linux
   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 安装 PM2（进程管理）
   sudo npm install -g pm2
   ```

3. **部署应用**
   ```bash
   # 克隆代码
   git clone <your-repo>
   cd school-application-assistant
   
   # 安装依赖
   npm install
   
   # 设置环境变量
   nano .env
   
   # 构建应用
   npm run build
   
   # 使用 PM2 启动
   pm2 start npm --name "school-app" -- start
   pm2 save
   pm2 startup
   ```

4. **配置 Nginx（可选，作为反向代理）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

### 4. Docker 部署

使用 Docker 容器化部署，适合任何支持 Docker 的平台。

#### Dockerfile

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/school_app
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=school_app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 部署命令

```bash
# 构建和启动
docker-compose up -d

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 查看日志
docker-compose logs -f
```

---

## 🔒 生产环境安全配置

### 1. 环境变量

确保所有敏感信息都通过环境变量配置：

```bash
# 生成强随机 JWT Secret
openssl rand -base64 32

# 在生产环境设置
JWT_SECRET=<generated-strong-secret>
DATABASE_URL=<production-database-url>
OPENAI_API_KEY=<your-api-key>
```

### 2. 数据库安全

- 使用强密码
- 限制网络访问（仅允许应用服务器）
- 启用 SSL 连接
- 定期备份

```env
# 使用 SSL 连接
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 3. CORS 配置

添加 `next.config.js` 配置：

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Accept, Authorization, Content-Type' },
        ],
      },
    ];
  },
};
```

### 4. 速率限制

安装并配置速率限制中间件：

```bash
npm install express-rate-limit
```

---

## 📊 监控和日志

### 1. Vercel Analytics
Vercel 自动提供性能分析。

### 2. Sentry（错误追踪）

```bash
npm install @sentry/nextjs
```

配置 `sentry.client.config.js`:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 3. 日志管理

生产环境建议使用结构化日志：

```bash
npm install winston
```

---

## 🔄 持续集成/持续部署 (CI/CD)

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚨 故障排除

### 常见问题

1. **构建失败**
   - 检查所有依赖是否正确安装
   - 确认 TypeScript 类型错误已修复
   - 验证环境变量是否完整

2. **数据库连接失败**
   - 验证 DATABASE_URL 格式
   - 检查数据库是否可从应用服务器访问
   - 确认数据库凭证正确

3. **OpenAI API 错误**
   - 检查 API Key 是否有效
   - 验证账户余额充足
   - 检查 API 调用频率限制

---

## 📈 性能优化

1. **启用 Next.js 图片优化**
2. **使用 CDN 分发静态资源**
3. **实现 Redis 缓存**（可选）
4. **数据库查询优化**
5. **启用 Gzip 压缩**

---

## 🎯 部署后检查清单

- [ ] 所有页面正常加载
- [ ] 用户注册/登录功能正常
- [ ] 数据库连接正常
- [ ] AI 功能可用
- [ ] 表单提交成功
- [ ] 邮件通知正常（如果配置）
- [ ] SSL 证书有效
- [ ] 监控和日志配置正确
- [ ] 备份策略已实施

---

**部署成功后，记得定期更新依赖和监控应用性能！**

