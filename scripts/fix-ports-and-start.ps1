# Fix port conflicts and start server
# Usage: .\scripts\fix-ports-and-start.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Port Cleanup and Server Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check which ports are in use
Write-Host "Step 1: Checking port usage..." -ForegroundColor Yellow
$ports = @(3000, 3001, 3002)
$usedPorts = @()

foreach ($port in $ports) {
    $connection = netstat -ano | findstr ":$port "
    if ($connection) {
        Write-Host "  Port $port is in use" -ForegroundColor Red
        $usedPorts += $port
        
        # Extract PID
        $pidMatch = $connection | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
        if ($pidMatch) {
            $process = Get-Process -Id $pidMatch -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "    Process: $($process.ProcessName) (PID: $pidMatch)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  Port $port is available" -ForegroundColor Green
    }
}

Write-Host ""

# Step 2: Ask user what to do
if ($usedPorts.Count -gt 0) {
    Write-Host "Step 2: Port cleanup options" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Kill processes using ports 3000 and 3001 (recommended)" -ForegroundColor Cyan
    Write-Host "Option 2: Use port 3002 (if available)" -ForegroundColor Cyan
    Write-Host "Option 3: Cancel" -ForegroundColor Cyan
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1/2/3)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "Killing processes on ports 3000 and 3001..." -ForegroundColor Yellow
        
        foreach ($port in @(3000, 3001)) {
            $connections = netstat -ano | findstr ":$port " | findstr "LISTENING"
            $connections | ForEach-Object {
                $pidMatch = $_ | Select-String -Pattern "LISTENING\s+(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
                if ($pidMatch) {
                    try {
                        Stop-Process -Id $pidMatch -Force -ErrorAction SilentlyContinue
                        Write-Host "  Killed process on port $port (PID: $pidMatch)" -ForegroundColor Green
                    } catch {
                        Write-Host "  Could not kill process on port $port (PID: $pidMatch)" -ForegroundColor Red
                    }
                }
            }
        }
        
        Start-Sleep -Seconds 2
        Write-Host ""
        Write-Host "Ports cleared. You can now start server with: npm run dev" -ForegroundColor Green
        Write-Host "Or specify port: npm run dev -- -p 3002" -ForegroundColor Cyan
        
    } elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "To use port 3002, run:" -ForegroundColor Cyan
        Write-Host "  npm run dev -- -p 3002" -ForegroundColor White
        Write-Host ""
        Write-Host "Then use sync script with:" -ForegroundColor Cyan
        Write-Host "  .\scripts\sync-schools-with-retry.ps1 -BaseUrl 'http://localhost:3002'" -ForegroundColor White
        
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "All ports are available. You can start server with:" -ForegroundColor Green
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host "Or specify port:" -ForegroundColor Green
    Write-Host "  npm run dev -- -p 3002" -ForegroundColor White
}

Write-Host ""

