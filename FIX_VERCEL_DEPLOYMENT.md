# 修复 Vercel 部署问题 - GitHub 推送未触发部署

## 问题诊断

**问题：** GitHub 推送的文件在 Vercel Deployment 中看不到，只能通过环境变量变动触发重新部署。

**可能原因：**
1. Vercel 的 Git 集成未正确配置
2. Vercel 的自动部署未启用
3. Git webhook 未正确设置
4. Vercel 连接的是错误的仓库或分支

## 解决方案

### 方案 1: 检查并修复 Vercel Git 连接（推荐）

#### 步骤 1: 检查 Vercel 项目设置

1. **访问 Vercel Dashboard**
   - 前往：https://vercel.com/dashboard
   - 选择项目：`school-application-assistant`

2. **检查 Git 连接**
   - 前往 **Settings** > **Git**
   - 检查：
     - ✅ **Connected Git Repository** 是否正确
     - ✅ **Production Branch** 是否为 `master` 或 `main`
     - ✅ **Auto-deploy** 是否启用

3. **如果 Git 未连接或连接错误**
   - 点击 **Disconnect** 断开连接
   - 点击 **Connect Git Repository**
   - 选择正确的 GitHub 仓库
   - 选择正确的分支（`master` 或 `main`）
   - 确认 **Auto-deploy** 已启用

#### 步骤 2: 重新连接 Git（如果需要）

如果 Git 连接有问题：

1. **断开现有连接**
   - Settings > Git > Disconnect

2. **重新连接**
   - 点击 **Connect Git Repository**
   - 授权 GitHub 访问
   - 选择仓库：`sosomamahk-ai/school-application-assistant`
   - 选择分支：`master`
   - 确认 **Auto-deploy** 已启用

3. **触发首次部署**
   - 连接后会自动触发部署
   - 或手动点击 **Deploy** 按钮

### 方案 2: 使用 Vercel CLI 手动部署

如果 Git 集成有问题，可以使用 Vercel CLI 手动部署：

#### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2: 登录 Vercel

```bash
vercel login
```

#### 步骤 3: 链接项目

```bash
vercel link
```

这会：
- 检测当前目录的项目
- 询问是否链接到现有项目
- 选择项目：`school-application-assistant`

#### 步骤 4: 部署到生产环境

```bash
vercel --prod
```

这会：
- 构建项目
- 部署到生产环境
- 包含所有最新的代码更改

### 方案 3: 检查并修复 Git Webhook

如果 Git 连接正常但推送不触发部署：

#### 步骤 1: 检查 GitHub Webhook

1. **访问 GitHub 仓库**
   - 前往：https://github.com/sosomamahk-ai/school-application-assistant
   - 点击 **Settings** > **Webhooks**

2. **检查 Vercel Webhook**
   - 应该有一个指向 `api.vercel.com` 的 webhook
   - 检查状态是否为 **Active**
   - 检查最近的事件是否成功

3. **如果 Webhook 不存在或失败**
   - 在 Vercel Dashboard 中重新连接 Git
   - 这会自动创建/更新 webhook

#### 步骤 2: 手动触发 Webhook（测试）

如果需要测试 webhook：

1. 在 GitHub 仓库中创建一个新的 commit
2. 推送到 `master` 分支
3. 检查 Vercel Dashboard 是否自动触发部署

### 方案 4: 使用 GitHub Actions 部署（备选）

如果 Vercel 的 Git 集成持续有问题，可以使用 GitHub Actions：

#### 创建 `.github/workflows/deploy-vercel.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 配置 GitHub Secrets

在 GitHub 仓库 Settings > Secrets 中添加：
- `VERCEL_TOKEN` - 从 Vercel Dashboard > Settings > Tokens 获取
- `VERCEL_ORG_ID` - 从 Vercel Dashboard > Settings > General 获取
- `VERCEL_PROJECT_ID` - 从 `.vercel/project.json` 或 Vercel Dashboard 获取

## 快速修复步骤（推荐）

### 最简单的方法：使用 Vercel CLI

```bash
# 1. 安装 Vercel CLI（如果还没有）
npm install -g vercel

# 2. 登录
vercel login

# 3. 链接项目
vercel link

# 4. 部署到生产环境
vercel --prod
```

这会立即部署所有最新代码，不依赖 Git 集成。

### 或者：修复 Git 连接

1. **Vercel Dashboard** > **Settings** > **Git**
2. 检查连接是否正确
3. 如果不对，断开并重新连接
4. 确认 **Auto-deploy** 已启用
5. 推送一个测试 commit 触发部署

## 验证部署

部署完成后：

1. **检查 Vercel Dashboard**
   - 查看 **Deployments** 标签
   - 确认新部署包含最新代码

2. **检查构建日志**
   - 点击部署查看构建日志
   - 确认 API 路由已编译：
     ```
     ƒ /api/cron/wordpress-sync
     ```

3. **测试 API**
   ```powershell
   .\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
   ```

## 预防措施

### 确保 Git 集成正常工作

1. **定期检查 Vercel Git 连接**
2. **监控部署状态**
3. **使用 Vercel CLI 作为备选方案**

### 设置部署通知

在 Vercel Dashboard > Settings > Notifications 中：
- 启用部署成功/失败通知
- 这样能及时发现部署问题

## 下一步

1. ✅ 检查 Vercel Git 连接配置
2. ✅ 使用 Vercel CLI 手动部署（最快）
3. ✅ 或修复 Git 连接后重新推送
4. ✅ 验证部署包含最新代码
5. ✅ 测试 API

