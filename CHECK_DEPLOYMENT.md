# 检查 API 404 问题

## 诊断结果

### 文件状态检查

✅ **文件已在 Git 中**
- `src/pages/api/cron/wordpress-sync.ts` ✅
- `src/pages/api/wordpress/school-profiles-cached.ts` ✅
- `src/services/wordpressCache.ts` ✅

✅ **没有未推送的提交**
- 所有提交都已推送到 GitHub

## 可能的原因

既然文件已在 Git 中且已推送，API 仍然 404 的可能原因：

### 1. Vercel 还没有重新部署

即使代码已推送，Vercel 可能：
- 还在部署中
- 需要手动触发重新部署
- 部署失败但没有注意到

**解决：**
1. 访问 Vercel Dashboard > Deployments
2. 检查最新的部署状态
3. 如果失败，查看构建日志
4. 如果需要，手动触发重新部署

### 2. Vercel 部署的是其他分支

可能 Vercel 配置的部署分支不是 master/main。

**检查：**
1. 访问 Vercel Dashboard > Settings > Git
2. 确认 Production Branch 是 `master` 或 `main`

### 3. 文件路径问题

虽然文件在 Git 中，但可能在错误的路径。

**检查：**
```bash
git ls-files src/pages/api/cron/
```

### 4. Vercel 缓存问题

Vercel 的 CDN 缓存可能导致旧版本仍然在线。

**解决：**
1. 等待 5-10 分钟
2. 在 URL 后添加随机参数测试：`?t=1234567890`
3. 使用无缓存测试

### 5. 构建失败

可能 Vercel 构建失败，导致 API 路由没有生成。

**检查：**
1. 访问 Vercel Dashboard > Deployments
2. 查看最新部署的构建日志
3. 检查是否有构建错误

## 诊断步骤

### 步骤 1: 检查 Vercel 部署状态

1. 访问：https://vercel.com/dashboard
2. 选择项目：`school-application-assistant`
3. 前往 **Deployments** 标签
4. 检查最新部署：
   - ✅ Ready - 部署成功
   - ⏳ Building - 正在部署
   - ❌ Error - 部署失败

### 步骤 2: 检查构建日志

如果有部署，点击查看构建日志，检查：
- 是否有错误
- API 路由是否被正确编译
- 是否有 TypeScript/ESLint 错误

### 步骤 3: 手动触发重新部署

如果需要：

1. 在 Vercel Dashboard > Deployments
2. 点击最新部署右侧的 **...** > **Redeploy**
3. 或点击 **Deployments** 页面的 **Redeploy** 按钮

### 步骤 4: 检查 API 路由编译

在构建日志中，应该看到：
```
✓ Compiled successfully
...
ƒ /api/cron/wordpress-sync
```

如果看到这个，说明 API 路由已编译。

### 步骤 5: 测试 API（使用时间戳避免缓存）

```powershell
$appUrl = "https://school-application-assistant.vercel.app"
$secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$url = "$appUrl/api/cron/wordpress-sync?secret=$secret&t=$timestamp"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

## 快速修复脚本

### 检查并推送脚本

```powershell
# check-and-deploy.ps1
Write-Host "=== 检查和部署 WordPress 同步 API ===" -ForegroundColor Cyan
Write-Host ""

# 检查文件是否存在
$files = @(
    "src/pages/api/cron/wordpress-sync.ts",
    "src/pages/api/wordpress/school-profiles-cached.ts",
    "src/services/wordpressCache.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file (存在)" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (不存在)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "检查 Git 状态..." -ForegroundColor Cyan

# 检查是否有未提交的更改
$status = git status --short
if ($status) {
    Write-Host "`n⚠️  有未提交的更改:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "  $_" }
    Write-Host "`n是否提交并推送? (Y/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        git add .
        git commit -m "Add WordPress cache sync system"
        git push origin master
        Write-Host "`n✅ 已推送！等待 Vercel 部署（2-3 分钟）" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 没有未提交的更改" -ForegroundColor Green
}

# 检查是否有未推送的提交
$unpushed = git log origin/master..HEAD --oneline 2>$null
if ($unpushed) {
    Write-Host "`n⚠️  有未推送的提交:" -ForegroundColor Yellow
    $unpushed | ForEach-Object { Write-Host "  $_" }
    Write-Host "`n是否推送? (Y/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        git push origin master
        Write-Host "`n✅ 已推送！等待 Vercel 部署（2-3 分钟）" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 所有提交已推送" -ForegroundColor Green
}

Write-Host ""
Write-Host "下一步:" -ForegroundColor Cyan
Write-Host "  1. 访问 Vercel Dashboard 检查部署状态" -ForegroundColor White
Write-Host "  2. 等待部署完成后测试 API" -ForegroundColor White
Write-Host "  3. 如果还是 404，检查构建日志" -ForegroundColor White
Write-Host ""
```

## 最终检查清单

- [ ] 文件在 Git 中 ✅
- [ ] 所有提交已推送 ✅
- [ ] Vercel 部署状态正常？
- [ ] 构建日志无错误？
- [ ] API 路由已编译？
- [ ] 等待 CDN 缓存刷新？

## 如果问题仍然存在

1. **检查 Vercel 构建日志**获取详细错误信息
2. **本地测试构建**：`npm run build`
3. **检查 Vercel 配置**：确认部署分支正确
4. **查看 Vercel Functions 日志**：查看运行时错误

