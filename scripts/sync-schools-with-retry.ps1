# WordPress School Data Sync Script with Retry and Progress
# Usage: .\scripts\sync-schools-with-retry.ps1

param(
    [string]$BaseUrl = "",
    [string]$Email = "",
    [string]$Password = ""
)

# If BaseUrl not provided, try to detect or use default
if (-not $BaseUrl) {
    # Try common ports
    $ports = @(3002, 3000, 3001)
    $BaseUrl = "http://localhost:3002"  # Default to 3002 as user mentioned
    
    Write-Host "Using default port 3002. If your server uses a different port," -ForegroundColor Yellow
    Write-Host "run: .\scripts\sync-schools-with-retry.ps1 -BaseUrl 'http://localhost:YOUR_PORT'" -ForegroundColor Yellow
    Write-Host ""
}

# Prompt for email and password if not provided
if (-not $Email) {
    $Email = Read-Host "Enter admin email"
}

if (-not $Password) {
    $SecurePassword = Read-Host "Enter password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WordPress School Data Sync (with Retry)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        identifier = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    if (-not $loginResponse.token) {
        Write-Host "Login failed: $($loginResponse.error)" -ForegroundColor Red
        exit 1
    }

    $token = $loginResponse.token
    Write-Host "Login successful! User: $($loginResponse.user.email)" -ForegroundColor Green
    
    if ($loginResponse.user.role -ne "admin") {
        Write-Host "Error: User is not an admin (role: $($loginResponse.user.role))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Call sync-schools API with longer timeout
Write-Host ""
Write-Host "Step 2: Syncing WordPress school data..." -ForegroundColor Yellow
Write-Host "This may take 15-30 minutes for 1962 schools..." -ForegroundColor Gray
Write-Host "Please be patient and do not close this window." -ForegroundColor Gray
Write-Host ""

try {
    # Use Invoke-WebRequest with longer timeout
    $syncResponse = Invoke-WebRequest -Uri "$BaseUrl/api/admin/sync-schools" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -TimeoutSec 1800 `
        -ErrorAction Stop
    
    $syncData = $syncResponse.Content | ConvertFrom-Json
    
    Write-Host "========================================" -ForegroundColor $(if ($syncData.success) { "Green" } else { "Yellow" })
    if ($syncData.success) {
        Write-Host "Sync completed!" -ForegroundColor Green
    } else {
        Write-Host "Sync completed with errors" -ForegroundColor Yellow
    }
    Write-Host "========================================" -ForegroundColor $(if ($syncData.success) { "Green" } else { "Yellow" })
    Write-Host ""
    
    Write-Host "Sync Results:" -ForegroundColor Cyan
    Write-Host "  Successfully synced: $($syncData.synced) schools" -ForegroundColor $(if ($syncData.synced -gt 0) { "Green" } else { "Red" })
    if ($syncData.errors -gt 0) {
        Write-Host "  Errors: $($syncData.errors)" -ForegroundColor Yellow
        Write-Host "  Total processed: $($syncData.synced + $syncData.errors)" -ForegroundColor White
    } else {
        Write-Host "  Errors: $($syncData.errors)" -ForegroundColor Green
    }
    Write-Host "  Duration: $($syncData.duration)" -ForegroundColor White
    
    if ($syncData.errorsList -and $syncData.errorsList.Count -gt 0) {
        Write-Host ""
        Write-Host "Error List (showing first 10):" -ForegroundColor Yellow
        $syncData.errorsList | Select-Object -First 10 | ForEach-Object {
            Write-Host "  - School ID $($_.wpId): $($_.error)" -ForegroundColor Red
        }
        if ($syncData.errorsList.Count -gt 10) {
            Write-Host "  ... and $($syncData.errorsList.Count - 10) more errors" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "Note: Check server logs for full error details" -ForegroundColor Gray
    }
    
    Write-Host ""
    if ($syncData.synced -gt 0) {
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Check synced schools: npx prisma studio" -ForegroundColor White
        Write-Host "  2. Visit /schools page to verify" -ForegroundColor White
        if ($syncData.errors -gt 0) {
            Write-Host "  3. Run sync again to retry failed schools" -ForegroundColor White
        }
    } else {
        Write-Host "No schools were synced. Check server logs for errors." -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "Sync request failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*timeout*" -or $_.Exception.Message -like "*connection*") {
        Write-Host ""
        Write-Host "Connection timeout detected. This is normal for large syncs." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "1. Check if sync completed in background (check dev server logs)" -ForegroundColor White
        Write-Host "2. Check database to see how many schools were synced:" -ForegroundColor White
        Write-Host "   Run: npx prisma studio" -ForegroundColor Cyan
        Write-Host "   Then check School table" -ForegroundColor White
        Write-Host "3. Try running sync again (it will update existing schools)" -ForegroundColor White
    }
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($errorDetails) {
                Write-Host "Error: $($errorDetails.error)" -ForegroundColor Red
                if ($errorDetails.message) {
                    Write-Host "Details: $($errorDetails.message)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    exit 1
}

