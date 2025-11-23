# WordPress 缓存同步 - 自动验证脚本
# 使用方法: .\auto-verify.ps1

param(
    [string]$AppUrl = "https://school-application-assistant.vercel.app",
    [string]$Secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
)

Write-Host "`n=== WordPress 缓存同步 - 自动验证 ===" -ForegroundColor Cyan
Write-Host ""

# 步骤 2: 测试 WordPress 同步 API
Write-Host "步骤 2: 测试 WordPress 同步 API..." -ForegroundColor Yellow
$syncUrl = "$AppUrl/api/cron/wordpress-sync?secret=$Secret"
Write-Host "URL: $syncUrl" -ForegroundColor Gray

try {
    $syncResponse = Invoke-RestMethod -Uri $syncUrl -Method GET -ErrorAction Stop -TimeoutSec 60
    Write-Host "✅ 同步 API 测试成功！" -ForegroundColor Green
    Write-Host "  - Success: $($syncResponse.success)" -ForegroundColor White
    if ($syncResponse.stats) {
        Write-Host "  - Profiles: $($syncResponse.stats.profilesCount)" -ForegroundColor White
        Write-Host "  - Universities: $($syncResponse.stats.universitiesCount)" -ForegroundColor White
    }
    if ($syncResponse.cache) {
        Write-Host "  - 缓存后端: $($syncResponse.cache.savedTo -join ', ')" -ForegroundColor White
    }
} catch {
    Write-Host "❌ 同步 API 测试失败" -ForegroundColor Red
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "  状态码: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host ""

# 步骤 4: 测试缓存读取 API
Write-Host "步骤 4: 测试缓存读取 API..." -ForegroundColor Yellow
Write-Host ""

# 4.1 测试缓存读取
Write-Host "4.1 测试缓存读取..." -ForegroundColor Cyan
$cacheUrl = "$AppUrl/api/wordpress/school-profiles-cached"
try {
    $cacheResponse = Invoke-RestMethod -Uri $cacheUrl -Method GET -ErrorAction Stop -TimeoutSec 30
    Write-Host "✅ 缓存读取成功！" -ForegroundColor Green
    if ($cacheResponse.success) {
        Write-Host "  - API 正常工作" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  缓存读取失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 4.2 测试强制刷新
Write-Host "4.2 测试强制刷新..." -ForegroundColor Cyan
$refreshUrl = "$AppUrl/api/wordpress/school-profiles-cached?refresh=true"
try {
    $refreshResponse = Invoke-RestMethod -Uri $refreshUrl -Method GET -ErrorAction Stop -TimeoutSec 60
    Write-Host "✅ 强制刷新成功！" -ForegroundColor Green
} catch {
    Write-Host "⚠️  强制刷新失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 5: 检查 KV 配置
Write-Host "步骤 5: 检查 Vercel KV 配置..." -ForegroundColor Yellow
Write-Host ""
Write-Host "说明:" -ForegroundColor Cyan
Write-Host "  - Vercel KV 需要在 Vercel Dashboard 中配置" -ForegroundColor Gray
Write-Host "  - 访问: Vercel Dashboard > Storage > Create Database > KV" -ForegroundColor Gray
Write-Host "  - 配置后会自动添加环境变量" -ForegroundColor Gray
Write-Host ""

Write-Host "=== 验证完成 ===" -ForegroundColor Green
Write-Host ""

