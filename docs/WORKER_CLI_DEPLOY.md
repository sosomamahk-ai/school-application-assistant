# 使用命令行部署 Cloudflare Worker

## 📋 前提条件

1. **已安装 Wrangler CLI**（已完成 ✅）
   - 版本: 4.50.0
   - 如果没有安装，运行: `npm install -g wrangler`

2. **Cloudflare 账户**
   - 如果还没有账户，访问 https://dash.cloudflare.com/sign-up

## 🚀 快速部署步骤

### 方法 1：使用自动部署脚本（推荐）

1. **运行部署脚本**

```bash
npm run deploy:worker
```

这个脚本会自动：
- ✅ 检查 Worker 文件是否存在
- ✅ 检查 Wrangler 登录状态
- ✅ 如果未登录，提示您登录
- ✅ 部署 Worker

2. **如果提示需要登录**

脚本会自动提示您登录。如果自动登录失败，手动运行：

```bash
wrangler login
```

这会打开浏览器，让您授权 Cloudflare Workers 访问。

### 方法 2：手动部署

如果您想手动控制部署过程：

#### 步骤 1：进入 Worker 目录

```bash
cd worker
```

#### 步骤 2：登录 Cloudflare（如果还没有登录）

```bash
wrangler login
```

这会打开浏览器，让您授权。

#### 步骤 3：部署 Worker

```bash
wrangler deploy
```

部署成功后，您会看到 Worker URL：
```
➜  ✗ wrangler deploy
Total Upload: 2.41 KiB / gzip: 0.76 KiB
Uploaded openai-proxy (2.34 sec)
Published openai-proxy (3.45 sec)
  https://openai-proxy.sosomamahk.workers.dev
```

#### 步骤 4：返回项目根目录

```bash
cd ..
```

## ✅ 验证部署

部署完成后，运行验证脚本：

```bash
npm run verify:worker
```

或者直接在浏览器中访问：
```
https://openai-proxy.sosomamahk.workers.dev/v1/models
```

如果看到 JSON 响应（即使是 401 错误），说明 Worker 已成功部署！

## 🔧 配置应用

部署完成后，确保 `.env` 文件中的配置正确：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://openai-proxy.sosomamahk.workers.dev
```

**重要提示**：
- `OPENAI_BASE_URL` **不要**包含 `/v1` 路径
- URL 必须以 `https://` 开头

如果需要更新配置，运行：

```bash
npm run update:openai-config
```

## 📝 常用命令

### 查看 Worker 列表

```bash
cd worker
wrangler deployments list
```

### 查看 Worker 日志

```bash
cd worker
wrangler tail
```

### 查看 Worker 信息

```bash
cd worker
wrangler whoami
```

### 更新 Worker 代码后重新部署

```bash
npm run deploy:worker
```

或者：

```bash
cd worker
wrangler deploy
```

## 🔍 故障排除

### Q1: 提示 "Not logged in"

**解决方法**：
```bash
wrangler login
```

### Q2: 部署失败，提示权限错误

**解决方法**：
1. 检查 Cloudflare 账户是否有 Workers 访问权限
2. 确认账户有足够的配额（免费账户通常有足够配额）
3. 尝试重新登录：`wrangler logout` 然后 `wrangler login`

### Q3: Worker 部署成功但无法访问

**解决方法**：
1. 检查 Worker URL 是否正确
2. 在 Cloudflare Workers 控制台查看 Worker 状态
3. 查看 Worker 日志排查错误

### Q4: 需要更新 Worker 名称

编辑 `worker/wrangler.toml` 文件，修改 `name` 字段：

```toml
name = "your-worker-name"
```

然后重新部署。

## 📚 相关文件

- Worker 代码: `worker/index.js`
- Worker 配置: `worker/wrangler.toml`
- 部署脚本: `scripts/deploy-worker.js`
- 验证脚本: `scripts/verify-worker-deployment.js`

## 💡 提示

1. **Worker 代码更新后需要重新部署**
   - 修改 `worker/index.js` 后，运行 `npm run deploy:worker`

2. **查看实时日志**
   - 运行 `wrangler tail` 可以查看 Worker 的实时请求日志

3. **测试 Worker**
   - 部署后，在浏览器中访问 Worker URL 测试
   - 或运行 `npm run verify:worker`

## ✅ 部署检查清单

在尝试使用之前，确保：

- [ ] Worker 已成功部署（运行 `npm run deploy:worker`）
- [ ] Worker URL 可以访问（在浏览器中测试）
- [ ] `.env` 文件中的 `OPENAI_BASE_URL` 已设置
- [ ] `OPENAI_BASE_URL` **不包含** `/v1` 路径
- [ ] `OPENAI_API_KEY` 已设置
- [ ] 运行 `npm run verify:worker` 验证配置
- [ ] 应用已重启（环境变量只在启动时加载）

祝您部署顺利！🎉

