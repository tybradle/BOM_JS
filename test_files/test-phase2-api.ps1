# Phase 2 Testing Script (PowerShell)

Write-Host "=== Phase 2: Auto-Add Missing Parts - API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Batch Create API - Success Case
Write-Host "Test 1: Create new parts" -ForegroundColor Yellow
$parts = @(
    @{
        partNumber = "TEST-NEW-001"
        manufacturer = "Test Manufacturer"
        description = "Test Part 1"
        category = "Test Category"
        unitPrice = 25.50
        currency = "USD"
    },
    @{
        partNumber = "TEST-NEW-002"
        manufacturer = "Test Manufacturer"
        description = "Test Part 2"
        category = "Test Category"
        unitPrice = 35.75
        currency = "USD"
    }
)

$body = @{
    parts = $parts
    source = "test-script"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/parts/batch-create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ Response:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 2: Check if parts exist
Write-Host "Test 2: Check if parts were created" -ForegroundColor Yellow
$checkBody = @{
    partNumbers = @("TEST-NEW-001", "TEST-NEW-002")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/parts/check-missing" `
        -Method POST `
        -ContentType "application/json" `
        -Body $checkBody
    
    Write-Host "✓ Response:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 3: Try to create same parts again (should skip)
Write-Host "Test 3: Try creating same parts again (should skip)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/parts/batch-create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ Response:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 4: Create part with missing required fields (should validate)
Write-Host "Test 4: Create part with missing manufacturer (should fail validation)" -ForegroundColor Yellow
$invalidPart = @{
    parts = @(
        @{
            partNumber = "TEST-INVALID-001"
            manufacturer = ""
            description = "Invalid Part"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/parts/batch-create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidPart
    
    Write-Host "✓ Response:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host ""
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Test the full import flow through the UI" -ForegroundColor Cyan
Write-Host "1. Navigate to a BOM project"
Write-Host "2. Upload test_files/phase1-test-all-new.csv"
Write-Host "3. Verify checkbox appears with correct count"
Write-Host "4. Click Import and verify parts are added to database"
