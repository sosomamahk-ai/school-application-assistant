# Check sync errors and partial results
# Usage: .\scripts\check-sync-errors.ps1

param(
    [string]$BaseUrl = "http://localhost:3002"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync Error Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The error 'Sync completed with errors' means:" -ForegroundColor Yellow
Write-Host "  - Sync process ran" -ForegroundColor White
Write-Host "  - Some schools were synced successfully" -ForegroundColor White
Write-Host "  - Some schools had errors" -ForegroundColor White
Write-Host ""

Write-Host "To check results:" -ForegroundColor Cyan
Write-Host "1. Check how many schools were synced:" -ForegroundColor White
Write-Host "   Run: npx prisma studio" -ForegroundColor Gray
Write-Host "   Then check School table" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Check server logs for detailed errors:" -ForegroundColor White
Write-Host "   Look at the terminal where 'npm run dev' is running" -ForegroundColor Gray
Write-Host "   Search for: [syncAllWPSchools] Error syncing school" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Common causes of errors:" -ForegroundColor Yellow
Write-Host "   - Database connection issues" -ForegroundColor White
Write-Host "   - Unique constraint violations (duplicate wpId)" -ForegroundColor White
Write-Host "   - Missing required fields" -ForegroundColor White
Write-Host "   - Network timeout during sync" -ForegroundColor White
Write-Host ""

Write-Host "4. If some schools synced successfully:" -ForegroundColor Green
Write-Host "   - You can run sync again (it will update existing schools)" -ForegroundColor White
Write-Host "   - Only failed schools will be retried" -ForegroundColor White
Write-Host ""

Write-Host "5. To see detailed error list:" -ForegroundColor Cyan
Write-Host "   Check the server terminal logs" -ForegroundColor White
Write-Host "   Or check the API response (if you have access to it)" -ForegroundColor White
Write-Host ""

