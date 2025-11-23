# 推送代码到 GitHub 以修复 API 404

## 问题诊断

API 返回 404 的原因是：**新创建的 API 文件还没有推送到 GitHub，Vercel 无法部署**

## 检查文件状态

文件可能已经在本地提交，但还没有推送到 GitHub。检查步骤：

### 步骤 1: 检查文件是否在 Git 中

```bash
git ls-files | findstr "wordpress-sync\|school-profiles-cached\|wordpressCache"
```

如果看到文件列表，说明文件已在 Git 中。

### 步骤 2: 检查是否有未推送的提交

```bash
git log origin/master..HEAD --oneline
```

如果有输出，说明有未推送的提交。

### 步骤 3: 推送到 GitHub

```bash
git push origin master
```

或者如果您的默认分支是 main：

```bash
git push origin main
```

## 如果文件还没有提交

如果文件还没有提交，执行以下命令：

```bash
# 添加新文件
git add src/pages/api/cron/wordpress-sync.ts
git add src/pages/api/wordpress/school-profiles-cached.ts
git add src/services/wordpressCache.ts
git add vercel.json
git add prisma/schema.prisma
git add prisma/migrations/20251123151458_add_wordpress_profile_cache/

# 提交
git commit -m "Add WordPress cache sync system with Cron Jobs"

# 推送
git push origin master  # 或 main
```

## 快速操作脚本

### PowerShell 脚本

保存为 `push-to-deploy.ps1`：

```powershell
Write-Host "=== 推送代码到 GitHub ===" -ForegroundColor Cyan

# 检查是否有未提交的更改
$status = git status --short
if ($status) {
    Write-Host "`n发现有未提交的更改，正在添加..." -ForegroundColor Yellow
    git add src/pages/api/cron/wordpress-sync.ts
    git add src/pages/api/wordpress/school-profiles-cached.ts
    git add src/services/wordpressCache.ts
    git add vercel.json
    git add prisma/schema.prisma
    git add prisma/migrations/20251123151458_add_wordpress_profile_cache/
    
    Write-Host "`n提交更改..." -ForegroundColor Yellow
    git commit -m "Add WordPress cache sync system with Cron Jobs"
} else {
    Write-Host "`n没有未提交的更改" -ForegroundColor Green
}

# 检查是否有未推送的提交
$unpushed = git log origin/master..HEAD --oneline 2>$null
if ($unpushed) {
    Write-Host "`n发现有未推送的提交：" -ForegroundColor Yellow
    $unpushed | ForEach-Object { Write-Host "  $_" }
    
    Write-Host "`n推送到 GitHub..." -ForegroundColor Yellow
    git push origin master
    
    Write-Host "`n✅ 已推送到 GitHub！" -ForegroundColor Green
    Write-Host "Vercel 将自动部署（约 2-3 分钟）" -ForegroundColor Cyan
} else {
    Write-Host "`n所有提交已推送" -ForegroundColor Green
}

Write-Host ""
```

### 使用方法

```powershell
.\push-to-deploy.ps1
```

## 验证部署

推送完成后：

1. **等待 Vercel 自动部署**
   - 访问：https://vercel.com/dashboard
   - 选择项目：`school-application-assistant`
   - 查看 **Deployments** 标签
   - 等待新的部署完成（约 2-3 分钟）

2. **测试 API**
   ```powershell
   .\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
   ```

3. **或者使用浏览器测试**
   ```
   https://school-application-assistant.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A
   ```

## 常见问题

### 问题 1: Git push 失败 - 需要先 pull

**错误：** `Updates were rejected because the remote contains work`

**解决：**
```bash
git pull origin master  # 或 main
# 如果有冲突，解决冲突后
git push origin master  # 或 main
```

### 问题 2: 推送后还是 404

**原因：**
- Vercel 部署还在进行中
- CDN 缓存还没有刷新

**解决：**
1. 等待部署完全完成（检查 Vercel Dashboard）
2. 等待 2-5 分钟让 CDN 缓存刷新
3. 使用无缓存测试：添加时间戳参数

### 问题 3: Vercel 构建失败

**原因：** 构建过程中有错误

**解决：**
1. 在 Vercel Dashboard 查看构建日志
2. 本地运行 `npm run build` 检查是否有错误
3. 修复错误后重新推送

## 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 等待 Vercel 自动部署（2-3 分钟）
3. ✅ 测试 API
4. ✅ 如果还是 404，等待几分钟让 CDN 缓存刷新

