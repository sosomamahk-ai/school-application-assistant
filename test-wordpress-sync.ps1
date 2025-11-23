# WordPress 同步 API 测试脚本
# 使用方法: .\test-wordpress-sync.ps1 -AppUrl "https://your-app.vercel.app" -Secret "your-secret"

param(
    [Parameter(Mandatory=$true)]
    [string]$AppUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Secret
)

$url = "$AppUrl/api/cron/wordpress-sync?secret=$Secret"

Write-Host "`n=== WordPress 同步 API 测试 ===" -ForegroundColor Cyan
Write-Host "应用 URL: $AppUrl" -ForegroundColor Yellow
Write-Host "测试 URL: $url" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "正在发送请求..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
    
    Write-Host "`n✅ 成功！" -ForegroundColor Green
    Write-Host "`n响应内容：" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host "`n📊 同步统计：" -ForegroundColor Green
        if ($response.stats) {
            Write-Host "  - Profiles: $($response.stats.profilesCount)" 
            Write-Host "  - Universities: $($response.stats.universitiesCount)"
            Write-Host "  - Total: $($response.stats.totalCount)"
        }
        if ($response.cache) {
            Write-Host "`n💾 缓存信息：" -ForegroundColor Green
            Write-Host "  - 已保存到: $($response.cache.savedTo -join ', ')"
            if ($response.cache.errors) {
                Write-Host "  - 错误: $($response.cache.errors -join ', ')" -ForegroundColor Yellow
            }
        }
        if ($response.duration) {
            Write-Host "`n⏱️  耗时: $($response.duration)" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "`n❌ 请求失败！" -ForegroundColor Red
    Write-Host "错误类型: $($_.Exception.GetType().Name)" -ForegroundColor Yellow
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "`n📋 HTTP 状态码: $statusCode" -ForegroundColor Yellow
        
        # 根据状态码提供帮助信息
        switch ($statusCode) {
            401 {
                Write-Host "`n💡 提示: 401 Unauthorized" -ForegroundColor Yellow
                Write-Host "   - API 存在，但认证失败" -ForegroundColor Gray
                Write-Host "   - 请检查 CRON_SECRET 是否正确配置在 Vercel 环境变量中" -ForegroundColor Gray
                Write-Host "   - 确保 secret 值匹配: $Secret" -ForegroundColor Gray
            }
            404 {
                Write-Host "`n💡 提示: 404 Not Found" -ForegroundColor Yellow
                Write-Host "   - API 路由不存在或未部署" -ForegroundColor Gray
                Write-Host "   - 检查应用 URL 是否正确: $AppUrl" -ForegroundColor Gray
                Write-Host "   - 确认文件存在: src/pages/api/cron/wordpress-sync.ts" -ForegroundColor Gray
                Write-Host "   - 可能需要重新部署到 Vercel" -ForegroundColor Gray
            }
            500 {
                Write-Host "`n💡 提示: 500 Internal Server Error" -ForegroundColor Yellow
                Write-Host "   - 服务器内部错误" -ForegroundColor Gray
                Write-Host "   - 查看 Vercel Dashboard > Functions > Logs 获取详细信息" -ForegroundColor Gray
                Write-Host "   - 可能原因：" -ForegroundColor Gray
                Write-Host "     • 数据库迁移未运行" -ForegroundColor Gray
                Write-Host "     • WordPress API 连接失败" -ForegroundColor Gray
                Write-Host "     • 环境变量配置错误" -ForegroundColor Gray
            }
            default {
                Write-Host "`n💡 提示: 状态码 $statusCode" -ForegroundColor Yellow
            }
        }
        
        # 尝试读取响应内容
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            if ($responseBody) {
                Write-Host "`n响应内容：" -ForegroundColor Yellow
                Write-Host $responseBody -ForegroundColor Gray
            }
        } catch {
            # 忽略读取错误
        }
    } else {
        Write-Host "`n💡 提示: 可能是网络连接问题" -ForegroundColor Yellow
        Write-Host "   - 检查网络连接" -ForegroundColor Gray
        Write-Host "   - 确认 URL 可访问: $AppUrl" -ForegroundColor Gray
    }
    
    Write-Host ""
    exit 1
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Cyan
Write-Host ""

