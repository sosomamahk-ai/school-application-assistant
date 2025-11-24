# WordPress School Data Sync Script
# Usage: .\scripts\sync-schools.ps1

param(
    [string]$BaseUrl = "http://localhost:3002",
    [string]$Email = "",
    [string]$Password = ""
)

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
Write-Host "WordPress School Data Sync" -ForegroundColor Cyan
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
    
    # Check if user is admin
    if ($loginResponse.user.role -ne "admin") {
        Write-Host "Error: User is not an admin (role: $($loginResponse.user.role))" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 2: Call sync-schools API
Write-Host ""
Write-Host "Step 2: Syncing WordPress school data..." -ForegroundColor Yellow
Write-Host "This may take a few minutes, please wait..." -ForegroundColor Gray
Write-Host ""

try {
    $syncResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/sync-schools" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -ErrorAction Stop
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Sync completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Sync Results:" -ForegroundColor Cyan
    Write-Host "  Successfully synced: $($syncResponse.synced) schools" -ForegroundColor White
    if ($syncResponse.errors -gt 0) {
        Write-Host "  Errors: $($syncResponse.errors)" -ForegroundColor Yellow
    } else {
        Write-Host "  Errors: $($syncResponse.errors)" -ForegroundColor Green
    }
    Write-Host "  Duration: $($syncResponse.duration)" -ForegroundColor White
    
    if ($syncResponse.errorsList -and $syncResponse.errorsList.Count -gt 0) {
        Write-Host ""
        Write-Host "Error List:" -ForegroundColor Yellow
        $syncResponse.errorsList | ForEach-Object {
            Write-Host "  - School ID $($_.wpId): $($_.error)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Next step: Visit /schools page to verify all schools show name_short" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "Sync request failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($errorDetails) {
                Write-Host "Error: $($errorDetails.error)" -ForegroundColor Red
                if ($errorDetails.message) {
                    Write-Host "Details: $($errorDetails.message)" -ForegroundColor Red
                }
            } else {
                Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    exit 1
}
