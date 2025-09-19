Get-ChildItem *.html | ForEach-Object {
    $content = Get-Content $_.FullName
    $content = $content -replace 'getImageFromPinata', 'getImageUrl'
    Set-Content $_.FullName $content
}
Write-Host "Updated all HTML files to use getImageUrl instead of getImageFromPinata"
