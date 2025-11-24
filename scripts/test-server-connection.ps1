# Test server connection script
# Usage: .\scripts\test-server-connection.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host ""
Write-Host "Testing server connection..." -ForegroundColor Cyan
Write-Host "URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# Test 1: Check if port is open
Write-Host "Test 1: Checking if port 3000 is open..." -ForegroundColor Yellow
try {
    $portTest = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($portTest) {
        Write-Host "  ✓ Port 3000 is open" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port 3000 is closed" -ForegroundColor Red
        Write-Host "  → Server is not running. Start it with: npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Cannot test port: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Try to connect to the API
Write-Host "Test 2: Testing API connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"identifier":"test","password":"test"}' `
        -TimeoutSec 5 `
        -ErrorAction Stop
    
    Write-Host "  ✓ Server is responding (status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "  → Server is running!" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*Unable to connect*" -or $_.Exception.Message -like "*connection*") {
        Write-Host "  ✗ Cannot connect to server" -ForegroundColor Red
        Write-Host "  → Server is not running. Start it with: npm run dev" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -like "*timeout*") {
        Write-Host "  ✗ Connection timeout" -ForegroundColor Red
        Write-Host "  → Server might be slow or not responding" -ForegroundColor Yellow
    } else {
        # If we get a 400/401 error, that's actually good - it means server is running
        if ($_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  ✓ Server is responding (got expected error)" -ForegroundColor Green
            Write-Host "  → Server is running!" -ForegroundColor Green
        } else {
            Write-Host "  ? Server response: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Test 3: Check if Node processes are running
Write-Host "Test 3: Checking for Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  ✓ Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "    - PID: $($_.Id), Started: $($_.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ No Node.js processes found" -ForegroundColor Red
    Write-Host "  → Start server with: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($portTest -and $nodeProcesses) {
    Write-Host "✓ Server appears to be running" -ForegroundColor Green
    Write-Host "  If you still get connection errors, try:" -ForegroundColor Yellow
    Write-Host "  1. Wait a few seconds for server to fully start" -ForegroundColor White
    Write-Host "  2. Check the dev server terminal for errors" -ForegroundColor White
    Write-Host "  3. Try accessing http://localhost:3000 in browser" -ForegroundColor White
} else {
    Write-Host "✗ Server is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start the server:" -ForegroundColor Yellow
    Write-Host "  1. Open a new terminal" -ForegroundColor White
    Write-Host "  2. Run: npm run dev" -ForegroundColor Cyan
    Write-Host "  3. Wait for 'Ready' message" -ForegroundColor White
    Write-Host "  4. Then run the sync script again" -ForegroundColor White
}

Write-Host ""

