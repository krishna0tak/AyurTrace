# AyurTrace Project Cleanup Script
# This script removes unnecessary files and folders to clean up the project

Write-Host "Starting AyurTrace project cleanup..." -ForegroundColor Green

# Create a backup list of what we're removing
$itemsToRemove = @()

# Debug and test files
$debugFiles = @(
    "debug.html",
    "debug-create-batch.html", 
    "debug_batches.html",
    "test-button.html",
    "test_dynamic_search.html",
    "pinata-test.html",
    "block_count.html"
)

# Old/duplicate files
$duplicateFiles = @(
    "farmer_new.html",
    "update_images.ps1"
)

# Test directories
$testDirectories = @(
    "backup",
    "test 1",
    "test 2", 
    "test 3 ui correct",
    "AyurTrace-main",
    "extra files",
    "ui copy"
)

Write-Host "`nRemoving debug and test files..." -ForegroundColor Yellow
foreach ($file in $debugFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file" -ForegroundColor Red
        $itemsToRemove += $file
    }
}

Write-Host "`nRemoving duplicate files..." -ForegroundColor Yellow
foreach ($file in $duplicateFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file" -ForegroundColor Red
        $itemsToRemove += $file
    }
}

Write-Host "`nRemoving test directories..." -ForegroundColor Yellow
foreach ($dir in $testDirectories) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "Removed directory: $dir" -ForegroundColor Red
        $itemsToRemove += $dir
    }
}

# Check if auth.html should be removed (if it's redundant with login.html)
if (Test-Path "auth.html" -and Test-Path "login.html") {
    Write-Host "`nFound both auth.html and login.html" -ForegroundColor Yellow
    $response = Read-Host "Remove auth.html? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item "auth.html" -Force
        Write-Host "Removed: auth.html" -ForegroundColor Red
        $itemsToRemove += "auth.html"
    }
}

# Check if enhanced-search.js is still needed
if (Test-Path "enhanced-search.js") {
    Write-Host "`nFound enhanced-search.js" -ForegroundColor Yellow
    $response = Read-Host "Remove enhanced-search.js if functionality moved to main files? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item "enhanced-search.js" -Force
        Write-Host "Removed: enhanced-search.js" -ForegroundColor Red
        $itemsToRemove += "enhanced-search.js"
    }
}

Write-Host "`n=== CLEANUP SUMMARY ===" -ForegroundColor Green
Write-Host "Items removed: $($itemsToRemove.Count)" -ForegroundColor White
foreach ($item in $itemsToRemove) {
    Write-Host "  - $item" -ForegroundColor Gray
}

Write-Host "`nCleanup completed successfully!" -ForegroundColor Green
Write-Host "Remaining core files:" -ForegroundColor Cyan
Get-ChildItem -Name | Where-Object { $_ -match '\.(html|js|css|json|py|sol)$' } | Sort-Object