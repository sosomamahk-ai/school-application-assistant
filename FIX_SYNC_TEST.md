# 修复 WordPress 同步测试问题

## 🔍 问题分析

从您的终端输出看，遇到了以下问题：

1. ❌ **使用了示例 URL**：`https://your-app.vercel.app`（这是示例，不是真实 URL）
2. ❌ **PowerShell curl 别名问题**：PowerShell 的 `curl` 是 `Invoke-WebRequest` 的别名，格式不同

## ✅ 解决方案

### 步骤 1: 找到您的真实 Vercel 应用 URL

#### 方法 A: 从 Vercel Dashboard 获取（推荐）

1. 访问：https://vercel.com/dashboard
2. 选择您的项目
3. 在项目页面顶部可以看到域名，例如：
   - `https://school-application-assistant.vercel.app`
   - 或您的自定义域名

#### 方法 B: 从环境变量获取

检查您的 `.env` 文件或 Vercel Dashboard 中的 `NEXT_PUBLIC_APP_URL`：

```powershell
# 检查环境变量
Get-Content .env | Select-String "APP_URL"
```

#### 方法 C: 从代码中查找

根据代码分析，您的应用可能部署在：
- `https://school-application-assistant.vercel.app`

### 步骤 2: 使用正确的 PowerShell 命令测试

已为您创建了测试脚本 `test-wordpress-sync.ps1`，使用方法：

```powershell
# 替换 YOUR_APP_URL 为您的真实 URL
.\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

### 步骤 3: 手动测试（如果脚本不工作）

#### 方法 A: 使用 Invoke-RestMethod（推荐）

```powershell
# 替换为您的真实 URL 和 Secret
$appUrl = "https://school-application-assistant.vercel.app"
$secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
$url = "$appUrl/api/cron/wordpress-sync?secret=$secret"

Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

#### 方法 B: 使用浏览器测试

直接在浏览器中访问（替换为您的真实 URL）：

```
https://school-application-assistant.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A
```

## 🔍 故障排除

### 错误 1: 404 Not Found

**原因：**
- 应用未部署到 Vercel
- URL 不正确
- API 路由不存在

**解决：**
1. 确认应用已部署到 Vercel
2. 确认 URL 正确
3. 检查 `src/pages/api/cron/wordpress-sync.ts` 文件是否存在
4. 重新部署应用

### 错误 2: 401 Unauthorized

**原因：**
- CRON_SECRET 未配置
- Secret 值不匹配

**解决：**
1. 在 Vercel Dashboard 中添加 `CRON_SECRET` 环境变量
2. 确保值匹配：`XCb2Tg10kclvah4jduFHJtGqZErLW58A`
3. 重新部署应用

### 错误 3: 500 Internal Server Error

**原因：**
- WordPress API 连接失败
- 数据库迁移未运行
- 环境变量配置错误

**解决：**
1. 检查 WordPress URL 配置（`WORDPRESS_BASE_URL` 或 `NEXT_PUBLIC_WORDPRESS_BASE_URL`）
2. 运行数据库迁移：`npx prisma migrate deploy`
3. 查看 Vercel 日志获取详细错误信息

## 📋 快速测试清单

- [ ] 找到真实的应用 URL（从 Vercel Dashboard）
- [ ] 确认 `CRON_SECRET` 已配置在 Vercel 环境变量中
- [ ] 确认环境变量值匹配：`XCb2Tg10kclvah4jduFHJtGqZErLW58A`
- [ ] 运行测试脚本或手动测试
- [ ] 检查响应状态码和内容

## 🚀 下一步

1. **找到真实 URL**：访问 Vercel Dashboard 获取
2. **运行测试**：使用测试脚本或手动测试
3. **检查日志**：如果失败，查看 Vercel Functions 日志

## 📝 测试命令模板

```powershell
# 替换为您的真实值
$APP_URL = "https://YOUR_APP_NAME.vercel.app"  # ⚠️ 替换这里
$SECRET = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"

# 测试
$url = "$APP_URL/api/cron/wordpress-sync?secret=$SECRET"
Write-Host "测试 URL: $url" -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

## 📚 相关文档

- 📖 [测试指南](docs/TEST_WORDPRESS_SYNC.md)
- 📖 [快速开始](docs/WORDPRESS_CACHE_QUICKSTART.md)
- 📖 [完整配置](docs/WORDPRESS_CACHE_SYNC.md)

