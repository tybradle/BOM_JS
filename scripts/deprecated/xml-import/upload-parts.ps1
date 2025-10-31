# Upload parts.xml to the master parts import API
Write-Host "==========================================================="
Write-Host "Master Parts Database Upload"
Write-Host "==========================================================="
Write-Host ""

$filePath = "Samples\Import Sample\parts.xml"
$uri = "http://127.0.0.1:3002/api/parts/import"

Write-Host "File: parts.xml"
$fileInfo = Get-Item $filePath
$sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
Write-Host "Size: $sizeMB MB"
Write-Host "Target: $uri"
Write-Host ""

Write-Host "Uploading file (this may take a few minutes)..."
Write-Host ""

try {
    # Use WebRequest for file upload compatibility
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBin = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))
    $fileName = Split-Path $filePath -Leaf
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: application/xml",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBin),
        "--$boundary--"
    ) -join "`r`n"
    
    $result = Invoke-RestMethod -Uri $uri -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines -TimeoutSec 600
    
    Write-Host "[SUCCESS] Upload complete!"
    Write-Host ""
    Write-Host "==========================================================="
    Write-Host "Import Summary"
    Write-Host "==========================================================="
    Write-Host ""
    
    if ($result.summary) {
        Write-Host "Total Parsed:  $($result.summary.totalParsed)"
        Write-Host "New Records:   $($result.summary.imported)"
        Write-Host "Updated:       $($result.summary.updated)"
        Write-Host "Errors:        $($result.summary.errors)"
        if ($result.summary.duration) {
            Write-Host "Duration:      $($result.summary.duration)"
        }
        Write-Host ""
        
        $successRate = [math]::Round((($result.summary.totalParsed - $result.summary.errors) / $result.summary.totalParsed) * 100, 1)
        Write-Host "Success Rate:  $successRate%"
        
        if ($result.summary.errors -gt 0) {
            Write-Host ""
            Write-Host "[WARNING] $($result.summary.errors) parts skipped due to missing required fields"
        }
    } else {
        Write-Host ($result | ConvertTo-Json -Depth 10)
    }
    
    Write-Host ""
    Write-Host "==========================================================="
    Write-Host ""
    Write-Host "Next Steps:"
    Write-Host "   1. Verify records: npx prisma studio"
    Write-Host "   2. Test search: npx tsx scripts\test-search-api.ts"
    Write-Host "   3. Use part catalog in BOM UI"
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Upload failed!"
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Troubleshooting:"
    Write-Host "  - Ensure dev server is running: npm run dev"
    Write-Host "  - Check server logs for errors"
    Write-Host "  - Verify enough disk space"
    Write-Host ""
    exit 1
}
