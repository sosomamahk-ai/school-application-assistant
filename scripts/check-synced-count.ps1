# Check how many schools have been synced
# Usage: .\scripts\check-synced-count.ps1

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$Email = "",
    [string]$Password = ""
)

# Prompt for credentials if not provided
if (-not $Email) {
    $Email = Read-Host "Enter admin email"
}

if (-not $Password) {
    $SecurePassword = Read-Host "Enter password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "Checking synced schools count..." -ForegroundColor Cyan
Write-Host ""

# Login to get token
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
    
    # Call a simple API to check count (we'll create this endpoint)
    # For now, just show login success
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To check synced count, you need to:" -ForegroundColor Yellow
    Write-Host "1. Use Prisma Studio: npx prisma studio" -ForegroundColor White
    Write-Host "2. Or use a database tool to run:" -ForegroundColor White
    Write-Host "   SELECT COUNT(*) FROM ""School"" WHERE ""wpId"" IS NOT NULL;" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

