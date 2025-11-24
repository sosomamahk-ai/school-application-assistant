# Debug script to check name_short extraction
# Usage: .\scripts\debug-name-short.ps1

param(
    [string]$BaseUrl = "http://localhost:3002",
    [string]$Email = "",
    [string]$Password = ""
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Name Short Debug Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for credentials if not provided
if (-not $Email) {
    $Email = Read-Host "Enter admin email"
}

if (-not $Password) {
    $SecurePassword = Read-Host "Enter password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Login
Write-Host "Logging in..." -ForegroundColor Yellow
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
    Write-Host "Login successful!" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking database for name_short status..." -ForegroundColor Yellow
Write-Host ""

Write-Host "To check name_short in database:" -ForegroundColor Cyan
Write-Host "1. Run: npx prisma studio" -ForegroundColor White
Write-Host "2. Open School table" -ForegroundColor White
Write-Host "3. Check nameShort column" -ForegroundColor White
Write-Host "4. Filter: nameShort IS NULL to see schools without name_short" -ForegroundColor White
Write-Host ""

Write-Host "To check WordPress data:" -ForegroundColor Cyan
Write-Host "1. Check server logs when running sync" -ForegroundColor White
Write-Host "2. Look for: [syncAllWPSchools] School X has no name_short" -ForegroundColor White
Write-Host "3. This will show the actual data structure" -ForegroundColor White
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run sync again with updated code" -ForegroundColor White
Write-Host "2. Check server logs for debug output" -ForegroundColor White
Write-Host "3. Verify name_short is being extracted correctly" -ForegroundColor White
Write-Host ""

