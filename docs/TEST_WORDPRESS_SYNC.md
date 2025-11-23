# WordPress 同步 API 测试指南

## 问题诊断

从你的终端输出看，遇到了以下问题：

1. ❌ 使用了示例 URL `https://your-app.vercel.app`（需要替换为真实 URL）
2. ❌ PowerShell 中的 `curl` 是 `Invoke-WebRequest` 别名，格式不同

## 解决方案

### 步骤 1: 找到您的真实 Vercel 应用 URL

#### 方法 A: 从 Vercel Dashboard 获取

1. 访问 https://vercel.com/dashboard
2. 选择您的项目
3. 在项目页面顶部可以看到域名，例如：
   - `https://school-application-assistant.vercel.app`
   - 或您的自定义域名

#### 方法 B: 从环境变量获取

检查 `.env` 文件或 Vercel Dashboard 中的环境变量：

```bash
# 查看环境变量
cat .env | findstr URL
# 或
Get-Content .env | Select-String "URL"
```

#### 方法 C: 从 Git 提交历史获取

如果有部署过，Git 提交历史或 README 中可能有 URL。

### 步骤 2: 使用正确的 PowerShell 命令测试

PowerShell 中的 `curl` 实际上是 `Invoke-WebRequest`，语法不同。

#### 方法 A: 使用 Invoke-WebRequest（推荐）

```powershell
# 替换 YOUR_APP_URL 和 YOUR_SECRET
$url = "https://YOUR_APP_URL.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A"
Invoke-WebRequest -Uri $url -Method GET | Select-Object -ExpandProperty Content
```

#### 方法 B: 使用 curl.exe（Windows 10+）

```powershell
# 使用完整路径的 curl.exe
curl.exe "https://YOUR_APP_URL.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

#### 方法 C: 使用临时 PowerShell 脚本

创建测试脚本：

```powershell
# test-sync.ps1
$appUrl = "https://YOUR_APP_URL.vercel.app"  # 替换为真实 URL
$secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"  # 你生成的 secret

$url = "$appUrl/api/cron/wordpress-sync?secret=$secret"

try {
    Write-Host "测试同步 API..." -ForegroundColor Yellow
    Write-Host "URL: $url" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $url -Method GET -ContentType "application/json"
    
    Write-Host "`n✅ 成功！" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "`n❌ 失败！" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "状态码: $statusCode" -ForegroundColor Yellow
        
        # 尝试读取响应内容
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "响应: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "无法读取响应内容" -ForegroundColor Yellow
        }
    }
}
```

运行脚本：

```powershell
# 先编辑脚本，替换 YOUR_APP_URL
.\test-sync.ps1
```

### 步骤 3: 验证配置

#### 检查环境变量是否已配置

在 Vercel Dashboard 中检查：

1. Settings > Environment Variables
2. 确认 `CRON_SECRET` 已配置
3. 确认值是否匹配（`XCb2Tg10kclvah4jduFHJtGqZErLW58A`）

#### 检查 API 路由是否部署

访问以下 URL（不需要 secret）：

```powershell
# 测试 API 是否存在（应该返回 401 Unauthorized，不是 404）
$url = "https://YOUR_APP_URL.vercel.app/api/cron/wordpress-sync"
Invoke-WebRequest -Uri $url -Method GET
```

**预期结果：**
- ✅ **401 Unauthorized** - API 存在，但需要认证（正常）
- ❌ **404 Not Found** - API 不存在，可能未部署

如果返回 404，可能原因：
1. 代码未部署到 Vercel
2. 文件路径不正确
3. 需要重新部署

### 步骤 4: 本地测试（如果应用未部署）

如果应用还未部署到 Vercel，可以先本地测试：

```powershell
# 启动开发服务器
npm run dev

# 在另一个终端测试（使用本地 URL）
$url = "http://localhost:3000/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

## 快速测试命令（复制粘贴）

### 替换这些变量后使用：

```powershell
# 1. 设置变量（替换为你的实际值）
$APP_URL = "https://YOUR_APP_NAME.vercel.app"  # ⚠️ 替换
$SECRET = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"    # ⚠️ 替换

# 2. 测试同步 API
$url = "$APP_URL/api/cron/wordpress-sync?secret=$SECRET"
Write-Host "测试 URL: $url" -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

### 一键测试脚本

保存为 `test-wordpress-sync.ps1`：

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$AppUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Secret
)

$url = "$AppUrl/api/cron/wordpress-sync?secret=$Secret"

Write-Host "`n=== WordPress 同步 API 测试 ===" -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
    
    Write-Host "✅ 成功！" -ForegroundColor Green
    Write-Host "`n响应内容：" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host "`n同步统计：" -ForegroundColor Green
        Write-Host "  - Profiles: $($response.stats.profilesCount)" 
        Write-Host "  - Universities: $($response.stats.universitiesCount)"
        Write-Host "  - 缓存后端: $($response.cache.savedTo -join ', ')"
    }
    
} catch {
    Write-Host "❌ 失败！" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "状态码: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 401) {
            Write-Host "`n提示: 401 表示认证失败，请检查 CRON_SECRET 是否正确配置" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "`n提示: 404 表示 API 不存在，可能需要部署代码到 Vercel" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
```

使用方法：

```powershell
# 运行测试脚本
.\test-wordpress-sync.ps1 -AppUrl "https://your-app.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

## 常见错误及解决方案

### 错误 1: 404 Not Found

**原因：**
- 应用未部署到 Vercel
- URL 不正确
- API 路由文件不存在

**解决：**
1. 检查 Vercel Dashboard 确认应用已部署
2. 确认 URL 正确
3. 检查 `src/pages/api/cron/wordpress-sync.ts` 文件是否存在

### 错误 2: 401 Unauthorized

**原因：**
- CRON_SECRET 未配置
- Secret 值不匹配

**解决：**
1. 在 Vercel Dashboard 中添加 `CRON_SECRET` 环境变量
2. 确保值匹配（`XCb2Tg10kclvah4jduFHJtGqZErLW58A`）
3. 重新部署应用

### 错误 3: 500 Internal Server Error

**原因：**
- WordPress API 连接失败
- 数据库迁移未运行
- 环境变量配置错误

**解决：**
1. 检查 WordPress URL 配置
2. 运行数据库迁移：`npx prisma migrate deploy`
3. 查看 Vercel 日志获取详细错误信息

## 下一步

1. ✅ 找到真实的应用 URL
2. ✅ 使用正确的 PowerShell 命令测试
3. ✅ 验证环境变量配置
4. ✅ 检查 Vercel 日志获取详细错误信息

如果仍有问题，请提供：
- Vercel Dashboard 中的实际应用 URL
- 完整的错误响应
- Vercel Functions 日志

