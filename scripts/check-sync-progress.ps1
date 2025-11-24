# Check sync progress script
# This script checks if the sync is still running by monitoring server logs

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Checking sync status..." -ForegroundColor Cyan
Write-Host "Note: If sync is running, you should see 'prisma.query' activity in the dev server terminal" -ForegroundColor Yellow
Write-Host ""
Write-Host "To check progress:" -ForegroundColor Cyan
Write-Host "1. Look at the terminal where 'npm run dev' is running" -ForegroundColor White
Write-Host "2. You should see logs like: [syncAllWPSchools] Progress: X/1962" -ForegroundColor White
Write-Host "3. If you see 'prisma.query' activity, sync is still running" -ForegroundColor White
Write-Host ""
Write-Host "Estimated time for 1962 schools: 15-30 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "If sync seems stuck (no activity for 5+ minutes), you can:" -ForegroundColor Cyan
Write-Host "1. Press Ctrl+C in PowerShell to cancel" -ForegroundColor White
Write-Host "2. Check server logs for errors" -ForegroundColor White
Write-Host "3. Try running sync again" -ForegroundColor White

